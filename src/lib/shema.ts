// src/lib/schemas.ts
import { z } from "zod"

export const AnnonceInput = z.object({
  titre:       z.string().min(3).max(120),
  description: z.string().min(10),
  typeBien: z.enum(["VENTE", "LOCATION"]),
  statutBien: z.enum(["DISPONIBLE", "LOUE", "VENDU"]),
  prix: z.number().positive(),
  dateDisponibilite: z.coerce.date()
})
export const IdInput = z.coerce.number().int().positive()

export type AnnonceInput = z.infer<typeof AnnonceInput>
export const QuestionInput = z.object({
  contenu: z.string().min(5, "La question doit contenir au moins 5 caractères"),
})

export const ReponseInput = z.object({
  reponse: z.string().min(5, "La réponse doit contenir au moins 5 caractères"),
})

export type QuestionInput = z.infer<typeof QuestionInput>
export type ReponseInput = z.infer<typeof ReponseInput>