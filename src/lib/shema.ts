// src/lib/schemas.ts
import { z } from "zod"

export const AnnonceInput = z.object({
  titre:       z.string().min(3).max(120),
  description: z.string().min(10),
  prix:        z.number().positive(),
})

export type AnnonceInput = z.infer<typeof AnnonceInput>
