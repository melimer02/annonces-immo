// Logique serveur des photos, partagée par "ajouterPhotos" et "creerAnnonce".
// Ce fichier n'a PAS "use server" (il exporte des fonctions utilitaires, pas des actions)
// et ne doit jamais être importé par un composant client (il utilise le disque).
import { mkdir, writeFile, unlink } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { PhotosInput, MAX_PHOTOS } from "@/lib/shema"
import { erreursDe, type ErreursChamps } from "@/lib/form"
import { DOSSIER_UPLOADS, detecterType } from "@/lib/photos"

export type PhotoPreparee = { nom: string; octets: Uint8Array }

export type ResultatPhotos =
  | { ok: true; photos: PhotoPreparee[] }
  | { ok: false; erreurs: ErreursChamps }

// Un <input type="file"> laissé vide envoie un fichier de 0 octet : on l'écarte.
export function fichiersDuFormulaire(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
}

// Valide les photos SANS rien écrire : schéma Zod (taille, type déclaré, nombre),
// plafond total, puis contenu réel (file.type est falsifiable).
// facultatif : à la création, aucune photo n'est une réponse valide.
export async function preparerPhotos(
  fichiers: File[],
  dejaPresentes = 0,
  facultatif = false
): Promise<ResultatPhotos> {
  if (facultatif && fichiers.length === 0) return { ok: true, photos: [] }

  const parsed = PhotosInput.safeParse({ photos: fichiers })
  if (!parsed.success) return { ok: false, erreurs: erreursDe(parsed.error) }

  if (dejaPresentes + parsed.data.photos.length > MAX_PHOTOS) {
    return {
      ok: false,
      erreurs: {
        photos: [`Cette annonce a déjà ${dejaPresentes} photo(s) : ${MAX_PHOTOS} maximum au total`],
      },
    }
  }

  const photos: PhotoPreparee[] = []
  for (const fichier of parsed.data.photos) {
    const octets = new Uint8Array(await fichier.arrayBuffer())
    const type = detecterType(octets)
    if (!type) {
      return {
        ok: false,
        erreurs: {
          photos: [`« ${fichier.name} » n'est pas une image JPEG, PNG ou WebP valide`],
        },
      }
    }
    // Le nom vient du serveur, JAMAIS du client (sinon "../../..." : traversée de chemin)
    photos.push({ nom: `${randomUUID()}.${type.extension}`, octets })
  }
  return { ok: true, photos }
}

// Écrit les fichiers sur le disque. Si l'un échoue, supprime ceux déjà écrits.
// Renvoie les noms de fichiers écrits.
export async function ecrireSurDisque(photos: PhotoPreparee[]): Promise<string[]> {
  await mkdir(DOSSIER_UPLOADS, { recursive: true })
  const ecrits: string[] = []
  try {
    for (const p of photos) {
      await writeFile(path.join(DOSSIER_UPLOADS, p.nom), p.octets)
      ecrits.push(p.nom)
    }
  } catch (e) {
    await supprimerFichiers(ecrits)
    throw e
  }
  return ecrits
}

// Nettoyage : basename bloque tout "../" par sécurité
export async function supprimerFichiers(noms: string[]) {
  await Promise.all(
    noms.map((nom) => unlink(path.join(DOSSIER_UPLOADS, path.basename(nom))).catch(() => {}))
  )
}
