import Link from "next/link"

type Props = {
  page: number
  totalPages: number
  // Construit l'adresse d'une page donnée (garde les filtres de la page appelante)
  lien: (page: number) => string
}

export function Pagination({ page, totalPages, lien }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
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
  )
}
