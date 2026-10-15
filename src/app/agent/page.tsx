
import Link from "next/link"
import { redirect } from "next/navigation"
import { utilisateurCourant } from "@/lib/session"
import { demanderAgent } from "./actions"

export default async function PageDevenirAgent() {
  const user = await utilisateurCourant()

  if (user?.role === "AGENT" && user.statutPro === "VALIDE") redirect("/annonces/new")
  if (user?.role === "AGENT") redirect("/en-attente")
  if (user?.role === "ADMIN") redirect("/annonces")

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold">Devenir agent</h1>
        <p className="text-gray-600">
          Publiez vos annonces de vente et de location sur ImmoWeb.
        </p>
      </div>

 
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
        <li>Créez un compte ou connectez-vous</li>
        <li>Envoyez votre demande</li>
        <li>Notre équipe la valide</li>
        <li>Vous pouvez publier vos annonces</li>
      </ol>

      
      {user ? (
        <form action={demanderAgent}>
          <button type="submit" className="btn btn-primary w-full">
            Envoyer ma demande
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <Link href="/register" className="btn btn-primary block text-center">
            Créer un compte
          </Link>
          <p className="text-center text-sm text-gray-600">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-primary underline">
              Connexion
            </Link>
          </p>
        </div>
      )}
    </main>
  )
}