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
