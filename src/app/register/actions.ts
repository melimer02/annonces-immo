"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

const InscriptionInput = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
})

export async function inscrire(formData: FormData) {
  const parsed = InscriptionInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { erreurs: parsed.error.flatten().fieldErrors }
  }

  await auth.api.signUpEmail({ body: parsed.data })
  redirect("/annonces")
}
