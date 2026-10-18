import { readdirSync, readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"
import { prisma } from "../src/lib/prisma"
import { auth } from "../src/lib/auth"
import { DOSSIER_UPLOADS, detecterType } from "../src/lib/photos"

type Role = "USER" | "AGENT" | "ADMIN"
type Statut = "AUCUN" | "EN_ATTENTE" | "VALIDE"


async function compte(email: string, name: string, role: Role = "USER", statutPro: Statut = "AUCUN") {
  const existant = await prisma.user.findUnique({ where: { email } })
  if (existant) return existant
  const { user } = await auth.api.signUpEmail({ body: { email, name, password: "motdepasse123" } })
  if (role !== "USER") await prisma.user.update({ where: { id: user.id }, data: { role, statutPro } })
  return user
}

// ── Photos : prisma/seed-photos/<categorie>-<n>.jpg ──
const SOURCE = path.join(process.cwd(), "prisma", "photos-seed")
const fichiers = readdirSync(SOURCE).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
const photosDe = (cat: string) => fichiers.filter((f) => f.startsWith(`${cat}-`)).sort()

// Copie une photo dans uploads/ sous un nom UUID, comme un vrai upload
async function importerPhoto(fichier: string) {
  const octets = new Uint8Array(readFileSync(path.join(SOURCE, fichier)))
  const type = detecterType(octets) // on vérifie le vrai type, pas l'extension
  if (!type) throw new Error(`Format d'image non reconnu : ${fichier}`)
  const nom = `${randomUUID()}.${type.extension}`
  await mkdir(DOSSIER_UPLOADS, { recursive: true })
  await writeFile(path.join(DOSSIER_UPLOADS, nom), octets)
  return { url: `/photos/${nom}` }
}

// ── Données ──
const VILLES = [
  { nom: "Paris", m2: 10500, quartiers: ["Montmartre", "Bastille", "Batignolles", "Vincennes"] },
  { nom: "Bordeaux", m2: 4600, quartiers: ["Chartrons", "Saint-Pierre", "Caudéran"] },
  { nom: "Aix-en-Provence", m2: 5200, quartiers: ["Mazarin", "Jas de Bouffan", "centre historique"] },
  { nom: "Rouen", m2: 3100, quartiers: ["Saint-Marc", "Jouvenet", "rive gauche"] },
  { nom: "Caen", m2: 2800, quartiers: ["Vaucelles", "Saint-Gilles", "Université"] },
  { nom: "Le Havre", m2: 2400, quartiers: ["Perret", "Sainte-Adresse", "Saint-François"] },
  { nom: "Saint-Étienne", m2: 1300, quartiers: ["Jacquard", "Bellevue", "Châteaucreux"] },
  { nom: "L'Aigle", m2: 1500, quartiers: ["centre-ville", "gare", "route de Mortagne"] },
]

const BIENS = [
  { nom: "Maison", pieces: [4, 5, 6], surfaces: [95, 120, 150], coef: 1,
    photos: ["maison", "salon", "cuisine", "chambre", "salleDeBain"],
    atouts: ["jardin clos de 400 m²", "garage double", "terrasse plein sud", "cheminée", "cave voûtée", "combles aménageables"] },
  { nom: "Appartement", pieces: [2, 3, 4], surfaces: [45, 68, 85], coef: 1,
    photos: ["immeuble", "salon", "cuisine", "chambre"],
    atouts: ["balcon", "ascenseur", "parquet ancien", "double vitrage", "cave", "place de parking"] },
  { nom: "Studio", pieces: [1], surfaces: [20, 25, 30], coef: 1.1,
    photos: ["immeuble", "salon", "cuisine", "salleDeBain"],
    atouts: ["entièrement rénové", "cuisine équipée", "proche transports", "interphone", "fibre optique", "charges réduites"] },
  { nom: "Villa", pieces: [5, 6, 7], surfaces: [160, 200, 240], coef: 1.3,
    photos: ["villa", "piscine", "salon", "cuisine", "chambre"],
    atouts: ["piscine chauffée", "grand jardin arboré", "double garage", "vue dégagée", "pool house", "domotique"] },
]

const DPE = ["B", "C", "C", "D", "D", "E"]

async function main() {
  console.log("Comptes de démonstration...")
  await compte("admin@immo.fr", "Admin", "ADMIN")
  const agent1 = await compte("agent1@immo.fr", "Agent Un", "AGENT", "VALIDE")
  const agent2 = await compte("agent2@immo.fr", "Agent Deux", "AGENT", "VALIDE")
  await compte("agent3@immo.fr", "Agent Trois", "AGENT", "EN_ATTENTE")
  await compte("user1@immo.fr", "Client Un")
  await compte("user2@immo.fr", "Client Deux")

  if ((await prisma.annonce.count()) > 0) {
    console.log("Annonces déjà présentes : ignorées.")
    return
  }

  console.log("Création de 20 annonces (copie des photos dans uploads/)...")
  for (let i = 0; i < 20; i++) {
    const vente = i % 2 === 0
    const ville = VILLES[i % VILLES.length]
    const quartier = ville.quartiers[i % ville.quartiers.length]
    const bien = BIENS[i % BIENS.length]
    const pieces = bien.pieces[i % bien.pieces.length]
    const surface = bien.surfaces[(i + 1) % bien.surfaces.length]
    const atouts = [bien.atouts[i % 6], bien.atouts[(i + 2) % 6], bien.atouts[(i + 4) % 6]]
    const dpe = DPE[i % DPE.length]

    const prixVente = Math.round((surface * ville.m2 * bien.coef) / 1000) * 1000
    const prix = vente ? prixVente : Math.round((prixVente * 0.0035) / 10) * 10

    const type = pieces > 1 ? `${pieces} pièces` : "T1"
    const titre = ` ${bien.nom.toLowerCase()} ${type} de ${surface} m² – ${quartier}, ${ville.nom}`
    const description = [
      `${bien.nom}  de ${surface} m² (${type}) situé dans le quartier ${quartier}, à ${ville.nom}.`,
      `Points forts : ${atouts.join(", ")}.`,
      `Commerces, écoles et transports à proximité. Diagnostic énergétique : ${dpe}.`,
      vente
        ? "Visite sur rendez-vous, dossier complet disponible auprès de l'agence."
        : "Loyer charges comprises. Dossier de location à constituer (pièce d'identité, justificatifs de revenus).",
    ].join("\n")

    
    const photos = []
    for (const [k, cat] of bien.photos.entries()) {
      const liste = photosDe(cat)
      if (liste.length === 0) throw new Error(`Aucune photo "${cat}-*" dans prisma/seed-photos/`)
      photos.push(await importerPhoto(liste[(i + k) % liste.length]))
    }

    const publiee = i % 8 !== 0
    await prisma.annonce.create({
      data: {
        titre, description,
        typeBien: vente ? "VENTE" : "LOCATION",
        statutPublication: publiee ? "PUBLIEE" : "BROUILLON",
        statutBien: publiee && i % 11 === 0 ? (vente ? "VENDU" : "LOUE") : "DISPONIBLE",
        prix,
        dateDisponibilite: new Date(Date.now() + (i % 6) * 7 * 24 * 3600 * 1000),
        ville: ville.nom,
        auteurId: (i % 2 === 0 ? agent1 : agent2).id,
        photos: { create: photos },
      },
    })
  }
  console.log("Seed terminé : 6 comptes, 50 annonces (4 à 5 photos chacune).")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())