"use client" 

import { useActionState, useState, useEffect } from "react"
import { Champ } from "@/components/champ"
import type { EtatFormulaire } from "@/lib/form"

type Valeurs = Partial<
  Record<
    | "titre" 
    | "description" 
    | "prix" 
    | "dateDisponibilite" 
    | "typeBien" 
    | "statutBien" 
    | "ville", 
    string
  >
>

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  bouton: string
  valeursInitiales?: Valeurs
  avecStatutBien?: boolean
}

// Format de la réponse de l'API Géo
type Commune = {
  nom: string
  codesPostaux: string[]
}

export function FormAnnonce({ action, bouton, valeursInitiales, avecStatutBien = false }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  const v: Valeurs = { ...valeursInitiales, ...etat.valeurs }


  const [rechercheVille, setRechercheVille] = useState(v.ville ?? "")
  const [suggestions, setSuggestions] = useState<Commune[]>([])
  
  // Ces valeurs invisibles seront envoyées au serveur
  const [villeSelectionnee, setVilleSelectionnee] = useState(v.ville ?? "")

  // Interroge l'API quand l'utilisateur tape
useEffect(() => {
    // S'arrête sans déclencher de nouveau render
    if (rechercheVille.length < 2 || rechercheVille === villeSelectionnee) {
      return
    }

    const fetchVilles = async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${rechercheVille}&fields=nom&format=json&limit=5`)
        const data = await res.json()
        setSuggestions(data)
      } catch (error) {
        console.error("Erreur API Géo", error)
      }
    }

    const timeout = setTimeout(fetchVilles, 200) 
    return () => clearTimeout(timeout)
  }, [rechercheVille, villeSelectionnee])

  // Quand l'agent clique sur une suggestion
  const selectionnerVille = (commune: Commune) => {
    setVilleSelectionnee(commune.nom)
    setRechercheVille(commune.nom) 
    setSuggestions([]) 
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4 p-6 max-w-lg mx-auto">
      <Champ label="Titre" erreurs={e.titre}>
        <input name="titre" defaultValue={v.titre} className="border rounded p-2" />
      </Champ>

      <Champ label="Description" erreurs={e.description}>
        <textarea name="description" rows={5} defaultValue={v.description} className="border rounded p-2" />
      </Champ>

      {/* --- SECTION LOCALISATION AVEC SUGGESTIONS --- */}
      <div className="flex flex-col gap-3 p-4 bg-gray-50 border rounded-lg relative">
        <h3 className="text-sm font-semibold text-gray-700 uppercase">Localisation</h3>
        
        <Champ label="Rechercher une ville" erreurs={e.ville}>
          <input 
            type="text"
            value={rechercheVille}
            onChange={(event) => {
              setRechercheVille(event.target.value)
              // Si l'utilisateur efface, on réinitialise la sélection
              if (event.target.value === "") {
                setVilleSelectionnee("")
              
              }
            }}
            placeholder="Ex: Paris, Le Havre..." 
            className="border rounded p-2" 
            autoComplete="off"
          />
        </Champ>

        {/* Le menu déroulant des suggestions par dessus le reste */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 top-[85px] left-4 right-4 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((commune) => (
              <li 
                key={`${commune.nom}`}
                onClick={() => selectionnerVille(commune)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
              >
                <span className="font-medium">{commune.nom}</span> <span className="text-gray-500 text-sm"></span>
              </li>
            ))}
          </ul>
        )}

        <input type="hidden" name="ville" value={villeSelectionnee} />
       
        {(villeSelectionnee ) && (
          <p className="text-sm text-green-700 bg-green-50 p-2 rounded mt-1">
            ✓ Sélection enregistrée : <strong>{villeSelectionnee}</strong>
          </p>
        )}
      </div>
      {/* ------------------------------------------------ */}

      <div className="flex gap-3">
        <div className="flex-1">
          <Champ label="Prix (€)" erreurs={e.prix}>
            <input name="prix" type="number" step="any" defaultValue={v.prix} className="border rounded p-2 w-full" />
          </Champ>
        </div>
        <div className="flex-1">
          <Champ label="Date de disponibilité" erreurs={e.dateDisponibilite}>
            <input name="dateDisponibilite" type="date" defaultValue={v.dateDisponibilite} className="border rounded p-2 w-full" />
          </Champ>
        </div>
      </div>

      <Champ label="Type de bien" erreurs={e.typeBien}>
        <select name="typeBien" defaultValue={v.typeBien ?? "VENTE"} className="border rounded p-2 bg-white">
          <option value="VENTE">Vente</option>
          <option value="LOCATION">Location</option>
        </select>
      </Champ>

      {avecStatutBien && (
        <Champ label="Statut du bien" erreurs={e.statutBien}>
          <select name="statutBien" defaultValue={v.statutBien ?? "DISPONIBLE"} className="border rounded p-2 bg-white">
            <option value="DISPONIBLE">Disponible</option>
            <option value="LOUE">Loué</option>
            <option value="VENDU">Vendu</option>
          </select>
        </Champ>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-blue-600 text-white py-3 mt-4 font-medium disabled:opacity-50 hover:bg-blue-700"
      >
        {enCours ? "Enregistrement…" : bouton}
      </button>
    </form>
  )
}