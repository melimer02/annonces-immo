import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { RechercheInput } from "@/lib/schemas"
import { listerAnnonces, PAR_PAGE } from "@/lib/annonces"
import { EtatVide } from "@/components/ui/etat-vide"
import { CarteAnnonce } from "@/components/annonces/carte-annonce"
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
  const { page, type,ville, prixMin, prixMax } = RechercheInput.parse(sp)
  const user = await utilisateurCourant()

  const { annonces, total } = await listerAnnonces(user, { page, type,ville, prixMin, prixMax })

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE))
  const filtresActifs = !!ville || prixMin !== undefined || prixMax !== undefined

  
  // Utilitaire pour la pagination (
  const lien = (changements: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams()
    const valeurs: Record<string, string | number | undefined> = {
      type,
      ville,
      prixMin,
      prixMax,
      ...changements,
    }
    for (const [cle, v] of Object.entries(valeurs)) {
      if (v !== undefined && v !== "") params.set(cle, String(v))
    }
    const qs = params.toString()
    return qs ? `/annonces?${qs}` : "/annonces"
  }

  // Récupération des IDs favoris de l'utilisateur 
  const idsFavoris = user && user.role === "USER"
    ? await prisma.favori.findMany({
        where: { userId: user.id },
        select: { annonceId: true }
      }).then(favoris => favoris.map(f => f.annonceId))
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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
      {/* Formulaire GET */}
      <form
        method="get"
        action="/annonces"
        className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4"
      >
        {type && <input type="hidden" name="type" value={type} />}

        <label className="text-sm font-medium text-gray-700">
          Ville
          <input name="ville" defaultValue={ville} placeholder="Rouen" className="champ mt-1" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Prix min (€)
          <input name="prixMin" type="number" min={0} defaultValue={prixMin} className="champ mt-1" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Prix max (€)
          <input name="prixMax" type="number" min={0} defaultValue={prixMax} className="champ mt-1" />
        </label>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary">
            Filtrer
          </button>
          {filtresActifs && (
            <Link
              href={lien({ ville: undefined, prixMin: undefined, prixMax: undefined })}
              className="btn btn-secondary"
            >
              Réinitialiser
            </Link>
          )}
        </div>
      </form>
      {annonces.length === 0 ? (
        <EtatVide
          titre={
            page > 1
              ? "Cette page de résultats n'existe pas"
              : type || filtresActifs
                ? "Aucune annonce ne correspond à votre recherche"
                : "Aucune annonce pour le moment"
          }
          action={
            page > 1 || type || filtresActifs
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
            <Link href={lien({ page: page - 1 })} rel="prev" className="btn btn-secondary">
              ← Précédent
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={lien({ page: n })}
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
             <Link href={lien({ page: page + 1 })} rel="next" className="btn btn-secondary">
           
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}