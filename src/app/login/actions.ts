"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

const ConnexionInput = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export async function connecter(formData: FormData) {
  const parsed = ConnexionInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { erreurs: parsed.error.flatten().fieldErrors }
  }

  await auth.api.signInEmail({ body: parsed.data })
  redirect("/annonces")
}
