import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { peutCreer, type Acteur, type Role } from "@/lib/authz"

export async function utilisateurCourant(): Promise<Acteur | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return {
    id: session.user.id,
    role: ((session.user as { role?: Role }).role) ?? "USER",
  }
}

export async function exigerUtilisateur(): Promise<Acteur> {
  const user = await utilisateurCourant()
  if (!user) redirect("/login")
  return user
}

export async function exigerAgent(): Promise<Acteur> {
  const user = await exigerUtilisateur()
  if (!peutCreer(user)) notFound()
  return user
}