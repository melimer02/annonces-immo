"use client" // useActionState + état local : des hooks → composant client

import { useActionState } from "react"
import { ChampPhotos, usePhotosChoisies } from "@/components/annonces/champ-photos"
import type { EtatFormulaire } from "@/lib/form"

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
}

export function FormPhotos({ action }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const [fichiers, setFichiers] = usePhotosChoisies(etat)

  // Les photos viennent de la liste (état React), on les ajoute au FormData à l'envoi
  function envoyer(formData: FormData) {
    fichiers.forEach((f) => formData.append("photos", f))
    formAction(formData)
  }

  const n = fichiers.length

  return (
    <form action={envoyer} noValidate className="flex max-w-lg flex-col gap-2">
      <ChampPhotos
        fichiers={fichiers}
        onChange={setFichiers}
        erreur={etat.erreurs?.photos?.[0]}
        message={etat.message}
      />

      <button
        type="submit"
        disabled={enCours || n === 0}
        className="btn btn-primary self-start"
      >
        {enCours
          ? "Enregistrement…"
          : n === 0
            ? "Enregistrer les photos"
            : `Enregistrer ${n} photo${n > 1 ? "s" : ""}`}
      </button>
    </form>
  )
}
