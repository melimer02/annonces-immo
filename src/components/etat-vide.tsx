import Link from "next/link"

export function EtatVide({
  titre,
  action,
}: {
  titre: string
  action?: { href: string; libelle: string }
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
      <p className="text-lg font-semibold text-gray-900">{titre}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary mt-4">
          {action.libelle}
        </Link>
      )}
    </div>
  )
}
