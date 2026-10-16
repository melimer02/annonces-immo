
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"

export async function devenirAgent() {
  const user = await utilisateurCourant()
  if (!user) redirect("/register?suite=/agent")

  if (user.role === "USER") {
    await prisma.user.updateMany({
      where: { id: user.id, role: "USER" },
      data: { role: "AGENT" },
    })
  }

  revalidatePath("/", "layout") 
  redirect("/annonces")
}