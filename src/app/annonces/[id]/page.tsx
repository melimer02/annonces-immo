import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { peutVoir } from "@/lib/authz"
import { IdInput } from "@/lib/shema"
import Link from "next/link"
import { peutModifier } from "@/lib/authz"
import { supprimerAnnonce , changerPublication,poserQuestion,repondreQuestion} from "../actions"
import { FormTexte } from "@/components/form-texte"



async function Questions({ annonceId ,isOwner}: { annonceId: number , isOwner: boolean }) {
  const questions = await prisma.question.findMany({
    where: { annonceId },
    orderBy: { createdAt: "desc" },
    include: { auteur: { select: { name: true } } },
  })

  if (questions.length === 0) {
    return <p className="text-gray-500">Aucune question pour linstant.</p>
  }

  return (
<ul className="space-y-3 mt-3">
      {questions.map((q) => (
        <li key={q.id} className="rounded border p-3">
          <p><strong>{q.auteur.name} :</strong> {q.contenu}</p>
          
          {q.reponse ? (
            <p className="mt-1 text-gray-700">↳ {q.reponse}</p>
          ) : (
            <>
              <p className="mt-1 italic text-gray-400">En attente de réponse</p>
              
               {isOwner && (
                <div className="mt-2">
                  <FormTexte
                    action={repondreQuestion.bind(null, q.id)}
                    nom="reponse"
                    placeholder="Votre réponse (min 5 caractères)..."
                    bouton="Répondre"
                  />
                </div>
              )}
            </>
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
const parsedId = IdInput.safeParse(id)
if (!parsedId.success) notFound()

const annonce = await prisma.annonce.findUnique({
  where: { id: parsedId.data },
  include: { auteur: { select: { name: true } } },
})

const user = await utilisateurCourant()
if (!annonce || !peutVoir(user, annonce)) notFound()
const isOwner = !!(user && peutModifier(user, annonce))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{annonce.titre}</h1>
      <p className="text-gray-500">Publiée par {annonce.auteur.name}</p>
      <p className="mt-4">{annonce.description}</p>
      <p className="mt-2 text-xl font-semibold">
        {annonce.prix.toLocaleString("fr-FR")} €
      </p>
{/* Zone de gestion de l'annonce */}
      {isOwner && (
        <div className="mt-4 flex gap-3">
          <Link href={`/annonces/${annonce.id}/edit`} className="rounded border px-3 py-1">
            Modifier
          </Link>
          <form action={supprimerAnnonce.bind(null, annonce.id)}>
            <button type="submit" className="rounded bg-red-600 text-white px-3 py-1">
              Supprimer
            </button>
          </form>
          <form action={changerPublication.bind(null, annonce.id, annonce.statutPublication !== "PUBLIEE")}>
            <button type="submit" className="rounded border px-3 py-1">
              {annonce.statutPublication === "PUBLIEE" ? "Dépublier" : "Publier"}
            </button>
          </form>
        </div>
      )}
      <h2 className="mt-8 text-xl font-semibold">Questions</h2>
      <Suspense fallback={<p>Chargement des questions…</p>}>
        <Questions annonceId={annonce.id} isOwner={isOwner}  />
      </Suspense>
{/* Formulaire pour poser une question : visible par tous les utilisateurs connectés[cite: 30] */}
      {user && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg mb-2">Poser une nouvelle question</h3>
          <FormTexte
            action={poserQuestion.bind(null, annonce.id)}
            nom="contenu"
            placeholder="Votre question (min 5 caractères)..."
            bouton="Envoyer la question"
            multiligne
          />
        </div>
      )}


    </div>

  )
}
