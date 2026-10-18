import Link from "next/link"
import { notFound } from "next/navigation"
import { User, AlertCircle, CheckCircle2 } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"
import { peutModifier, peutCreer } from "@/lib/authz" 
import { CompteInput } from "@/lib/schemas"
import { listerAnnonces, PAR_PAGE } from "@/lib/annonces"
import { CarteAnnonce } from "@/components/annonces/carte-annonce"
import { EtatVide } from "@/components/ui/etat-vide"
import { Pagination } from "@/components/ui/pagination"

export const metadata = { title: "Espace Agent" }

export default async function CompteAgentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await exigerUtilisateur()
  
  if (user.role !== "AGENT") notFound()

  const { page, vue } = CompteInput.parse(await searchParams)
  const brouillons = vue === "brouillons"
  
  const estEnAttente = user.statutPro === "EN_ATTENTE"
  const aLeDroitDeCreer = peutCreer(user) 

  const [{ annonces, total }, compte, nbBrouillons, nbPubliees] = await Promise.all([
    listerAnnonces(user, { 
      page, 
      auteurId: user.id, 
      statutPublication: brouillons ? "BROUILLON" : "PUBLIEE" 
    }),
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.annonce.count({ where: { auteurId: user.id, statutPublication: "BROUILLON" } }),
    prisma.annonce.count({ where: { auteurId: user.id, statutPublication: "PUBLIEE" } }), 
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE))

  const lien = (p: number) => {
    const params = new URLSearchParams()
    if (brouillons) params.set("vue", "brouillons")
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return qs ? `/compte/agent?${qs}` : "/compte/agent"
  }

  const onglets = [
    { libelle: "Mes annonces", nb: nbPubliees, href: "/compte/agent", actif: !brouillons },
    { libelle: "Mes brouillons", nb: nbBrouillons, href: "/compte/agent?vue=brouillons", actif: brouillons },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      
      {/* --- BANDEAU SI EN ATTENTE --- */}
      {estEnAttente && (
        <div className="mb-8 flex items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-6 text-orange-800">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold">Votre compte est en cours de validation</h2>
            
            <p className="mt-1 text-sm">
              Un administrateur doit valider votre profil avant que vous ne puissiez commencer à créer et publier des annonces. 
              Veuillez patienter, cette opération ne prend généralement que quelques heures.
            </p>
          </div>
        </div>
      )}

      {/* --- INFOS DU PROFIL --- */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <User className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-extrabold text-gray-900">{compte?.name}</h1>
          <p className="text-gray-600">{compte?.email}</p>
        </div>
        <div className="text-center md:text-right">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
            estEnAttente ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
          }`}>
            {estEnAttente ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {estEnAttente ? "Agent en attente" : "Agent vérifié"}
          </span>
          <p className="mt-2 text-sm text-gray-500">
            {nbPubliees + nbBrouillons} annonce(s) au total
          </p>
        </div>
      </section>

      {/* --- GESTION DES ANNONCES --- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrer mes annonces" className="flex flex-wrap gap-2">
          {onglets.map((o) => (
            <Link
              key={o.libelle}
              href={o.href}
              aria-current={o.actif ? "true" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                o.actif
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-primary hover:text-primary"
              }`}
            >
              {o.libelle} ({o.nb})
            </Link>
          ))}
        </nav>
      </div>

      {annonces.length === 0 ? (
        <EtatVide
          titre={
            page > 1
              ? "Cette page de résultats n'existe pas"
              : brouillons
                ? "Vous n'avez aucun brouillon"
                : "Vous n'avez pas encore d'annonce publiée"
          }
          action={
            page > 1 || brouillons
              ? { href: "/compte/agent", libelle: "Voir toutes mes annonces" }
          
              : aLeDroitDeCreer 
                ? { href: "/annonces/new", libelle: "Créer ma première annonce" }
                : undefined
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <li key={a.id}>
              <CarteAnnonce annonce={a} userRole={user.role} peutEditer={peutModifier(user, a)} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} lien={lien} />
    </div>
  )
}