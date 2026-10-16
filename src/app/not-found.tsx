import Link from "next/link"

export default function NotFound() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">404 — Page introuvable</h1>
      <p className="mt-2 text-gray-600">
        Cette page n&apos;existe pas
      </p>
      <Link href="/annonces" className="mt-4 inline-block underline">
        Retour aux annonces
      </Link>
    </div>
  )
}
