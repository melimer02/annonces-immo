import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { peutCreer, StatutPro, type Acteur, type Role } from "@/lib/authz"
import { cache } from "react"


export const utilisateurCourant = cache(async (): Promise<Acteur | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
   const u = session.user as { role?: Role; statutPro?: StatutPro }

  return {
    id: session.user.id,
    name: session.user.name, 
    role: u.role ?? "USER",
    statutPro: u.statutPro ?? "AUCUN",
  }
})

export async function exigerUtilisateur(): Promise<Acteur> {
  const user = await utilisateurCourant()
  if (!user) redirect("/login")
  return user
}

export async function exigerAgent(): Promise<Acteur> {
  const user = await exigerUtilisateur()
  if (!peutCreer(user)) notFound() // simple utilisateur : pas le droit de publier
  return user
}

export async function exigerAdmin(): Promise<Acteur> {
  const user = await exigerUtilisateur()
  if (user.role !== "ADMIN") notFound()
  return user
}