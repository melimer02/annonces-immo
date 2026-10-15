"use client" 

import { useActionState, useId, useRef, useState, type ChangeEvent } from "react"
import type { EtatFormulaire } from "@/lib/form"

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
}

const cle = (f: File) => `${f.name}-${f.size}-${f.lastModified}`
const taille = (f: File) => `${(f.size / 1024 / 1024).toFixed(1)} Mo`

export function FormPhotos({ action }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const [fichiers, setFichiers] = useState<File[]>([])
  const [survol, setSurvol] = useState(false)
  const entree = useRef<HTMLInputElement>(null)

  const id = useId()
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`
  const erreur = etat.erreurs?.photos?.[0]

    function synchroniser(liste: File[]) {
    const dt = new DataTransfer()
    liste.forEach((f) => dt.items.add(f))
    if (entree.current) entree.current.files = dt.files
    setFichiers(liste)
  }


  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const nouveaux = Array.from(e.target.files ?? [])
    const deja = new Set(fichiers.map(cle))
    synchroniser([...fichiers, ...nouveaux.filter((f) => !deja.has(cle(f)))])
  }

  return (
    // onReset : React vide le formulaire après un envoi, on vide aussi notre liste
    <form action={formAction} noValidate onReset={() => setFichiers([])} className="flex max-w-lg flex-col gap-2">
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
          ref={entree}
          id={id}
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          aria-describedby={erreur ? `${idAide} ${idErreur}` : idAide}
          aria-invalid={erreur ? true : undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <p id={idAide} className="text-sm text-gray-600">
        JPEG, PNG ou WebP — 5 Mo maximum par photo, 10 photos maximum par annonce. 

      </p>

      {fichiers.length > 0 && (
        <div>
          <p className="text-sm font-medium">
            {fichiers.length} photo{fichiers.length > 1 ? "s" : ""} sélectionnée
            {fichiers.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-1 divide-y rounded border text-sm" aria-label="Fichiers sélectionnés">
            {fichiers.map((f, i) => (
              <li key={cle(f)} className="flex items-center justify-between gap-2 px-2 py-1">
                <span className="truncate">
                  {f.name} <span className="text-gray-500">({taille(f)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => synchroniser(fichiers.filter((_, j) => j !== i))}
                  aria-label={`Retirer ${f.name}`}
                  className="shrink-0 rounded border px-2 py-0.5 text-xs hover:bg-gray-100"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>
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
        disabled={enCours || fichiers.length === 0}
        className="self-start rounded bg-gray-800 px-3 py-1 text-white disabled:opacity-50"
      >
        {enCours ? "Envoi en cours…" : "Envoyer les photos"}
      </button>
    </form>
  )
}
