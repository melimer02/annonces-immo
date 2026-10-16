"use client" // useActionState est un hook : ce composant doit être côté client

import { useActionState } from "react"
import { connecter } from "@/app/login/actions"
import { Champ } from "@/components/ui/champ"
import type { EtatFormulaire } from "@/lib/form"

export function FormLogin() {
  const [etat, formAction, enCours] = useActionState(connecter, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  const v = etat.valeurs ?? {}

  return (
    <form action={formAction} noValidate className="space-y-4">
      {etat.message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {etat.message}
        </p>
      )}
      <Champ label="Email" erreurs={e.email}>
        <input name="email" type="email" autoComplete="email" defaultValue={v.email} className="champ" />
      </Champ>
      <Champ label="Mot de passe" erreurs={e.password}>
        <input name="password" type="password" autoComplete="current-password" className="champ" />
      </Champ>
      <button type="submit" disabled={enCours} className="btn btn-primary w-full py-3 text-base">
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  )
}
