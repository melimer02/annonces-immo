import { exigerAgent } from "@/lib/session"
import { creerAnnonce } from "../actions"
import { FormAnnonce } from "@/components/annonces/form-annonce"
import { LienRetour } from "@/components/ui/lien-retour"

export default async function NouvelleAnnoncePage() {
  await exigerAgent() // la page est protégée aussi (la vraie sécurité reste dans l'action)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <LienRetour href="/annonces">Retour aux annonces</LienRetour>
      <h1 className="text-3xl font-extrabold text-gray-900">Nouvelle annonce</h1>
      <p className="mb-6 mt-1 text-gray-600">
        L&apos;annonce est créée en brouillon. Les photos sont facultatives : vous pourrez en
        ajouter ou en retirer plus tard, puis publier l&apos;annonce depuis sa page.
      </p>
      <FormAnnonce action={creerAnnonce} bouton="Créer l'annonce" avecPhotos />
    </div>
  )
}
