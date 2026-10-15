"use client" // useActionState est un hook : ce composant doit être côté client

import { useActionState, useState } from "react"
import { inscrire } from "@/app/register/actions"
import { Champ } from "@/components/champ"
import type { EtatFormulaire } from "@/lib/form"


const TYPES_COMPTE = [
  { valeur: "USER", titre: "Particulier", desc: "Je cherche ou je publie une annonce" },
  { valeur: "AGENT", titre: "Agent / Pro", desc: "Je représente une agence" },
] as const


export function FormRegister() {
  const [etat, formAction, enCours] = useActionState(inscrire, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  const v = etat.valeurs ?? {}
  const [role, setRole] = useState<"USER" | "AGENT">(v.role === "AGENT" ? "AGENT" : "USER")


  return (
    <form action={formAction} noValidate className="space-y-4">
      {etat.message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {etat.message}
        </p>
      )}
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">Type de compte</legend>
        {TYPES_COMPTE.map((t) => (
          <label
            key={t.valeur}
            className={`cursor-pointer rounded-lg border p-3 ${
              role === t.valeur ? "border-gray-800 bg-gray-50" : "border-gray-200"
            }`}
>
                <input
              type="radio"
              name="role"
              value={t.valeur}
              checked={role === t.valeur}
              onChange={() => setRole(t.valeur)}
              className="sr-only"
            />
            <span className="block font-medium">{t.titre}</span>
            <span className="text-sm text-gray-600">{t.desc}</span>
        
      </label>
        ))}
        </fieldset>
            {e.role && (
        <p role="alert" className="text-sm text-red-600">
          {e.role[0]}
        </p>
      )}

      <Champ label="Nom" erreurs={e.name}>
        <input name="name" autoComplete="name" defaultValue={v.name} className="champ" />
      </Champ>
      <Champ label="Email" erreurs={e.email}>
        <input name="email" type="email" autoComplete="email" defaultValue={v.email} className="champ" />
      </Champ>
      <Champ label="Mot de passe" erreurs={e.password}>
        <input name="password" type="password" autoComplete="new-password" className="champ" />
      </Champ>
      {role === "AGENT" && (
      <p className="text-sm text-gray-600">
      Votre compte pro sera activé après validation par notre équipe.
      </p>
)}
      <button type="submit" disabled={enCours} className="btn btn-primary w-full py-3 text-base">
        {enCours ? "Inscription…" : "S'inscrire"}
      </button>
    </form>
  )
}
