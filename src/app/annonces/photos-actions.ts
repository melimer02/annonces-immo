"use server"

import { unlink } from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerAgent } from "@/lib/session"
import { filtreProprietaire } from "@/lib/authz"
import { IdInput } from "@/lib/shema"
import type { EtatFormulaire } from "@/lib/form"
import { DOSSIER_UPLOADS } from "@/lib/photos"
import { ecrireSurDisque, fichiersDuFormulaire, preparerPhotos, supprimerFichiers } from "@/lib/photos-serveur"

export async function ajouterPhotos(
  rawAnnonceId: unknown,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  // 1. Authentification + rôle
  const user = await exigerAgent()

  const annonceId = IdInput.safeParse(rawAnnonceId)
  if (!annonceId.success) notFound()

  // 2. Autorisation sur CETTE annonce : la propriété fait partie de la condition
  const annonce = await prisma.annonce.findFirst({
    where: { id: annonceId.data, ...filtreProprietaire(user) },
    select: { id: true },
  })
  if (!annonce) notFound()

  // 3. Validation (Zod + plafond total + contenu réel), partagée avec creerAnnonce
  const deja = await prisma.photo.count({ where: { annonceId: annonce.id } })
  const photos = await preparerPhotos(fichiersDuFormulaire(formData), deja)
  if (!photos.ok) return { erreurs: photos.erreurs }

  // 4. Écriture : disque, puis base. Si la base échoue, on nettoie le disque.
  const ecrits = await ecrireSurDisque(photos.photos)
  try {
    await prisma.photo.createMany({
      data: ecrits.map((nom) => ({ url: `/photos/${nom}`, annonceId: annonce.id })),
    })
  } catch (e) {
    await supprimerFichiers(ecrits)
    throw e
  }

  revalidatePath(`/annonces/${annonce.id}`)
  revalidatePath("/annonces")
  return { message: `${ecrits.length} photo(s) ajoutée(s)` }
}


// Supprimer une photo : l'agent propriétaire de l'annonce (ou un admin) uniquement
export async function supprimerPhoto(rawPhotoId: unknown) {
  // 1 + 2. Authentification puis rôle
  const user = await exigerAgent()

  // 3. Validation
  const photoId = IdInput.safeParse(rawPhotoId)
  if (!photoId.success) notFound()

  // Autorisation par la relation : l'annonce de la photo doit être à toi
  const where = { id: photoId.data, annonce: { ...filtreProprietaire(user) } }

  const photo = await prisma.photo.findFirst({
    where,
    select: { url: true, annonceId: true },
  })
  if (!photo) notFound() // inexistante OU pas à toi

  const res = await prisma.photo.deleteMany({ where })
  if (res.count === 0) notFound()

  // Le nom du fichier vient de la base ; basename bloque tout "../" par sécurité
  await unlink(path.join(DOSSIER_UPLOADS, path.basename(photo.url))).catch(() => {})

  revalidatePath(`/annonces/${photo.annonceId}`)
  revalidatePath(`/annonces/${photo.annonceId}/edit`)
  revalidatePath("/annonces")
}
