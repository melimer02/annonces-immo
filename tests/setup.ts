import "dotenv/config"

const url = process.env.DATABASE_URL_TEST
if (!url) throw new Error("DATABASE_URL_TEST manquante")
if (url === process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL_TEST == DATABASE_URL : refus de tester sur la base de dev")
}
process.env.DATABASE_URL = url
