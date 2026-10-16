"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"
import { IdInput } from "@/lib/schemas" 
import { peutVoir } from "@/lib/authz"

export async function basculerFavori(rawAnnonceId: unknown) {
  const user = await exigerUtilisateur()

  const id = IdInput.safeParse(rawAnnonceId)
  if (!id.success) return


  const annonce = await prisma.annonce.findUnique({
    where: { id: id.data },
    select: { auteurId: true, statutPublication: true },
  })
  if (!annonce || !peutVoir(user, annonce)) return

  const existant = await prisma.favori.findUnique({
    where: { userId_annonceId: { userId: user.id, annonceId: id.data } },
  })

  if (existant) {
    await prisma.favori.delete({ where: { id: existant.id } })
  } else {
    await prisma.favori.create({ data: { userId: user.id, annonceId: id.data } })
  }

  revalidatePath("/favoris")
  revalidatePath(`/annonces/${id.data}`)
  revalidatePath("/annonces")
}