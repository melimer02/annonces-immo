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

import { ajouterPhotos } from "../photos-actions"
import { FormPhotos } from "@/components/form-photos"
import { EtatVide } from "@/components/etat-vide"
import { BoutonFavori } from "@/components/Boutton/bouton-favori"

async function Questions({ annonceId ,isOwner}: { annonceId: number , isOwner: boolean }) {
  const questions = await prisma.question.findMany({
    where: { annonceId },
    orderBy: { createdAt: "desc" },
    include: { auteur: { select: { name: true } } },
  })

  if (questions.length === 0) {
    return <EtatVide titre="Aucune question pour l'instant" />
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
              <p className="mt-1 italic text-gray-600">En attente de réponse</p>
              
               {isOwner && (
                <div className="mt-2">
                  <FormTexte
                    action={repondreQuestion.bind(null, q.id)}
                    nom="reponse"
                    placeholder="Votre réponse (min 5 caractères)..."
                    bouton="Répondre"
                    label={`Réponse à la question de ${q.auteur.name}`}
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
  include: {
  auteur: { select: { name: true } },
  photos: { orderBy: { createdAt: "asc" } },
},
})

const user = await utilisateurCourant()
if (!annonce || !peutVoir(user, annonce)) notFound()
const isOwner = !!(user && peutModifier(user, annonce))



const estFavori = user && user.role === "USER"
    ? await prisma.favori.findUnique({
        where: { userId_annonceId: { userId: user.id, annonceId: annonce.id } }
      }).then(f => !!f)
    : false


  return (
    <div className="p-6">
      <Link href="/annonces" className="text-sm underline">
        ← Retour aux annonces
      </Link>
      <h1 className="text-2xl font-bold">{annonce.titre}</h1>

      <div className="flex justify-between items-start mt-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{annonce.titre}</h1>
          {(annonce.ville ) && (
            <p className="text-gray-600 mt-1 flex items-center gap-1">
              📍 {annonce.ville} 
            </p>
          )}
          <p className="text-gray-500">Publiée par {annonce.auteur.name}</p>
        </div>
        {/* Le bouton s'affiche uniquement pour les utilisateurs normaux[cite: 2] */}
        {user?.role === "USER" && (
          <BoutonFavori annonceId={annonce.id} estFavoriInitial={estFavori} />
        )}
      </div>
       <p className="mt-4">{annonce.description}</p>
      <p className="mt-2 text-xl font-semibold">
        {annonce.prix.toLocaleString("fr-FR")} €
      </p>
      <section aria-labelledby="titre-photos" className="mt-6">
        <h2 id="titre-photos" className="text-xl font-semibold">
          Photos
        </h2>
        {annonce.photos.length === 0 ? (
          <EtatVide titre="Aucune photo pour cette annonce" />
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {annonce.photos.map((p, i) => (
              <li key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${annonce.titre} : photo ${i + 1} sur ${annonce.photos.length}`}
                  loading="lazy"
                  className="aspect-video w-full rounded object-cover"
                />
              </li>
            ))}
          </ul>
        )}
        {isOwner && (
          <div className="mt-4">
            <FormPhotos action={ajouterPhotos.bind(null, annonce.id)} />
          </div>
        )}
      </section>
{/* Zone de gestion de l'annonce */}
      {isOwner && (
        <div className="mt-4 flex flex-wrap gap-3">
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
            label="Votre question"
          />
        </div>
      )}


    </div>

  )
}
