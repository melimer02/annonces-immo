import Link from "next/link"

export function EtatVide({
  titre,
  action,
}: {
  titre: string
  action?: { href: string; libelle: string }
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="font-medium">{titre}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block text-sm underline">
          {action.libelle}
        </Link>
      )}
    </div>
  )
}
