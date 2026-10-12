import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { RechercheInput } from "@/lib/shema"

const PAR_PAGE = 6

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { page, type } = RechercheInput.parse(sp)
  
  const user = await utilisateurCourant()

const visibilite = user?.role === "ADMIN"
  ? [{ statutPublication: "PUBLIEE" as const }, { statutPublication: "BROUILLON" as const }]
  : user
  ? [{ statutPublication: "PUBLIEE" as const }, { statutPublication: "BROUILLON" as const, auteurId: user.id }]
  : [{ statutPublication: "PUBLIEE" as const }]

const where = {
  OR: visibilite,
  ...(type ? { typeBien: type } : {}),
}

  const [annonces, total] = await Promise.all([
    prisma.annonce.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
    }),
    prisma.annonce.count({ where }),
  ])

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
        <p>Aucune annonce trouvée.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <li key={a.id} className="rounded-lg border p-4 shadow">
              <Link href={`/annonces/${a.id}`}>
                <h2 className="text-lg font-semibold">{a.titre}</h2>
                <p className="text-sm text-gray-500">{a.typeBien}</p>
                <p className="text-gray-700">{a.prix.toLocaleString("fr-FR")} €</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/annonces?page=${n}${suffixeType}`}
              className={`rounded border px-3 py-1 ${n === page ? "bg-gray-800 text-white" : ""}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
