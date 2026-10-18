import Link from "next/link"
import { exigerAdmin } from "@/lib/session"
import { AdminRechercheInput } from "@/lib/schemas"
import { listerUtilisateurs, statistiquesAdmin, PAR_PAGE_ADMIN } from "@/lib/admin"
import { Pagination } from "@/components/ui/pagination"
import { EtatVide } from "@/components/ui/etat-vide"
import { changerUtilisateur } from "./actions"

export const metadata = { title: "Administration · Utilisateurs" }

const VUES = [
  { cle: "attente", libelle: "À valider" },
  { cle: "agents", libelle: "Agents" },
  { cle: "particuliers", libelle: "Particuliers" },
  { cle: "tous", libelle: "Tous" },
] as const

type Badge = { texte: string; classe: string } | null;


const BADGE_STATUT: Record<string, Badge> = {
  AUCUN: null,
  EN_ATTENTE: { texte: "En attente", classe: "border-amber-200 bg-amber-50 text-amber-800" },
  VALIDE: { texte: "Validé", classe: "border-green-200 bg-green-50 text-green-800" },
  REFUSE: { texte: "Refusé", classe: "border-red-200 bg-red-50 text-red-800" },
};

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const admin = await exigerAdmin()
  const { page, vue, q } = AdminRechercheInput.parse(await searchParams)

  const [{ utilisateurs, total }, stats] = await Promise.all([
    listerUtilisateurs({ page, vue, q }),
    statistiquesAdmin(),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE_ADMIN))

  const lien = (changements: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams()
    const valeurs = { vue, q, ...changements }
    for (const [k, v] of Object.entries(valeurs)) if (v !== undefined && v !== "") params.set(k, String(v))
    const qs = params.toString()
    return qs ? `/compte/admin/?${qs}` : "/compte/admin"
  }

  const cartes = [
    { libelle: "Utilisateurs", valeur: stats.utilisateurs },
    { libelle: "Agents validés", valeur: stats.agents },
    { libelle: "En attente", valeur: stats.enAttente, alerte: stats.enAttente > 0 },
    { libelle: "Annonces", valeur: stats.annonces },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 rounded-2xl bg-primary-soft px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Administration</h1>
        <p className="mt-2 text-gray-700">Gestion des utilisateurs et validation des agents.</p>
      </header>

      <section aria-label="Statistiques" className="mb-8 grid gap-4 sm:grid-cols-4">
        {cartes.map((c) => (
          <div key={c.libelle}
            className={`rounded-xl border p-4 ${c.alerte ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}>
            <p className="text-sm text-gray-600">{c.libelle}</p>
            <p className="text-3xl font-extrabold text-gray-900">{c.valeur}</p>
          </div>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrer les utilisateurs" className="flex flex-wrap gap-2">
          {VUES.map((v) => (
            <Link key={v.cle} href={lien({ vue: v.cle, page: undefined })}
              aria-current={v.cle === vue ? "true" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                v.cle === vue ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-primary hover:text-primary"}`}>
              {v.libelle}
            </Link>
          ))}
        </nav>
        <form method="get" action="/compte/admin/" className="flex gap-2">
          <input type="hidden" name="vue" value={vue} />
          <label className="sr-only" htmlFor="q">Rechercher un utilisateur</label>
          <input id="q" name="q" defaultValue={q} placeholder="Nom ou email" className="champ" />
          <button type="submit" className="btn btn-primary">Rechercher</button>
        </form>
      </div>

      {utilisateurs.length === 0 ? (
        <EtatVide
          titre={vue === "attente" ? "Aucune demande en attente" : "Aucun utilisateur ne correspond"}
          action={vue !== "tous" || q ? { href: "/admin/utilisateurs?vue=tous", libelle: "Voir tous les utilisateurs" } : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Liste des utilisateurs</caption>
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3">Utilisateur</th>
                <th scope="col" className="px-4 py-3">Rôle</th>
                <th scope="col" className="px-4 py-3">Annonces</th>
                <th scope="col" className="px-4 py-3">Inscrit le</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utilisateurs.map((u) => {
                const badge = BADGE_STATUT[u.statutPro]
                const protege = u.role === "ADMIN" || u.id === admin.id
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-gray-600">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mr-2 font-semibold">{u.role}</span>
                      {u.role === "AGENT" && badge && (
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge.classe}`}>
                          {badge.texte}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{u._count.annonces}</td>
                    <td className="px-4 py-3">{u.createdAt.toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      {protege ? (
                        <p className="text-right text-gray-500">Protégé</p>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          {u.role === "AGENT" && u.statutPro !== "VALIDE" && (
                            <form action={changerUtilisateur.bind(null, u.id, "VALIDER")}>
                              <button className="btn btn-primary">Valider</button>
                            </form>
                          )}
                          {u.role === "AGENT" && u.statutPro === "EN_ATTENTE" && (
                            <form action={changerUtilisateur.bind(null, u.id, "REFUSER")}>
                              <button className="btn btn-secondary">Refuser</button>
                            </form>
                          )}
                          {u.role === "AGENT" && u.statutPro === "VALIDE" && (
                            <form action={changerUtilisateur.bind(null, u.id, "REPASSER_PARTICULIER")}>
                              <button className="btn btn-secondary">Retirer le statut agent</button>
                            </form>
                          )}
                    
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} lien={(p) => lien({ page: p })} />
    </div>
  )
}