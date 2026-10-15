"use client" // useActionState est un hook : ce composant doit être côté client

import { useActionState, useId } from "react"
import type { EtatFormulaire } from "@/lib/form"

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  nom: string
  label: string // lu par les lecteurs d'écran (masqué visuellement)
  placeholder: string
  bouton: string
  multiligne?: boolean
}

export function FormTexte({ action, nom, label, placeholder, bouton, multiligne = false }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const id = useId()
  const idErreur = `${id}-erreur`
  const message = etat.erreurs?.[nom]?.[0]

  const champ = {
    id,
    name: nom,
    placeholder,
    defaultValue: etat.valeurs?.[nom],
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? idErreur : undefined,
    className: "champ", // la bordure rouge (aria-invalid) est définie dans globals.css
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {multiligne ? <textarea rows={3} {...champ} /> : <input {...champ} />}
      {message && (
        <p id={idErreur} role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
      <button type="submit" disabled={enCours} className="btn btn-primary self-start">
        {enCours ? "Envoi…" : bouton}
      </button>
    </form>
  )
}
