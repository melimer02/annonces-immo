
"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"

export async function demanderAgent() {
  const user = await exigerUtilisateur()


  await prisma.user.updateMany({
    where: { id: user.id, role: "USER" },
    data: { role: "AGENT", statutPro: "EN_ATTENTE" },
  })

  redirect("/annonces?demande=envoyee")
}