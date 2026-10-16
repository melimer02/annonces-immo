"use client" // état local (survol) et gestionnaires d'événements : composant client

import { useId, useState, type ChangeEvent } from "react"
import type { EtatFormulaire } from "@/lib/form"

const cle = (f: File) => `${f.name}-${f.size}-${f.lastModified}`
const taille = (f: File) => `${(f.size / 1024 / 1024).toFixed(1)} Mo`

// Les photos choisies vivent dans l'état React, PAS dans le <input type="file"> :
// un champ fichier remplace sa sélection à chaque ouverture du sélecteur, et React le vide
// après chaque envoi. Après un succès on vide la liste ; après une erreur on la GARDE.
export function usePhotosChoisies(etat: EtatFormulaire) {
  const [fichiers, setFichiers] = useState<File[]>([])
  const [etatVu, setEtatVu] = useState(etat)
  if (etat !== etatVu) {
    setEtatVu(etat)
    if (etat.message) setFichiers([])
  }
  return [fichiers, setFichiers] as const
}

type Props = {
  fichiers: File[]
  onChange: (fichiers: File[]) => void
  erreur?: string
  message?: string
  note?: string
}

export function ChampPhotos({ fichiers, onChange, erreur, message, note }: Props) {
  const [survol, setSurvol] = useState(false)

  const id = useId()
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`

  function ajouter(e: ChangeEvent<HTMLInputElement>) {
    const nouveaux = Array.from(e.target.files ?? [])
    // Le sélecteur repart de zéro à chaque fois : on peut rechoisir le même fichier
    e.target.value = ""
    const deja = new Set(fichiers.map(cle))
    onChange([...fichiers, ...nouveaux.filter((f) => !deja.has(cle(f)))])
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Ajouter des photos
      </label>

      <div
        onDragEnter={() => setSurvol(true)}
        onDragLeave={() => setSurvol(false)}
        onDrop={() => setSurvol(false)}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center text-gray-700 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
          survol ? "border-primary bg-primary-soft" : "border-gray-300 bg-white"
        }`}
      >
        <p aria-hidden="true">Glissez-déposez vos photos ici, ou cliquez pour parcourir</p>
        {/* L'input recouvre toute la zone : déposer dessus remplit le champ nativement.
            Il n'a pas de "name" : il ne sert qu'à CHOISIR, l'envoi se fait depuis la liste. */}
        <input
          id={id}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={ajouter}
          aria-describedby={erreur ? `${idAide} ${idErreur}` : idAide}
          aria-invalid={erreur ? true : undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <p id={idAide} className="text-sm text-gray-600">
        JPEG, PNG ou WebP — 5 Mo maximum par photo, 10 photos maximum par annonce. Vous pouvez
        en ajouter plusieurs, en plusieurs fois.
      </p>

      {fichiers.length > 0 && (
        <div>
          <p className="text-sm font-medium">
            {fichiers.length} photo{fichiers.length > 1 ? "s" : ""} prête
            {fichiers.length > 1 ? "s" : ""}
          </p>
          {note && <p className="text-sm text-gray-600">{note}</p>}
          <ul className="mt-1 divide-y rounded border text-sm" aria-label="Photos choisies">
            {fichiers.map((f) => (
              <li key={cle(f)} className="flex items-center justify-between gap-2 px-2 py-1">
                <span className="truncate">
                  {f.name} <span className="text-gray-500">({taille(f)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(fichiers.filter((x) => cle(x) !== cle(f)))}
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
      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}
    </div>
  )
}
