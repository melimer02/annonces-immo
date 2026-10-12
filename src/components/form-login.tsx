"use client" // useActionState est un hook : ce composant doit être côté client

import { useActionState } from "react"
import { connecter } from "@/app/login/actions"
import { Champ } from "@/components/champ"
import type { EtatFormulaire } from "@/lib/form"

export function FormLogin() {
  const [etat, formAction, enCours] = useActionState(connecter, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  const v = etat.valeurs ?? {}

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {etat.message && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {etat.message}
        </p>
      )}
      <Champ label="Email" erreurs={e.email}>
        <input name="email" type="email" defaultValue={v.email} className="border rounded p-2" />
      </Champ>
      <Champ label="Mot de passe" erreurs={e.password}>
        <input name="password" type="password" className="border rounded p-2" />
      </Champ>
      <button type="submit" disabled={enCours} className="rounded bg-gray-800 text-white py-2 disabled:opacity-50">
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  )
}
