import { prisma } from "../src/lib/prisma"
import { auth } from "../src/lib/auth"

async function creerUtilisateur(email: string, name: string, password: string) {
  const { user } = await auth.api.signUpEmail({
    body: { email, name, password },
  })
  return user
}

async function main() {
  // 1. Deux agents distincts (exigés pour tester l'autorisation)
  const agent1 = await creerUtilisateur("agent1@immo.fr", "Agent Un", "motdepasse123")
  await prisma.user.update({ where: { id: agent1.id }, data: { role: "AGENT" } })

  const agent2 = await creerUtilisateur("agent2@immo.fr", "Agent Deux", "motdepasse123")
  await prisma.user.update({ where: { id: agent2.id }, data: { role: "AGENT" } })

  // 2. Quelques USER (restent USER, rôle par défaut)
  const user1 = await creerUtilisateur("user1@immo.fr", "Client Un", "motdepasse123")
  const user2 = await creerUtilisateur("user2@immo.fr", "Client Deux", "motdepasse123")

  // 3. Annonces réparties entre les deux agents
  await prisma.annonce.create({
    data: {
      titre: "Appartement T3 lumineux",
      description: "Bel appartement rénové, proche centre-ville.",
      typeBien: "LOCATION",
      statutPublication: "PUBLIEE",
      statutBien: "DISPONIBLE",
      prix: 850,
      dateDisponibilite: new Date(),
      auteurId: agent1.id,
    },
  })

  await prisma.annonce.create({
    data: {
      titre: "Maison avec jardin",
      description: "Grande maison familiale avec jardin arboré.",
      typeBien: "VENTE",
      statutPublication: "PUBLIEE",
      statutBien: "DISPONIBLE",
      prix: 320000,
      dateDisponibilite: new Date(),
      auteurId: agent2.id,
    },
  })

  console.log("Seed terminé :", { agent1: agent1.email, agent2: agent2.email, user1: user1.email, user2: user2.email })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
