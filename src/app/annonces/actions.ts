"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { exigerAgent } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { filtreProprietaire } from "@/lib/authz"
import { AnnonceInput, IdInput } from "@/lib/shema"


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