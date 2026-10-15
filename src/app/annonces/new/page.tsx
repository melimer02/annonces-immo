import { exigerAgent } from "@/lib/session"
import { creerAnnonce } from "../actions"
import { FormAnnonce } from "@/components/form-annonce"
import { LienRetour } from "@/components/lien-retour"

export default async function NouvelleAnnoncePage() {
  await exigerAgent() // la page est protégée aussi (la vraie sécurité reste dans l'action)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <LienRetour href="/annonces">Retour aux annonces</LienRetour>
      <h1 className="text-3xl font-extrabold text-gray-900">Nouvelle annonce</h1>
      <p className="mb-6 mt-1 text-gray-600">
        L&apos;annonce est créée en brouillon : vous pourrez ajouter des photos, puis la publier
        depuis sa page.
      </p>
      <FormAnnonce action={creerAnnonce} bouton="Créer l'annonce" />
    </div>
  )
}
