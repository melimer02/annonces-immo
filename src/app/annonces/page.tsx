import Link from "next/link"
import { utilisateurCourant } from "@/lib/session"
import { RechercheInput } from "@/lib/shema"
import { listerAnnonces, PAR_PAGE } from "@/lib/annonces"
import { EtatVide } from "@/components/etat-vide"
import { CarteAnnonce } from "@/components/carte-annonce"
import { peutCreer } from "@/lib/authz"

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Annonces</h1>

      <div className="flex gap-2 mb-6">
        <Link href="/annonces" className={`rounded border px-3 py-1 ${!type ? "bg-gray-200" : ""}`}>
          Tous
        </Link>
        <Link href="/annonces?type=VENTE" className={`rounded border px-3 py-1 ${type === "VENTE" ? "bg-gray-200" : ""}`}>
          Vente
        </Link>
        <Link href="/annonces?type=LOCATION" className={`rounded border px-3 py-1 ${type === "LOCATION" ? "bg-gray-200" : ""}`}>
          Location
        </Link>
      </div>

      {annonces.length === 0 ? (
        <EtatVide
          titre={type ? "Aucune annonce de ce type" : "Aucune annonce pour le moment"}
          action={
            type
              ? { href: "/annonces", libelle: "Voir toutes les annonces" }
              : user && peutCreer(user)
                ? { href: "/annonces/new", libelle: "Créer la première annonce" }
                : undefined
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <li key={a.id}>
              <CarteAnnonce annonce={a} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/annonces?page=${n}${suffixeType}`}
              className={`rounded border px-3 py-1 ${n === page ? "bg-gray-800 text-white" : ""}`}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
