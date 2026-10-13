"use client" // useActionState + useState (fichiers choisis, survol) : des hooks → composant client

import { useActionState, useId, useState } from "react"
import type { EtatFormulaire } from "@/lib/form"

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
}

export function FormPhotos({ action }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const [noms, setNoms] = useState<string[]>([])
  const [survol, setSurvol] = useState(false)

  const id = useId()
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`
  const erreur = etat.erreurs?.photos?.[0]

  return (
    // onReset : React vide le formulaire après un envoi réussi, on vide aussi la liste des noms
    <form action={formAction} noValidate onReset={() => setNoms([])} className="flex max-w-lg flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Ajouter des photos
      </label>

      <div
        onDragEnter={() => setSurvol(true)}
        onDragLeave={() => setSurvol(false)}
        onDrop={() => setSurvol(false)}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center focus-within:ring-2 focus-within:ring-gray-800 ${
          survol ? "border-gray-800 bg-gray-100" : "border-gray-300"
        }`}
      >
        <p aria-hidden="true">Glissez-déposez vos photos ici, ou cliquez pour parcourir</p>
        {/* L'input recouvre toute la zone : déposer dessus remplit le champ nativement */}
        <input
          id={id}
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setNoms(Array.from(e.target.files ?? []).map((f) => f.name))}
          aria-describedby={erreur ? `${idAide} ${idErreur}` : idAide}
          aria-invalid={erreur ? true : undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <p id={idAide} className="text-sm text-gray-600">
        JPEG, PNG ou WebP — 5 Mo maximum par photo, 10 photos maximum par annonce.
      </p>

      {noms.length > 0 && (
        <ul className="list-inside list-disc text-sm" aria-label="Fichiers sélectionnés">
          {noms.map((nom, i) => (
            <li key={`${nom}-${i}`}>{nom}</li>
          ))}
        </ul>
      )}

      {erreur && (
        <p id={idErreur} role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
      {etat.message && (
        <p role="status" className="text-sm text-green-700">
          {etat.message}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded bg-gray-800 px-3 py-1 text-white disabled:opacity-50"
      >
        {enCours ? "Envoi en cours…" : "Envoyer les photos"}
      </button>
    </form>
  )
}
