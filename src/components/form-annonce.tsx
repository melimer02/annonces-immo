"use client" 

import { useActionState } from "react"
import { Champ } from "@/components/champ"
import type { EtatFormulaire } from "@/lib/form"

type Valeurs = Partial<
  Record<"titre" | "description" | "prix" | "dateDisponibilite" | "typeBien" | "statutBien", string>
>

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  bouton: string
  valeursInitiales?: Valeurs
  avecStatutBien?: boolean
}

export function FormAnnonce({ action, bouton, valeursInitiales, avecStatutBien = false }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  // Ce que l'utilisateur vient de saisir l'emporte sur les valeurs initiales (édition)
  const v: Valeurs = { ...valeursInitiales, ...etat.valeurs }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3 p-6 max-w-lg mx-auto">
      <Champ label="Titre" erreurs={e.titre}>
        <input name="titre" defaultValue={v.titre} className="border rounded p-2" />
      </Champ>

      <Champ label="Description" erreurs={e.description}>
        <textarea name="description" rows={5} defaultValue={v.description} className="border rounded p-2" />
      </Champ>

      <Champ label="Prix (€)" erreurs={e.prix}>
        <input name="prix" type="number" step="any" defaultValue={v.prix} className="border rounded p-2" />
      </Champ>

      <Champ label="Date de disponibilité" erreurs={e.dateDisponibilite}>
        <input name="dateDisponibilite" type="date" defaultValue={v.dateDisponibilite} className="border rounded p-2" />
      </Champ>

      <Champ label="Type de bien" erreurs={e.typeBien}>
        <select name="typeBien" defaultValue={v.typeBien ?? "VENTE"} className="border rounded p-2">
          <option value="VENTE">Vente</option>
          <option value="LOCATION">Location</option>
        </select>
      </Champ>

      {avecStatutBien && (
        <Champ label="Statut du bien" erreurs={e.statutBien}>
          <select name="statutBien" defaultValue={v.statutBien ?? "DISPONIBLE"} className="border rounded p-2">
            <option value="DISPONIBLE">Disponible</option>
            <option value="LOUE">Loué</option>
            <option value="VENDU">Vendu</option>
          </select>
        </Champ>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-gray-800 text-white py-2 disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : bouton}
      </button>
    </form>
  )
}
