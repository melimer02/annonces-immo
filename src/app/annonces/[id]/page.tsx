import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

async function Questions({ annonceId }: { annonceId: number }) {
  const questions = await prisma.question.findMany({
    where: { annonceId },
    orderBy: { createdAt: "desc" },
    include: { auteur: { select: { name: true } } },
  })

  if (questions.length === 0) {
    return <p className="text-gray-500">Aucune question pour l'instant.</p>
  }

  return (
    <ul className="space-y-3 mt-3">
      {questions.map((q) => (
        <li key={q.id} className="rounded border p-3">
          <p><strong>{q.auteur.name} :</strong> {q.contenu}</p>
          {q.reponse ? (
            <p className="mt-1 text-gray-700">↳ {q.reponse}</p>
          ) : (
            <p className="mt-1 italic text-gray-400">En attente de réponse</p>
          )}
        </li>
      ))}
    </ul>
  )
}

export default async function AnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const annonceId = Number(id)

  if (Number.isNaN(annonceId)) notFound()

  const annonce = await prisma.annonce.findFirst({
    where: { id: annonceId, statutPublication: "PUBLIEE" },
    include: { auteur: { select: { name: true } } },
  })

  if (!annonce) notFound()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{annonce.titre}</h1>
      <p className="text-gray-500">Publiée par {annonce.auteur.name}</p>
      <p className="mt-4">{annonce.description}</p>
      <p className="mt-2 text-xl font-semibold">
        {annonce.prix.toLocaleString("fr-FR")} €
      </p>

      <h2 className="mt-8 text-xl font-semibold">Questions</h2>
      <Suspense fallback={<p>Chargement des questions…</p>}>
        <Questions annonceId={annonce.id} />
      </Suspense>
    </div>
  )
}
