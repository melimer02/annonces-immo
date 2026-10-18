import { execSync } from "node:child_process"
import { prisma } from "../src/lib/prisma"

async function main() {
  const nb = await prisma.user.count()
  await prisma.$disconnect()

  if (nb > 0) {
    console.log(`✔ ${nb} utilisateurs en base : seed ignoré`)
    return
  }
  console.log("Base vide : chargement des données de démonstration...")
  execSync("npx prisma db seed", { stdio: "inherit" })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})