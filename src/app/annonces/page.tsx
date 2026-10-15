import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { RechercheInput } from "@/lib/shema"
import { listerAnnonces, PAR_PAGE } from "@/lib/annonces"
import { EtatVide } from "@/components/etat-vide"
import { CarteAnnonce } from "@/components/carte-annonce"
import { peutCreer, peutModifier } from "@/lib/authz"

const FILTRES = [
  { libelle: "Tous", valeur: undefined, href: "/annonces" },
  { libelle: "Vente", valeur: "VENTE", href: "/annonces?type=VENTE" },
  { libelle: "Location", valeur: "LOCATION", href: "/annonces?type=LOCATION" },
] as const

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { page, type } = RechercheInput.parse(sp)
  const user = await utilisateurCourant()

  const { annonces, total } = await listerAnnonces(user, { page, type })

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE))
  const suffixeType = type ? `&type=${type}` : ""
  
  // Utilitaire pour la pagination (code du main)
  const lien = (n: number) => `/annonces?page=${n}${suffixeType}`

  // Récupération des IDs favoris de l'utilisateur (votre code)
  const idsFavoris = user && user.role === "USER"
    ? await prisma.favori.findMany({
        where: { userId: user.id },
        select: { annonceId: true }
      }).then(favoris => favoris.map(f => f.annonceId))
    : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 rounded-2xl bg-primary-soft px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Trouvez votre prochain bien</h1>
        <p className="mt-2 max-w-2xl text-gray-700">
          Annonces de vente et de location publiées par nos agents.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrer par type de bien" className="flex flex-wrap gap-2">
          {FILTRES.map((f) => {
            const actif = f.valeur === type
            return (
              <Link
                key={f.libelle}
                href={f.href}
                aria-current={actif ? "true" : undefined}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  actif
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-800 hover:border-primary hover:text-primary"
                }`}
              >
                {f.libelle}
              </Link>
            )
          })}
        </nav>
        <p className="text-sm text-gray-600">
          {total === 0 ? "Aucun résultat" : `${total} annonce${total > 1 ? "s" : ""}`}
        </p>
      </div>

      {annonces.length === 0 ? (
        <EtatVide
          titre={
            page > 1
              ? "Cette page de résultats n'existe pas"
              : type
                ? "Aucune annonce de ce type"
                : "Aucune annonce pour le moment"
          }
          action={
            page > 1 || type
              ? { href: "/annonces", libelle: "Voir toutes les annonces" }
              : user && peutCreer(user)
                ? { href: "/annonces/new", libelle: "Créer la première annonce" }
                : undefined
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <li key={a.id}>
              {/* Fusion parfaite : on passe vos props favoris ET les props d'édition */}
              <CarteAnnonce 
                annonce={a} 
                estFavori={idsFavoris.includes(a.id)}
                userRole={user?.role}
                peutEditer={!!user && peutModifier(user, a)}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {page > 1 && (
            <Link href={lien(page - 1)} rel="prev" className="btn btn-secondary">
              ← Précédent
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={lien(n)}
              aria-current={n === page ? "page" : undefined}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold ${
                n === page
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-primary hover:text-primary"
              }`}
            >
              {n}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={lien(page + 1)} rel="next" className="btn btn-secondary">
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}