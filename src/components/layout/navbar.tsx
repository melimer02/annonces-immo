import Link from "next/link"

import { peutCreer } from "@/lib/authz"
import { LIBELLE_ROLE } from "@/lib/affichage"
import { deconnecter } from "@/app/logout/actions"
import { utilisateurCourant } from "@/lib/session"
import { devenirAgent } from "@/app/compte/actions"

export async function Navbar() {

  const user = await utilisateurCourant()
  const peutPublier = !!user && peutCreer(user)

  return (
    <header className="border-b-4 border-primary bg-white shadow-sm">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/annonces"
            className="text-2xl font-extrabold tracking-tight text-primary hover:text-primary-hover"
          >
            AgenceWeb
          </Link>

          {peutPublier && (
            <Link href="/annonces/new" className="btn btn-primary">
              + Nouvelle annonce
            </Link>
          )}

          {user?.role === "USER" && (
            <Link href="/favoris" className="text-sm underline hover:text-gray-600">
              Mes favoris
            </Link>
          )}

          {!user && (
            <Link href="/register?role=agent" className="text-sm font-medium underline hover:text-gray-600">
              Devenir agent
            </Link>
          )}

          {user?.role === "USER" && (
            <form action={devenirAgent}>
              <button type="submit" className="text-sm font-medium underline hover:text-gray-600">
                Devenir agent
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-gray-800">
                {peutPublier ? (
                  <Link
                    href="/compte"
                    aria-label={`Mon compte : ${user.name}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {user.name}
                  </Link>
                ) : (
                  <span>{user.name}</span>
                )}
                <span className="rounded-full border border-teal-200 bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                  {LIBELLE_ROLE[user.role]}
                </span>
              </div>
              <form action={deconnecter}>
                <button type="submit" className="btn btn-secondary">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-primary">
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}