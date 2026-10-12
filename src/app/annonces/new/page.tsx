import { exigerAgent } from "@/lib/session"
import { creerAnnonce } from "../actions"
import { FormAnnonce } from "@/components/form-annonce"

export default async function NouvelleAnnoncePage() {
  await exigerAgent() 

  return <FormAnnonce action={creerAnnonce} bouton="Créer l'annonce" />
}
