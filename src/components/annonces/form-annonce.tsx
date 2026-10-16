"use client" // useActionState + état local de l'autocomplétion de ville : des hooks → composant client

import { useActionState, useEffect, useId, useState, type KeyboardEvent } from "react"
import { Champ } from "@/components/ui/champ"
import { jourParis } from "@/lib/dates"
import { ChampPhotos, usePhotosChoisies } from "@/components/annonces/champ-photos"
import type { EtatFormulaire } from "@/lib/form"

type Valeurs = Partial<
  Record<"titre" | "description" | "prix" | "dateDisponibilite" | "typeBien" | "statutBien" | "ville", string>
>

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  bouton: string
  valeursInitiales?: Valeurs
  avecStatutBien?: boolean
  avecPhotos?: boolean // création : zone d'ajout de photos à côté du formulaire
}

// Réponse de l'API Géo (geo.api.gouv.fr)
type Commune = { code: string; nom: string; codesPostaux?: string[] }

export function FormAnnonce({
  action,
  bouton,
  valeursInitiales,
  avecStatutBien = false,
  avecPhotos = false,
}: Props) {
  const [etat, formAction, enCours] = useActionState(action, {} as EtatFormulaire)
  const [photos, setPhotos] = usePhotosChoisies(etat)

  // Les photos choisies vivent dans l'état React (pas dans le champ fichier du navigateur) :
  // on les ajoute au FormData au moment de l'envoi.
  function envoyer(formData: FormData) {
    photos.forEach((f) => formData.append("photos", f))
    formAction(formData)
  }
  const e = etat.erreurs ?? {}
  const v: Valeurs = { ...valeursInitiales, ...etat.valeurs }

  // ── Autocomplétion de la ville (modèle ARIA "combobox" avec liste) ──
  const id = useId()
  const idChamp = `${id}-ville`
  const idListe = `${id}-liste`
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`
  const idForm = `${id}-formulaire` // relie les champs placés hors du <form> à ce formulaire

  const [saisie, setSaisie] = useState(v.ville ?? "") // ce que l'utilisateur tape
  const [villeChoisie, setVilleChoisie] = useState(v.ville ?? "") // ce qui sera envoyé
  const [suggestions, setSuggestions] = useState<Commune[]>([])
  const [actif, setActif] = useState(-1) // suggestion surlignée au clavier
  const [apiIndisponible, setApiIndisponible] = useState(false)
  const [statut, setStatut] = useState("") // annonce vocale pour les lecteurs d'écran

  useEffect(() => {
    if (saisie.length < 2 || saisie === villeChoisie) return

    const controleur = new AbortController() // annule la requête précédente si on retape
    const minuteur = setTimeout(async () => {
      try {
        const url =
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(saisie)}` +
          `&fields=nom,code,codesPostaux&boost=population&limit=5`
        const reponse = await fetch(url, { signal: controleur.signal })
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
        const communes: Commune[] = await reponse.json()
        setSuggestions(communes)
        setActif(-1)
        setApiIndisponible(false)
        setStatut(communes.length > 0 ? `${communes.length} suggestion(s) disponible(s)` : "Aucune ville trouvée")
      } catch {
        if (controleur.signal.aborted) return
        setApiIndisponible(true)
        setSuggestions([])
      }
    }, 250)

    return () => {
      clearTimeout(minuteur)
      controleur.abort()
    }
  }, [saisie, villeChoisie])

  function changerSaisie(valeur: string) {
    setSaisie(valeur)
    setActif(-1)
    // Retaper invalide le choix précédent. Sauf si l'API est en panne : saisie libre.
    setVilleChoisie(apiIndisponible ? valeur.trim() : "")
    if (valeur.length < 2) {
      setSuggestions([])
      setStatut("")
    }
  }

  function choisir(commune: Commune) {
    setVilleChoisie(commune.nom)
    setSaisie(commune.nom)
    setSuggestions([])
    setActif(-1)
    setStatut(`${commune.nom} sélectionnée`)
  }

  function toucheClavier(ev: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return
    if (ev.key === "ArrowDown") {
      ev.preventDefault()
      setActif((i) => (i + 1) % suggestions.length)
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault()
      setActif((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (ev.key === "Enter" && actif >= 0) {
      ev.preventDefault() // ne pas envoyer le formulaire : on choisit la suggestion
      choisir(suggestions[actif])
    } else if (ev.key === "Escape") {
      setSuggestions([])
      setActif(-1)
    }
  }

  // Avec les photos, le bouton est placé SOUS les deux colonnes ; l'attribut form le relie au <form>
  const boutonSoumettre = (
    <button
      type="submit"
      form={idForm}
      disabled={enCours}
      className="btn btn-primary w-full py-3 text-base"
    >
      {enCours ? "Enregistrement…" : bouton}
    </button>
  )

  return (
    <div className={avecPhotos ? "space-y-6" : undefined}>
    <div className={avecPhotos ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" : undefined}>
    <form id={idForm} action={envoyer} noValidate className="carte space-y-5 p-6">
      <Champ label="Titre" erreurs={e.titre}>
        <input name="titre" defaultValue={v.titre} className="champ" />
      </Champ>

      <Champ label="Description" erreurs={e.description}>
        <textarea name="description" rows={5} defaultValue={v.description} className="champ" />
      </Champ>

      <fieldset className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-800">Localisation</legend>

        <label htmlFor={idChamp} className="text-sm font-medium">
          Ville
        </label>
        <div className="relative">
          <input
            id={idChamp}
            type="text"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls={idListe}
            aria-autocomplete="list"
            aria-activedescendant={actif >= 0 ? `${id}-option-${actif}` : undefined}
            aria-invalid={e.ville ? true : undefined}
            aria-describedby={e.ville ? `${idAide} ${idErreur}` : idAide}
            value={saisie}
            onChange={(ev) => changerSaisie(ev.target.value)}
            onKeyDown={toucheClavier}
            autoComplete="off"
            placeholder="Ex : Le Havre"
            className="champ"
          />

          {suggestions.length > 0 && (
            <ul
              id={idListe}
              role="listbox"
              aria-label="Villes suggérées"
              className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {suggestions.map((commune, i) => (
                <li
                  key={commune.code}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={i === actif}
                  onClick={() => choisir(commune)}
                  className={`cursor-pointer px-3 py-2 ${
                    i === actif ? "bg-primary-soft text-primary" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{commune.nom}</span>
                  {commune.codesPostaux?.[0] && (
                    <span className="ml-2 text-sm text-gray-600">{commune.codesPostaux[0]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p id={idAide} className="text-sm text-gray-600">
          {apiIndisponible
            ? "Suggestions indisponibles : saisissez le nom de la ville."
            : "Tapez au moins 2 lettres, puis choisissez une ville dans la liste (flèches + Entrée au clavier)."}
        </p>

        {e.ville?.[0] && (
          <p id={idErreur} role="alert" className="text-sm text-red-700">
            {e.ville[0]}
          </p>
        )}

        {/* Seule la ville CHOISIE part au serveur, pas le texte en cours de frappe */}
        <input type="hidden" name="ville" value={villeChoisie} />

        {villeChoisie && (
          <p className="rounded bg-green-50 px-2 py-1 text-sm text-green-800">
            ✓ Ville retenue : <strong>{villeChoisie}</strong>
          </p>
        )}

        <p role="status" className="sr-only">
          {statut}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Prix (€)" erreurs={e.prix}>
          <input name="prix" type="number" step="any" defaultValue={v.prix} className="champ" />
        </Champ>
        <Champ label="Date de disponibilité" erreurs={e.dateDisponibilite}>
          <input name="dateDisponibilite" type="date" min={jourParis()} defaultValue={v.dateDisponibilite} className="champ" />
        </Champ>
      </div>

      <Champ label="Type de bien" erreurs={e.typeBien}>
        <select name="typeBien" defaultValue={v.typeBien ?? "VENTE"} className="champ">
          <option value="VENTE">Vente</option>
          <option value="LOCATION">Location</option>
        </select>
      </Champ>

      {avecStatutBien && (
        <Champ label="Statut du bien" erreurs={e.statutBien}>
          <select name="statutBien" defaultValue={v.statutBien ?? "DISPONIBLE"} className="champ">
            <option value="DISPONIBLE">Disponible</option>
            <option value="LOUE">Loué</option>
            <option value="VENDU">Vendu</option>
          </select>
        </Champ>
      )}

      {!avecPhotos && boutonSoumettre}
    </form>

    {avecPhotos && (
      <aside aria-label="Photos de l'annonce" className="carte p-6 lg:sticky lg:top-6">
        <ChampPhotos
          fichiers={photos}
          onChange={setPhotos}
          erreur={etat.erreurs?.photos?.[0]}
          note="Elles seront enregistrées avec l'annonce, quand vous cliquerez sur « Créer l'annonce »."
        />
      </aside>
    )}
    </div>

    {avecPhotos && boutonSoumettre}
    </div>
  )
}
