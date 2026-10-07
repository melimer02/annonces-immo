import { exigerAgent } from "@/lib/session"
import { creerAnnonce } from "../actions"

export default async function NouvelleAnnoncePage() {
  await exigerAgent() // la page est protégée aussi

  return (
    <form action={creerAnnonce} className="flex flex-col gap-3 p-6 max-w-lg mx-auto">
      <input name="titre" placeholder="Titre" required className="border rounded p-2" />
      <textarea name="description" placeholder="Description" required className="border rounded p-2" />
      <input name="prix" type="number" step="any" placeholder="Prix" required className="border rounded p-2" />
      <input name="dateDisponibilite" type="date" required className="border rounded p-2" />
      <select name="typeBien" className="border rounded p-2">
        <option value="VENTE">Vente</option>
        <option value="LOCATION">Location</option>
      </select>
      <button type="submit" className="rounded bg-gray-800 text-white py-2">Créer</button>
    </form>
  )
}