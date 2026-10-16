// src/lib/shema.ts 
import { z } from "zod"
import { afficherJour, jourDe, jourParis } from "@/lib/dates"

// ── Paramètres d'URL ──────────────────────────────────────────────

// imposer des chiffres uniquement, puis un entier positif, puis un plafond de 2 147 483 647.
export const IdInput = z
  .union([z.string().regex(/^\d+$/), z.number()])
  .transform(Number)
  .pipe(z.number().int().positive().max(2_147_483_647))




const NombreOptionnel = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().max(1_000_000_000))
  .optional()
  .catch(undefined)



export const RechercheInput = z.object({
  page: z.coerce.number().int().min(1).max(10000).catch(1),
  type: z.enum(["VENTE", "LOCATION"]).optional().catch(undefined),
  ville: z
    .string()
    .trim()
    .max(80)
    .transform((v) => v || undefined)
    .optional()
    .catch(undefined),
  prixMin: NombreOptionnel,
  prixMax: NombreOptionnel,

})

// ── Annonces ──────────────────────────────────────────────────────

// Date de disponibilité : jamais dans le passé (aujourd'hui accepté).
// dateConservee : en modification, la date déjà enregistrée reste acceptée telle quelle,
// pour qu'une ancienne annonce puisse être corrigée sans toucher à sa date.
const dateDisponibilite = (dateConservee?: string) =>
  z.coerce
    .date({ error: "Date de disponibilité invalide" })
    .refine((d) => jourDe(d) === dateConservee || jourDe(d) >= jourParis(), {
      // fonction : le message est calculé à la validation, avec la date du jour
      error: () =>
        `La date de disponibilité ne peut pas être dans le passé : ` +
        `choisissez le ${afficherJour(jourParis())} (aujourd'hui) ou une date ultérieure.`,
    })

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
  dateDisponibilite: dateDisponibilite(),
  // ── Validation de la localisation ──

  // ── Localisation ──
  // Lettres (accents compris), chiffres, espace, tiret, apostrophe : "Saint-Étienne", "L'Aigle"
  ville: z
    .string({ error: "La ville est requise" })
    .trim()
    .min(1, "Choisissez la ville du bien dans les suggestions")
    .max(80, "Nom de ville trop long")
    .regex(/^[\p{L}0-9][\p{L}0-9' .-]*$/u, "Nom de ville invalide"),
   
})
export type AnnonceInput = z.infer<typeof AnnonceInput>

// Modification d'une annonce : même schéma, sauf pour la date déjà enregistrée
export const annonceModificationInput = (dateActuelle: string) =>
  AnnonceInput.extend({ dateDisponibilite: dateDisponibilite(dateActuelle) })





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

// ── Photos ────────────────────────────────────────────────────────

export const TAILLE_MAX_PHOTO = 5 * 1024 * 1024 // 5 Mo
export const MAX_PHOTOS = 10
export const TYPES_PHOTO = ["image/jpeg", "image/png", "image/webp"]

// Le contenu réel est vérifié ensuite, dans l'action (voir detecterType).
export const PhotosInput = z.object({
  photos: z
    .array(
      z
        .file()
        .max(TAILLE_MAX_PHOTO, "Chaque photo doit faire 5 Mo au maximum")
        .mime(TYPES_PHOTO, "Formats acceptés : JPEG, PNG ou WebP")
    )
    .min(1, "Choisissez au moins une photo")
    .max(MAX_PHOTOS, `${MAX_PHOTOS} photos maximum par envoi`),
})


// ── Espace de l'agent (/compte) ───────────────────────────────────
// ?vue=brouillons&page=2 : une valeur invalide retombe sur la valeur par défaut, sans erreur
export const CompteInput = z.object({
  page: z.coerce.number().int().min(1).max(10000).catch(1),
  vue: z.enum(["brouillons"]).optional().catch(undefined),
})
