import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { peutCreer, type Role } from "@/lib/authz"
import { deconnecter } from "@/app/logout/actions"

export async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role: Role = ((session?.user as { role?: Role } | undefined)?.role) ?? "USER"
  const peutPublier = !!session && peutCreer({ id: session.user.id, role })

  return (
    <header className="border-b">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link href="/annonces" className="font-bold">
            Annonces immobilières
          </Link>
          {peutPublier && (
            <Link href="/annonces/new" className="text-sm underline">
              Nouvelle annonce
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {session ? (
            <>
              <span>
                {session.user.name}{" "}
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{role}</span>
              </span>
              <form action={deconnecter}>
                <button type="submit" className="underline">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline">
                Connexion
              </Link>
              <Link href="/register" className="underline">
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
