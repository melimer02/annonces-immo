import { describe, it, expect } from "vitest"
import { preparerPhotos, fichiersDuFormulaire } from "@/lib/photos-serveur"
import { MAX_PHOTOS, TAILLE_MAX_PHOTO } from "@/lib/schemas"
import { NOM_PHOTO } from "@/lib/photos"

// En-têtes réels (signatures) de chaque format, suivis de quelques octets
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

const fichier = (octets: number[], nom = "photo.jpg", type = "image/jpeg") =>
  new File([new Uint8Array(octets)], nom, { type })

const messages = (r: Awaited<ReturnType<typeof preparerPhotos>>) =>
  r.ok ? [] : (r.erreurs.photos ?? [])

describe("preparerPhotos", () => {
  it("accepte JPEG, PNG et WebP réels, avec un nom généré par le serveur", async () => {
    const r = await preparerPhotos([
      fichier(JPEG, "a.jpg"),
      fichier(PNG, "b.png", "image/png"),
      fichier(WEBP, "c.webp", "image/webp"),
    ])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.photos).toHaveLength(3)
      for (const p of r.photos) expect(p.nom).toMatch(NOM_PHOTO)
    }
  })

  it("n'utilise jamais le nom fourni par le client", async () => {
    const r = await preparerPhotos([fichier(JPEG, "../../etc/passwd.jpg")])
    expect(r.ok && r.photos[0].nom).toMatch(NOM_PHOTO)
  })

  it("aucune photo : refusé quand elles sont obligatoires, accepté quand elles sont facultatives", async () => {
    expect(messages(await preparerPhotos([]))[0]).toMatch(/au moins une photo/)
    const r = await preparerPhotos([], 0, true)
    expect(r).toEqual({ ok: true, photos: [] })
  })

  it("refuse un faux JPEG : le type déclaré est falsifiable, le contenu est vérifié", async () => {
    const faux = fichier([...new TextEncoder().encode("<script>alert(1)</script>")], "piege.jpg")
    expect(messages(await preparerPhotos([faux]))[0]).toMatch(/n'est pas une image/)
  })

  it("refuse un type déclaré non autorisé", async () => {
    const r = await preparerPhotos([fichier(JPEG, "doc.pdf", "application/pdf")])
    expect(messages(r)[0]).toMatch(/Formats acceptés/)
  })

  it("refuse une photo de plus de 5 Mo", async () => {
    const grosse = fichier([...JPEG, ...new Array(TAILLE_MAX_PHOTO).fill(0)])
    expect(messages(await preparerPhotos([grosse]))[0]).toMatch(/5 Mo/)
  })

  it("refuse plus de 10 photos d'un coup", async () => {
    const trop = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => fichier(JPEG, `p${i}.jpg`))
    expect(messages(await preparerPhotos(trop))[0]).toMatch(/maximum/)
  })

  it("refuse de dépasser 10 photos au total (déjà présentes + nouvelles)", async () => {
    const trois = [fichier(JPEG, "1.jpg"), fichier(JPEG, "2.jpg"), fichier(JPEG, "3.jpg")]
    expect(messages(await preparerPhotos(trois, 8))[0]).toMatch(/déjà 8 photo/)
    expect((await preparerPhotos(trois, 7)).ok).toBe(true)
  })
})

describe("fichiersDuFormulaire", () => {
  it("écarte les fichiers vides et les valeurs qui ne sont pas des fichiers", () => {
    const fd = new FormData()
    fd.append("photos", new File([], "vide.jpg", { type: "image/jpeg" })) // champ laissé vide
    fd.append("photos", "pas un fichier")
    fd.append("photos", fichier(JPEG, "ok.jpg"))
    expect(fichiersDuFormulaire(fd).map((f) => f.name)).toEqual(["ok.jpg"])
  })
})
