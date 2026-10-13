import path from "node:path"

// Hors de /public : on ne sert que ce qu'on autorise explicitement (voir /photos/[nom])
export const DOSSIER_UPLOADS = path.join(process.cwd(), "uploads")

export const MIME_PAR_EXTENSION = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const

// Les seuls noms de fichiers que l'application génère ET sert : <uuid>.<ext>
export const NOM_PHOTO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/

// Détecte le VRAI type d'un fichier d'après ses premiers octets.
// file.type est déclaré par le navigateur : un client malveillant peut y mettre n'importe quoi.
export function detecterType(octets: Uint8Array) {
  const commence = (...signature: number[]) => signature.every((o, i) => octets[i] === o)

  if (commence(0xff, 0xd8, 0xff)) return { extension: "jpg" } as const
  if (commence(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { extension: "png" } as const
  // WebP : "RIFF" (octets 0-3), taille (4-7), "WEBP" (8-11)
  if (
    commence(0x52, 0x49, 0x46, 0x46) &&
    octets[8] === 0x57 &&
    octets[9] === 0x45 &&
    octets[10] === 0x42 &&
    octets[11] === 0x50
  ) {
    return { extension: "webp" } as const
  }
  return null
}
