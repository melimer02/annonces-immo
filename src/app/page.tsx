import { redirect } from "next/navigation"

// La page d'accueil du site, c'est la liste des annonces
export default function Accueil() {
  redirect("/annonces")
}
