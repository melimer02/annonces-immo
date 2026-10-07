"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { exigerAgent ,utilisateurCourant} from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { filtreProprietaire } from "@/lib/authz"
import { AnnonceInput, IdInput ,QuestionInput,  ReponseInput} from "@/lib/shema"


// creerAnnonce est une action côté serveur qui permet à un agent de créer une nouvelle annonce.
export async function creerAnnonce(formData: FormData) {
  const user = await exigerAgent()

  const parsed = AnnonceInput.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description"),
    typeBien: formData.get("typeBien"),
    statutBien: formData.get("statutBien") ?? "DISPONIBLE",
    prix: Number(formData.get("prix")),
    dateDisponibilite: formData.get("dateDisponibilite"),
  })
  if (!parsed.success) {
    return 
  }
  const annonce = await prisma.annonce.create({
    data: { ...parsed.data, auteurId: user.id },
  })

  revalidatePath("/annonces")
  redirect(`/annonces/${annonce.id}`)
}

// modifierAnnonce est une action côté serveur qui permet à un agent de modifier une annonce existante. Elle prend en entrée l'identifiant brut de l'annonce et les données du formulaire, puis effectue les étapes suivantes :
export async function modifierAnnonce(rawId: unknown, formData: FormData) {
   const user = await exigerAgent()

   const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  const parsed = AnnonceInput.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description"),
    typeBien: formData.get("typeBien"),
    statutBien: formData.get("statutBien") ?? "DISPONIBLE",
    prix: Number(formData.get("prix")),
    dateDisponibilite: formData.get("dateDisponibilite"),
  })
  if (!parsed.success) return

    const res = await prisma.annonce.updateMany({
    where: { id: id.data, ...filtreProprietaire(user) },
    data: parsed.data,
  })
  if (res.count === 0) notFound() // inexistante OU pas à toi

  revalidatePath("/annonces")
  revalidatePath(`/annonces/${id.data}`)
  redirect(`/annonces/${id.data}`)
}



//publier une annonce 
export async function changerPublication(rawId: unknown, publier: boolean) {
   const user = await exigerAgent()


  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

   const res = await prisma.annonce.updateMany({
    where: { id: id.data, ...filtreProprietaire(user) },
    data: { statutPublication: publier ? "PUBLIEE" : "BROUILLON" },
  })
  if (res.count === 0) notFound() 

  revalidatePath("/annonces")
  revalidatePath(`/annonces/${id.data}`)
}







//supprimer une annonce
export async function supprimerAnnonce(rawId: unknown) {
  // Authentification puis autorisation par rôle
  const user = await exigerAgent()

  //Validation de l'id
  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  //Suppression 
  const res = await prisma.annonce.deleteMany({
    where: { id: id.data, ...filtreProprietaire(user) },
  })
  if (res.count === 0) notFound() 

  revalidatePath("/annonces")
  redirect("/annonces")
}



//poser une question sur une annonce
export async function poserQuestion(rawAnnonceId: unknown, formData: FormData) {
  const user = await utilisateurCourant()
  if (!user) throw new Error("Non autorisé")

  const annonceId = IdInput.safeParse(rawAnnonceId)
  if (!annonceId.success) notFound()

  const parsed = QuestionInput.safeParse({
    contenu: formData.get("contenu"),
  })
  if (!parsed.success) return 

  await prisma.question.create({
    data: {
      contenu: parsed.data.contenu,
      annonceId: annonceId.data,
      auteurId: user.id, // L'ID vient de la session, bloquant l'usurpation[cite: 16]
    },
  })

  revalidatePath(`/annonces/${annonceId.data}`)
}

  //reponse
export async function repondreQuestion(rawQuestionId: unknown, formData: FormData) {
  const user = await exigerAgent()

  const questionId = IdInput.safeParse(rawQuestionId)
  if (!questionId.success) notFound()

  const parsed = ReponseInput.safeParse({
    reponse: formData.get("reponse"),
  })
  if (!parsed.success) return

  // updateMany avec relation empêche la faille IDOR (modification d'une annonce concurrente)[cite: 21]
  const res = await prisma.question.updateMany({
    where: {
      id: questionId.data,
      annonce: {
        ...filtreProprietaire(user) 
      }
    },
    data: {
      reponse: parsed.data.reponse,
    },
  })

  if (res.count === 0) notFound()

  // Revalidation de la page via l'ID de l'annonce
  const question = await prisma.question.findUnique({ where: { id: questionId.data }})
  if (question) {
    revalidatePath(`/annonces/${question.annonceId}`)
  }
}