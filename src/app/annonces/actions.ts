"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerAgent, exigerUtilisateur } from "@/lib/session"
import { filtreProprietaire, peutVoir } from "@/lib/authz"
import { AnnonceInput, annonceModificationInput, IdInput, QuestionInput, ReponseInput } from "@/lib/shema"
import { erreursDe, valeursDuFormulaire, type EtatFormulaire } from "@/lib/form"
import { ecrireSurDisque, fichiersDuFormulaire, preparerPhotos, supprimerFichiers } from "@/lib/photos-serveur"

import { unlink } from "node:fs/promises"
import path from "node:path"
import { DOSSIER_UPLOADS } from "@/lib/photos"

// Création d'une annonce (agent ou admin)
export async function creerAnnonce(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  // Authentification puis autorisation par rôle
  const user = await exigerAgent()

  // Validation
  const valeurs = valeursDuFormulaire(formData)
  const parsed = AnnonceInput.safeParse({ statutBien: "DISPONIBLE", ...valeurs })
  // Photos facultatives à la création. On valide TOUT avant d'écrire quoi que ce soit :
  // une photo invalide ne doit pas laisser une annonce créée à moitié.
  const photos = await preparerPhotos(fichiersDuFormulaire(formData), 0, true)
  if (!parsed.success || !photos.ok) {
    return {
      erreurs: {
        ...(parsed.success ? {} : erreursDe(parsed.error)),
        ...(photos.ok ? {} : photos.erreurs),
      },
      valeurs,
    }
  }

  //  Écriture 
  // Fichiers sur le disque, puis annonce + photos en UNE écriture en base (atomique).
  // Si la base échoue, on supprime les fichiers déjà écrits.
  const ecrits = await ecrireSurDisque(photos.photos)
  let annonce
  try {
    annonce = await prisma.annonce.create({
      data: {
        ...parsed.data,
        auteurId: user.id,
        photos: { create: ecrits.map((nom) => ({ url: `/photos/${nom}` })) },
      },
    })
  } catch (e) {
    await supprimerFichiers(ecrits)
    throw e
  }

  revalidatePath("/annonces")
  redirect(`/annonces/${annonce.id}`)
}

// Modification : le propriétaire (ou un admin) uniquement
export async function modifierAnnonce(
  rawId: unknown,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const user = await exigerAgent()

  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  const valeurs = valeursDuFormulaire(formData)
  // On lit la date enregistrée (en vérifiant les droits) : si elle n'est pas changée,
  // on ne la revalide pas, pour qu'une ancienne annonce reste modifiable.
  const existante = await prisma.annonce.findFirst({
    where: { id: id.data, ...filtreProprietaire(user) },
    select: { dateDisponibilite: true },
  })
  if (!existante) notFound() // inexistante OU pas à toi

  const parsed = annonceModificationInput(
    existante.dateDisponibilite.toISOString().slice(0, 10)
  ).safeParse(valeurs)
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  const res = await prisma.annonce.updateMany({
    where: { id: id.data, ...filtreProprietaire(user) },
    data: parsed.data,
  })
  if (res.count === 0) notFound() // inexistante OU pas à toi

  revalidatePath("/annonces")
  revalidatePath(`/annonces/${id.data}`)
  redirect(`/annonces/${id.data}`)
}

// Publier / dépublier
export async function changerPublication(rawId: unknown, publier: unknown) {
  const user = await exigerAgent()

  const id = IdInput.safeParse(rawId)
  const publie = z.boolean().safeParse(publier) 
  if (!id.success || !publie.success) notFound()

  const res = await prisma.annonce.updateMany({
    where: { id: id.data, ...filtreProprietaire(user) },
    data: { statutPublication: publie.data ? "PUBLIEE" : "BROUILLON" },
  })
  if (res.count === 0) notFound()

  revalidatePath("/annonces")
  revalidatePath(`/annonces/${id.data}`)
}

// Suppression
export async function supprimerAnnonce(rawId: unknown) {
  const user = await exigerAgent()

  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  const cible = { id: id.data, ...filtreProprietaire(user) }

  // Les lignes Photo disparaissent avec l'annonce (cascade) : on note les fichiers AVANT
  const photos = await prisma.photo.findMany({
    where: { annonce: cible },
    select: { url: true },
  })

  const res = await prisma.annonce.deleteMany({ where: cible })
  if (res.count === 0) notFound()

  // Puis on supprime les fichiers. Au mieux : une erreur de disque n'annule pas la suppression.
  await Promise.all(
    photos.map((p) =>
      unlink(path.join(DOSSIER_UPLOADS, path.basename(p.url))).catch(() => {})
    )
  )

  revalidatePath("/annonces")
  redirect("/annonces")
}

// Poser une question : tout utilisateur connecté qui peut VOIR l'annonce
export async function poserQuestion(
  rawAnnonceId: unknown,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const user = await exigerUtilisateur()

  const annonceId = IdInput.safeParse(rawAnnonceId)
  if (!annonceId.success) notFound()

  const annonce = await prisma.annonce.findUnique({
    where: { id: annonceId.data },
    select: { auteurId: true, statutPublication: true },
  })
  if (!annonce || !peutVoir(user, annonce)) notFound()

  const valeurs = valeursDuFormulaire(formData)
  const parsed = QuestionInput.safeParse(valeurs)
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  await prisma.question.create({
    data: {
      contenu: parsed.data.contenu,
      annonceId: annonceId.data,
      auteurId: user.id, // vient de la session 
    },
  })

  revalidatePath(`/annonces/${annonceId.data}`)
  return {} // succès : état vide, le formulaire se vide
}

// Répondre à une question : l'agent propriétaire de l'annonce (ou un admin)
export async function repondreQuestion(
  rawQuestionId: unknown,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const user = await exigerAgent()

  const questionId = IdInput.safeParse(rawQuestionId)
  if (!questionId.success) notFound()

  const valeurs = valeursDuFormulaire(formData)
  const parsed = ReponseInput.safeParse(valeurs)
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  // L'autorisation passe par la relation : l'annonce de la question doit être à toi
  const res = await prisma.question.updateMany({
    where: { id: questionId.data, annonce: { ...filtreProprietaire(user) } },
    data: { reponse: parsed.data.reponse, repondueAt: new Date() },
  })
  if (res.count === 0) notFound()

  const question = await prisma.question.findUnique({
    where: { id: questionId.data },
    select: { annonceId: true },
  })
  if (question) revalidatePath(`/annonces/${question.annonceId}`)
  return {}
}

//-favoris 
export async function basculerFavori(rawAnnonceId: unknown) {
  const user = await exigerUtilisateur()
  
  const id = IdInput.safeParse(rawAnnonceId)
  if (!id.success) return

  const favoriExistant = await prisma.favori.findUnique({
    where: { userId_annonceId: { userId: user.id, annonceId: id.data } }
  })

  if (favoriExistant) {
    await prisma.favori.delete({ where: { id: favoriExistant.id } })
  } else {
    await prisma.favori.create({
      data: { userId: user.id, annonceId: id.data }
    })
  }

 //reactualiser la page pour refléter le changement de favori
  revalidatePath(`/annonces/${id.data}`)
}