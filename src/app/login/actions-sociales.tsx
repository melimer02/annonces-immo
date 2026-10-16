"use server"

import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { suiteSure } from "@/lib/redirection"

export async function connexionSociale(provider: unknown, suite?: string) {
  const p = z.enum(["google", "github"]).safeParse(provider)
  if (!p.success) notFound()

  const res = await auth.api.signInSocial({
    body: {
      provider: p.data,
      callbackURL: suiteSure(suite),
    },
    headers: await headers(),
  })

  if (res.url) redirect(res.url)
}