"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerAgent } from "@/lib/session"
import { AnnonceInput } from "@/lib/shema"

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