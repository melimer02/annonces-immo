// src/lib/shema.ts 
import { z } from "zod"

// ── Paramètres d'URL ──────────────────────────────────────────────

// imposer des chiffres uniquement, puis un entier positif, puis un plafond de 2 147 483 647.
export const IdInput = z
  .union([z.string().regex(/^\d+$/), z.number()])
  .transform(Number)
  .pipe(z.number().int().positive().max(2_147_483_647))

// ?page=...&type=... : une valeur invalide retombe sur la valeur par défaut, sans erreur
export const RechercheInput = z.object({
  page: z.coerce.number().int().min(1).max(10000).catch(1),
  type: z.enum(["VENTE", "LOCATION"]).optional().catch(undefined),
})

// ── Annonces ──────────────────────────────────────────────────────

export const AnnonceInput = z.object({
  titre: z
    .string({ error: "Le titre est requis" })
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(120, "Le titre ne doit pas dépasser 120 caractères"),
  description: z
    .string({ error: "La description est requise" })
    .trim()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(5000, "La description ne doit pas dépasser 5000 caractères"),
  typeBien: z.enum(["VENTE", "LOCATION"], { error: "Choisissez vente ou location" }),
  statutBien: z.enum(["DISPONIBLE", "LOUE", "VENDU"], { error: "Statut du bien invalide" }),
  prix: z.coerce
    .number({ error: "Le prix doit être un nombre" })
    .positive("Le prix doit être supérieur à 0")
    .max(1_000_000_000, "Prix trop élevé"),
  dateDisponibilite: z.coerce.date({ error: "Date de disponibilité invalide" }),
})
export type AnnonceInput = z.infer<typeof AnnonceInput>

// ── Questions / réponses ──────────────────────────────────────────

export const QuestionInput = z.object({
  contenu: z
    .string({ error: "La question est requise" })
    .trim()
    .min(5, "La question doit contenir au moins 5 caractères")
    .max(1000, "La question ne doit pas dépasser 1000 caractères"),
})
export type QuestionInput = z.infer<typeof QuestionInput>

export const ReponseInput = z.object({
  reponse: z
    .string({ error: "La réponse est requise" })
    .trim()
    .min(5, "La réponse doit contenir au moins 5 caractères")
    .max(1000, "La réponse ne doit pas dépasser 1000 caractères"),
})
export type ReponseInput = z.infer<typeof ReponseInput>

// ── Authentification ──────────────────────────────────────────────

const Email = z
  .string({ error: "L'adresse email est requise" })
  .trim()
  .pipe(z.email("Adresse email invalide"))

export const InscriptionInput = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long"),
  email: Email,
  password: z
    .string({ error: "Le mot de passe est requis" })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe est trop long"),
})

export const ConnexionInput = z.object({
  email: Email,
  password: z.string({ error: "Le mot de passe est requis" }).min(1, "Le mot de passe est requis"),
})
