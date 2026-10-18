import { prisma } from "../src/lib/prisma"
import { auth } from "../src/lib/auth"

async function creerUtilisateur(email: string, name: string, password: string) {
  const { user } = await auth.api.signUpEmail({
    body: { email, name, password },
  })
  return user
}

async function main() {
  console.log("Réinitialisation des comptes...")

  await prisma.user.deleteMany({
  where: { email: { in: ["admin@immo.fr", "agent1@immo.fr", "agent2@immo.fr", "user1@immo.fr", "user2@immo.fr"] } },
  })
  
  //Admin
  const admin = await creerUtilisateur("admin@immo.fr", "Admin", "motdepasse123")
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } })
  // 1. Création des agents
  const agent1 = await creerUtilisateur("agent1@immo.fr", "Agent Un", "motdepasse123")

  const agent2 = await creerUtilisateur("agent2@immo.fr", "Agent Deux", "motdepasse123")

  await prisma.user.update({ where: { id: agent1.id }, data: { role: "AGENT", statutPro: "VALIDE" } })
  await prisma.user.update({ where: { id: agent2.id }, data: { role: "AGENT", statutPro: "VALIDE" } })

  const agent3 = await creerUtilisateur("agent3@immo.fr", "Agent Trois", "motdepasse123")
await prisma.user.update({ where: { id: agent3.id }, data: { role: "AGENT", statutPro: "EN_ATTENTE" } })
  // 2. Création des utilisateurs simples
  const user1 = await creerUtilisateur("user1@immo.fr", "Client Un", "motdepasse123")
  const user2 = await creerUtilisateur("user2@immo.fr", "Client Deux", "motdepasse123")

  const villes = ["Le Havre", "Rouen", "Paris", "Caen", "Bordeaux", "Saint-Étienne", "L'Aigle", "Aix-en-Provence"]

  // 10 images statiques et fiables (Picsum)
  const poolImages = [
    "https://picsum.photos/id/1040/800/500", // Maison / Château
    "https://picsum.photos/id/1047/800/500", // Immeubles ville
    "https://picsum.photos/id/1031/800/500", // Quartier urbain
    "https://picsum.photos/id/122/800/500",  // Rue de nuit
    "https://picsum.photos/id/164/800/500",  // Ville et canal
    "https://picsum.photos/id/175/800/500",  // Intérieur antique
    "https://picsum.photos/id/192/800/500",  // Façade immeuble
    "https://picsum.photos/id/238/800/500",  // Vue métropole
    "https://picsum.photos/id/256/800/500",  // Chalet montagne
    "https://picsum.photos/id/274/800/500"   // Ville de nuit
  ]

  console.log("Génération de 50 annonces avec leurs photos...")

  // 3. Boucle de création
  for (let index = 0; index < 50; index++) {
    const isVente = index % 2 === 0
    const typeBien = isVente ? "VENTE" : "LOCATION"
    const prix = isVente ? 150000 + (index * 5000) : 500 + (index * 20)
    const auteurId = index % 2 === 0 ? agent1.id : agent2.id
    const villeChoisie = villes[index % villes.length]

    // Sélection de 2 images différentes dans le tableau de 10
    const img1 = poolImages[index % poolImages.length]
    const img2 = poolImages[(index + 1) % poolImages.length]

    await prisma.annonce.create({
      data: {
        titre: `Annonce n°${index + 1} - ${isVente ? "Maison" : "Appartement"} T${(index % 5) + 1}`,
        description: `Superbe bien immobilier situé à ${villeChoisie}. C'est l'annonce numéro ${index + 1} générée pour tester la pagination et l'affichage des images.`,
        typeBien: typeBien,
        statutPublication: index % 5 === 0 ? "BROUILLON" : "PUBLIEE", 
        statutBien: "DISPONIBLE",
        prix: prix,
        dateDisponibilite: new Date(),
        auteurId: auteurId,
        ville: villeChoisie,
        photos: {
          create: [
            { url: img1 },
            { url: img2 }
          ]
        }
      },
    })
  }

  console.log("Seed terminé avec succès : 50 annonces créées !")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })