// app/login/actions-sociales.ts
"use server"

import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"

export async function connexionSociale(provider: unknown) {
  const p = z.enum(["google", "github"]).safeParse(provider)
  if (!p.success) notFound() 

  const res = await auth.api.signInSocial({
    body: {
      provider: p.data,
      callbackURL: "/annonces",         // utilisateur déjà inscrit
      newUserCallbackURL: "/bienvenue", // première connexion 
    },
    headers: await headers(),
  })

  if (res.url) redirect(res.url)
}