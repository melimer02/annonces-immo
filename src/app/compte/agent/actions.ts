
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"

export async function devenirAgent() {
 const user = await exigerUtilisateur()


  if (user.role === "USER") {
    await prisma.user.updateMany({
      where: { id: user.id, role: "USER" },
      data: { role: "AGENT", statutPro: "EN_ATTENTE" },

    })
  }

  revalidatePath("/", "layout") 
  redirect("/annonces")
}