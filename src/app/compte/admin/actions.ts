"use server"

import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerAdmin } from "@/lib/session"
import { ActionAdminInput } from "@/lib/schemas"

export async function changerUtilisateur(userId: unknown, action: unknown) {
  const admin = await exigerAdmin()                                   //  authentification + rôle
  const p = ActionAdminInput.safeParse({ userId, action })            // validation
  if (!p.success) notFound()

  // Garde-fous
  const cible = { id: p.data.userId, NOT: { id: admin.id }, role: { not: "ADMIN" as const } }

  let count = 0
  switch (p.data.action) {
    case "VALIDER":
      ;({ count } = await prisma.user.updateMany({
        where: { ...cible, role: "AGENT" }, data: { statutPro: "VALIDE" } }))
      break
    case "REFUSER":
      ;({ count } = await prisma.user.updateMany({
        where: { ...cible, role: "AGENT" }, data: { statutPro: "REFUSE" } }))
      break
    case "REPASSER_PARTICULIER":
      ;({ count } = await prisma.user.updateMany({
        where: cible, data: { role: "USER", statutPro: "AUCUN" } }))
      break
  
  }
  if (count === 0) notFound()
  revalidatePath("/compte/admin")
  revalidatePath("/", "layout")
}