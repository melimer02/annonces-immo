"use client" // useActionState est un hook : ce composant doit être côté client

import { useActionState } from "react"
import { inscrire } from "@/app/register/actions"
import { Champ } from "@/components/champ"
import type { EtatFormulaire } from "@/lib/form"

export function FormRegister() {
  const [etat, formAction, enCours] = useActionState(inscrire, {} as EtatFormulaire)
  const e = etat.erreurs ?? {}
  const v = etat.valeurs ?? {}

  return (
    <form action={formAction} noValidate className="space-y-4">
      {etat.message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {etat.message}
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
      <button type="submit" disabled={enCours} className="btn btn-primary w-full py-3 text-base">
        {enCours ? "Inscription…" : "S'inscrire"}
      </button>
    </form>
  )
}
