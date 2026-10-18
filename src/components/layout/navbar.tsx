import Link from "next/link"
import { User, LogOut, Shield, Heart, Plus, Briefcase } from "lucide-react"

import { peutCreer } from "@/lib/authz"
import { LIBELLE_ROLE } from "@/lib/affichage"
import { deconnecter } from "@/app/logout/actions"
import { utilisateurCourant } from "@/lib/session"
import { devenirAgent } from "@/app/compte/agent/actions"
import { compterEnAttente } from "@/lib/admin"

export async function Navbar() {
  const user = await utilisateurCourant()
  
  const peutPublier = !!user && peutCreer(user)
  const enAttente = user?.role === "ADMIN" ? await compterEnAttente() : 0

  const lienTableauDeBord = 
    user?.role === "ADMIN" ? "/compte/admin" : 
    user?.role === "AGENT" ? "/compte/agent" : 
    "/compte/particulier"; 

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <nav aria-label="Navigation principale" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        
        {/* GAUCHE : Logo */}
        <Link href="/annonces" className="text-2xl font-extrabold tracking-tight text-primary hover:opacity-90">
          AgenceWeb
        </Link>

        {/* DROITE : Actions & Espace Utilisateur */}
        <div className="flex items-center gap-5">
          
          {/* 1. Les Actions (Favoris, Agent, Publier) */}
          <div className="hidden sm:flex items-center gap-4">
            {user?.role === "USER" && (
              <Link href="/favoris" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                <Heart className="h-4 w-4" /> Favoris
              </Link>
            )}

                      {!user && (
              <Link 
                href="/register?role=agent" 
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                <Briefcase className="h-4 w-4" /> Devenir agent
              </Link>
            )}

            {user?.role === "USER" && (
              <form action={devenirAgent}>
                <button 
                  type="submit" 
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  <Briefcase className="h-4 w-4" /> Devenir agent
                </button>
              </form>
            )}

            {peutPublier && (
              <Link href="/annonces/new" className="btn btn-primary flex items-center gap-1.5 py-2 text-sm shadow-sm hover:shadow-md">
                <Plus className="h-4 w-4" /> Créer une annonce
              </Link>
            )}
          </div>

          {/* Séparateur vertical visuel */}
          {user && <div className="hidden sm:block h-8 w-px bg-gray-200" aria-hidden="true" />}

          {/* 2. L'Espace Utilisateur */}
          {user ? (
            <div className="flex items-center gap-3">
              
           
              {user.role === "ADMIN" && (
                <Link href="/compte/admin/" className="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-primary rounded-full transition-colors" title="Administration">
                  <Shield className="h-5 w-5" />
                  {enAttente > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {enAttente}
                    </span>
                  )}
                </Link>
              )}

              {/* Pilule de Profil */}
              <Link 
                href={lienTableauDeBord} 
                className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-4 transition-all hover:border-gray-300 hover:bg-gray-100"
              >  
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-inner">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-none text-gray-900">{user.name}</span>
                  
              
                  <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    user.role === "AGENT" && user.statutPro === "REFUSE" 
                      ? "text-red-600" // Rouge si refusé
                      : "text-primary" // Bleu/Primaire sinon
                  }`}>
                    {user.role === "AGENT" && user.statutPro === "EN_ATTENTE" 
                      ? "EN ATTENTE DE VALIDATION" 
                      : user.role === "AGENT" && user.statutPro === "REFUSE"
                      ? "DEMANDE REFUSÉE"
                      : LIBELLE_ROLE[user.role]}
                  </span> 
                </div>
              </Link>

              {/* Bouton de déconnexion */}
              <form action={deconnecter}>
                <button type="submit" className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" title="Se déconnecter">
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-primary py-2 text-sm">
                Inscription
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}