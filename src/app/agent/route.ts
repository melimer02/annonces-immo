
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"

export async function GET(req: Request) {
  const user = await utilisateurCourant()

  // Pas connecté : inscription, puis retour 
  if (!user) {
    return NextResponse.redirect(new URL("/register?suite=/agent", req.url))
  }

  // Seul un USER devient agent 
  if (user.role === "USER") {
    await prisma.user.updateMany({
      where: { id: user.id, role: "USER" },
      data: { role: "AGENT" },
    })
  }

  return NextResponse.redirect(new URL("/annonces", req.url))
}