"use client" 

import { useActionState } from "react"
import type { EtatFormulaire } from "@/lib/form"

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  nom: string
  placeholder: string
  bouton: string
  multiligne?: boolean
}

export function FormTexte({ action, nom, placeholder, bouton, multiligne = false }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const message = etat.erreurs?.[nom]?.[0]
  const classe = "border rounded p-2" + (message ? " border-red-500" : "")

  return (
    <form action={formAction} noValidate className="flex flex-col gap-1 max-w-md">
      {multiligne ? (
        <textarea
          name={nom}
          rows={3}
          placeholder={placeholder}
          defaultValue={etat.valeurs?.[nom]}
          className={classe}
        />
      ) : (
        <input
          name={nom}
          placeholder={placeholder}
          defaultValue={etat.valeurs?.[nom]}
          className={classe}
        />
      )}
      {message && (
        <span role="alert" className="text-sm text-red-600">
          {message}
        </span>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-gray-800 text-white px-3 py-1 self-start disabled:opacity-50"
      >
        {enCours ? "Envoi…" : bouton}
      </button>
    </form>
  )
}
