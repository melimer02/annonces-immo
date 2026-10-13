import { readFile } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { peutVoir } from "@/lib/authz"
import { DOSSIER_UPLOADS, NOM_PHOTO, MIME_PAR_EXTENSION } from "@/lib/photos"

// Une seule réponse pour tous les échecs : on ne révèle pas ce qui existe
const introuvable = () => new Response("Introuvable", { status: 404 })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nom: string }> }
) {
  const { nom } = await params

  // 1. Format strict : pas de "../", pas de nom exotique
  if (!NOM_PHOTO.test(nom)) return introuvable()

  // 2. La photo existe en base, et on connaît son annonce
  const photo = await prisma.photo.findFirst({
    where: { url: `/photos/${nom}` },
    include: { annonce: { select: { auteurId: true, statutPublication: true } } },
  })
  if (!photo) return introuvable()

  // 3. Même règle de visibilité que la page de détail
  const user = await utilisateurCourant()
  if (!peutVoir(user, photo.annonce)) return introuvable()

  // 4. Lecture du fichier
  let contenu: Buffer
  try {
    contenu = await readFile(path.join(DOSSIER_UPLOADS, nom))
  } catch {
    return introuvable()
  }

  const extension = nom.split(".")[1] as keyof typeof MIME_PAR_EXTENSION
  return new Response(new Uint8Array(contenu), {
    headers: {
      "Content-Type": MIME_PAR_EXTENSION[extension],
      "X-Content-Type-Options": "nosniff", // le navigateur n'a pas le droit de « deviner » un autre type
      "Cache-Control": "private, max-age=3600",
    },
  })
}
