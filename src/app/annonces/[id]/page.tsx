import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { peutVoir, peutModifier } from "@/lib/authz"
import { IdInput } from "@/lib/schemas"
import {
  CLASSE_STATUT_BIEN,
  LIBELLE_STATUT_BIEN,
  LIBELLE_TYPE,
  formatDate,
  formatPrix,
} from "@/lib/affichage"
import { supprimerAnnonce, changerPublication, poserQuestion, repondreQuestion } from "../actions"
import { FormTexte } from "@/components/ui/form-texte"
import { EtatVide } from "@/components/ui/etat-vide"
import { BoutonFavori } from "@/components/ui/bouton-favori"

// Icônes décoratives
const icone = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const

const IconEdit = () => <svg {...icone}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
const IconTrash = () => <svg {...icone}><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
const IconEye = () => <svg {...icone}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
const IconEyeOff = () => <svg {...icone}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" /></svg>

async function Questions({ annonceId, isOwner }: { annonceId: number; isOwner: boolean }) {
  const questions = await prisma.question.findMany({
    where: { annonceId },
    orderBy: { createdAt: "desc" },
    include: { auteur: { select: { name: true } } },
  })

  if (questions.length === 0) {
    return <EtatVide titre="Aucune question pour l'instant" />
  }

  return (
    <ul className="mt-4 space-y-4">
      {questions.map((q) => (
        <li key={q.id} className="carte p-4">
          <div className="mb-2 flex items-center gap-2">
            <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
              {q.auteur.name.charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-gray-900">{q.auteur.name}</p>
          </div>
          <p className="ml-10 whitespace-pre-wrap break-words text-gray-700">{q.contenu}</p>

          <div className="ml-10 mt-3 border-l-2 border-teal-200 pl-4">
            {q.reponse ? (
              <div>
                <p className="mb-1 text-sm font-semibold text-primary">Réponse de l&apos;agent</p>
                <p className="whitespace-pre-wrap break-words text-gray-700">{q.reponse}</p>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm italic text-gray-600">En attente de réponse…</p>
                {isOwner && (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
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
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
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

  const brouillon = annonce.statutPublication === "BROUILLON"
  const [principale, ...autres] = annonce.photos
  const total = annonce.photos.length

  const estFavori = user && user.role === "USER"
    ? await prisma.favori.findUnique({
        where: { userId_annonceId: { userId: user.id, annonceId: annonce.id } }
      }).then(f => !!f)
    : false

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/annonces"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover hover:underline"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux annonces
      </Link>

      {brouillon && (
        <p role="note" className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          Cette annonce est un <strong>brouillon</strong> : seuls son auteur et les administrateurs peuvent la voir.
        </p>
      )}

      {/* EN-TÊTE : titre, badges, actions et bouton favori */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-soft text-primary">
              {LIBELLE_TYPE[annonce.typeBien] ?? annonce.typeBien}
            </span>
            <span className={`badge ${CLASSE_STATUT_BIEN[annonce.statutBien] ?? "bg-gray-100 text-gray-700"}`}>
              {LIBELLE_STATUT_BIEN[annonce.statutBien] ?? annonce.statutBien}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-gray-900">{annonce.titre}</h1>
            {user?.role === "USER" && (
              <BoutonFavori annonceId={annonce.id} estFavoriInitial={estFavori} />
            )}
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-gray-600">
            {annonce.ville && (
              <>
                <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {annonce.ville}
                </span>
                <span aria-hidden="true">•</span>
              </>
            )}
            <span>
              Publiée par <span className="font-semibold text-gray-800">{annonce.auteur.name}</span>
            </span>
          </p>
        </div>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Gérer l'annonce">
            <Link href={`/annonces/${annonce.id}/edit`} className="btn btn-secondary">
              <IconEdit /> Modifier
            </Link>

            <form action={changerPublication.bind(null, annonce.id, brouillon)}>
              <button type="submit" className="btn btn-secondary">
                {brouillon ? <><IconEye /> Publier</> : <><IconEyeOff /> Dépublier</>}
              </button>
            </form>

            <details className="relative">
              <summary className="btn btn-danger cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <IconTrash /> Supprimer
              </summary>
              <div className="absolute left-0 z-10 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:left-auto md:right-0">
                <p className="text-sm text-gray-700">Supprimer définitivement cette annonce, ses photos et ses questions ?</p>
                <form action={supprimerAnnonce.bind(null, annonce.id)} className="mt-3">
                  <button type="submit" className="btn w-full bg-red-700 text-white hover:bg-red-800">
                    Oui, supprimer
                  </button>
                </form>
              </div>
            </details>
          </div>
        )}
      </header>

      {/* PHOTOS */}
       {/* PHOTOS */}
      <section aria-labelledby="titre-photos" className="mb-10">
        <h2 id="titre-photos" className="sr-only">Photos</h2>
        {!principale ? (
          <>
            <EtatVide titre="Aucune photo pour cette annonce" />
            {isOwner && (
              <p className="mt-3 text-sm">
                <Link
                  href={`/annonces/${annonce.id}/edit`}
                  className="font-medium text-primary underline"
                >
                  Ajouter des photos
                </Link>
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {/* 1. Image principale */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={principale.url} 
              alt={`${annonce.titre} : photo 1 sur ${total}`} 
              className="h-[350px] w-full rounded-2xl object-cover md:h-[500px]" 
            />
            
            {/* 2. Grille de miniatures  */}
            {autres.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {autres.map((p, i) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={p.url} 
                      alt={`${annonce.titre} : photo ${i + 2} sur ${total}`} 
                      loading="lazy" 
                      className="h-24 w-full rounded-xl object-cover sm:h-32" 
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
       
        <aside aria-label="Résumé de l'annonce" className="md:col-start-3 md:row-start-1">
          <div className="carte sticky top-6 p-6 shadow-lg">
            <p className="text-3xl font-extrabold text-gray-900">
              {formatPrix(annonce.prix, annonce.typeBien)}
            </p>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600">Type</dt>
                <dd className="font-medium text-gray-900">{LIBELLE_TYPE[annonce.typeBien] ?? annonce.typeBien}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600">Statut</dt>
                <dd>
                  <span className={`badge ${CLASSE_STATUT_BIEN[annonce.statutBien] ?? "bg-gray-100 text-gray-700"}`}>
                    {LIBELLE_STATUT_BIEN[annonce.statutBien] ?? annonce.statutBien}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600">Disponibilité</dt>
                <dd className="font-medium text-gray-900">{formatDate(annonce.dateDisponibilite)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600">Agent</dt>
                <dd className="font-medium text-gray-900">{annonce.auteur.name}</dd>
              </div>
            </dl>

            
          </div>
        </aside>

        <div className="space-y-10 md:col-span-2 md:col-start-1 md:row-start-1">
          <section aria-labelledby="titre-description">
            <h2 id="titre-description" className="mb-3 text-2xl font-bold text-gray-900">
              Description
            </h2>
            <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-700">
              {annonce.description}
            </p>
          </section>

          <hr className="border-gray-200" />

          <section id="questions" aria-labelledby="titre-questions" className="scroll-mt-6">
            <h2 id="titre-questions" className="mb-2 text-2xl font-bold text-gray-900">
              Questions
            </h2>

            {user ? (
              <div className="carte mb-6 mt-4 p-5">
                <h3 className="mb-3 font-semibold text-gray-900">Une question sur ce bien ?</h3>
                <FormTexte
                  action={poserQuestion.bind(null, annonce.id)}
                  nom="contenu"
                  placeholder="Posez votre question à l'agent (min 5 caractères)..."
                  bouton="Envoyer"
                  multiligne
                  label="Votre question"
                />
              </div>
            ) : (
              <p className="mb-6 mt-2 text-gray-700">
                <Link href="/login" className="font-semibold text-primary underline">
                  Connectez-vous
                </Link>{" "}
                pour poser une question à l&apos;agent.
              </p>
            )}

            <Suspense fallback={<p className="mt-4 animate-pulse text-gray-600">Chargement des questions…</p>}>
              <Questions annonceId={annonce.id} isOwner={isOwner} />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}