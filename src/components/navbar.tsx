import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { deconnecter } from "@/app/logout/actions"

export async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <Link href="/annonces" className="font-bold">Annonces Immo</Link>

      <div className="flex items-center gap-4 text-sm">
        {session ? (
          <>
            <span>
              {session.user.name} ({session.user.role})
            </span>
            <form action={deconnecter}>
              <button type="submit" className="underline">Déconnexion</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Connexion</Link>
            <Link href="/register">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  )
}
