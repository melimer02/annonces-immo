import Link from "next/link"
import { Heart, Settings, Briefcase, User,FaceSlightlySmiling } from "lucide-react"
import { utilisateurCourant } from "@/lib/session"
import { devenirAgent } from "../agent/actions" 

export const metadata = { title: "Mon compte · AgenceWeb" }

export default async function CompteParticulierPage() {
  const user = await utilisateurCourant()

  if (!user) return null 
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      
      {/* En-tête de bienvenue */}
      <header className="mb-8 rounded-2xl bg-slate-50 px-6 py-8 border border-slate-100">
        <h1 className="text-3xl font-extrabold text-gray-900">
       <FaceSlightlySmiling className="inline h-6 w-6 mr-2 text-primary" /> Bienvenue, {user.name} !
        </h1>
        <p className="mt-2 text-gray-600">Bienvenue sur votre espace personnel.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Carte 1 : Profil */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Mes informations</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-900">Nom :</span> {user.name}</p>
    

            <p><span className="font-semibold text-gray-900">Statut :</span> Particulier</p>
          </div>
          <div className="mt-6">
            <button className="btn btn-secondary w-full text-sm">
              <Settings className="mr-2 h-4 w-4 inline" /> Paramètres du compte
            </button>
          </div>
        </section>

        {/* Carte 2 : Favoris */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="rounded-full bg-red-50 p-2 text-red-500">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Mes coups de cœur</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Retrouvez facilement toutes les annonces que vous avez sauvegardées lors de vos recherches.
          </p>
          <Link href="/favoris" className="btn btn-primary w-full text-center">
            Voir mes annonces favorites
          </Link>
        </section>

        {/* Carte 3 : Mise à niveau  */}
        <section className="md:col-span-2 rounded-xl border border-primary/20 bg-primary-soft p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary p-3 text-white mt-1">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vous avez un bien à vendre ou à louer ?</h2>
                <p className="mt-1 text-gray-700">
                  Passez au statut Agent pour pouvoir publier vos propres annonces immobilières sur la plateforme. Cest gratuit !
                </p>
              </div>
            </div>
            
            <form action={devenirAgent} className="w-full md:w-auto shrink-0">
              <button className="btn btn-primary w-full shadow-md">
                Devenir Agent
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  )
}