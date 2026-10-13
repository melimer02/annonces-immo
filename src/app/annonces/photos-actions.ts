"use server"

import { mkdir, writeFile, unlink } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerAgent } from "@/lib/session"
import { filtreProprietaire } from "@/lib/authz"
import { IdInput, PhotosInput, MAX_PHOTOS } from "@/lib/shema"
import { erreursDe, type EtatFormulaire } from "@/lib/form"
import { DOSSIER_UPLOADS, detecterType } from "@/lib/photos"

export async function ajouterPhotos(
  rawAnnonceId: unknown,
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  // 1. Authentification + rôle
  const user = await exigerAgent()

  const annonceId = IdInput.safeParse(rawAnnonceId)
  if (!annonceId.success) notFound()

  // 2. Autorisation sur CETTE annonce : la propriété fait partie de la condition
  const annonce = await prisma.annonce.findFirst({
    where: { id: annonceId.data, ...filtreProprietaire(user) },
    select: { id: true },
  })
  if (!annonce) notFound()

  // 3. Validation. Un <input type="file"> vide envoie un fichier de 0 octet : on l'écarte.
  const fichiers = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)

  const parsed = PhotosInput.safeParse({ photos: fichiers })
  if (!parsed.success) return { erreurs: erreursDe(parsed.error) }

  const deja = await prisma.photo.count({ where: { annonceId: annonce.id } })
  if (deja + parsed.data.photos.length > MAX_PHOTOS) {
    return {
      erreurs: {
        photos: [`Cette annonce a déjà ${deja} photo(s) : ${MAX_PHOTOS} maximum au total`],
      },
    }
  }

  // 3 bis. Le CONTENU réel doit être une image (file.type est falsifiable)
  const prepares: { nom: string; octets: Uint8Array }[] = []
  for (const fichier of parsed.data.photos) {
    const octets = new Uint8Array(await fichier.arrayBuffer())
    const type = detecterType(octets)
    if (!type) {
      return {
        erreurs: {
          photos: [`« ${fichier.name} » n'est pas une image JPEG, PNG ou WebP valide`],
        },
      }
    }
    // Le nom vient du serveur, JAMAIS du client (sinon "../../..." : traversée de chemin)
    prepares.push({ nom: `${randomUUID()}.${type.extension}`, octets })
  }

  // 4. Écriture : disque, puis base. Si la base échoue, on nettoie le disque.
  await mkdir(DOSSIER_UPLOADS, { recursive: true })
  const ecrits: string[] = []
  try {
    for (const p of prepares) {
      await writeFile(path.join(DOSSIER_UPLOADS, p.nom), p.octets)
      ecrits.push(p.nom)
    }
    await prisma.photo.createMany({
      data: prepares.map((p) => ({ url: `/photos/${p.nom}`, annonceId: annonce.id })),
    })
  } catch (e) {
    await Promise.all(
      ecrits.map((nom) => unlink(path.join(DOSSIER_UPLOADS, nom)).catch(() => {}))
    )
    throw e
  }

  revalidatePath(`/annonces/${annonce.id}`)
  revalidatePath("/annonces")
  return { message: `${prepares.length} photo(s) ajoutée(s)` }
}
