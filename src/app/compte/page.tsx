import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { exigerAgent } from "@/lib/session"
import { peutModifier } from "@/lib/authz"
import { CompteInput } from "@/lib/schemas"
import { listerAnnonces, PAR_PAGE } from "@/lib/annonces"
import { CarteAnnonce } from "@/components/annonces/carte-annonce"
import { EtatVide } from "@/components/ui/etat-vide"
import { Pagination } from "@/components/ui/pagination"

export const metadata = { title: "Mon compte" }

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {

  const user = await exigerAgent()

  const { page, vue } = CompteInput.parse(await searchParams)
  const brouillons = vue === "brouillons"

  const [{ annonces, total }, compte, nbBrouillons, nbPubliees] = await Promise.all([
    listerAnnonces(user, { 
      page, 
      auteurId: user.id, 
      // Ici on passe le bon statut selon l'onglet
      statutPublication: brouillons ? "BROUILLON" : "PUBLIEE" 
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
    prisma.annonce.count({ where: { auteurId: user.id, statutPublication: "BROUILLON" } }),
    prisma.annonce.count({ where: { auteurId: user.id, statutPublication: "PUBLIEE" } }), 
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE))

  const lien = (p: number) => {
    const params = new URLSearchParams()
    if (brouillons) params.set("vue", "brouillons")
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return qs ? `/compte?${qs}` : "/compte"
  }

  const onglets = [
    { libelle: "Mes annonces", nb: nbPubliees, href: "/compte", actif: !brouillons },
    { libelle: "Mes brouillons", nb: nbBrouillons, href: "/compte?vue=brouillons", actif: brouillons },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 rounded-2xl bg-primary-soft px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Mon compte</h1>
        <p className="mt-2 text-gray-700">
          {compte?.name} · {nbPubliees} annonce{nbPubliees > 1 ? "s" : ""}, dont {nbBrouillons} brouillon
          {nbBrouillons > 1 ? "s" : ""}
        </p>
      </header>

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
        <p className="text-sm text-gray-600">
          {total === 0 ? "Aucun résultat" : `${total} annonce${total > 1 ? "s" : ""}`}
        </p>
      </div>

      {annonces.length === 0 ? (
        <EtatVide
          titre={
            page > 1
              ? "Cette page de résultats n'existe pas"
              : brouillons
                ? "Vous n'avez aucun brouillon"
                : "Vous n'avez pas encore d'annonce"
          }
          action={
            page > 1 || brouillons
              ? { href: "/compte", libelle: "Voir toutes mes annonces" }
              : { href: "/annonces/new", libelle: "Créer ma première annonce" }
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
