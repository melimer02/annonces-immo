import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"
import { peutModifier } from "@/lib/authz"
import { IdInput } from "@/lib/schemas"
import { modifierAnnonce } from "@/app/annonces/actions"
import { ajouterPhotos } from "@/app/annonces/photos-actions"
import { FormAnnonce } from "@/components/form-annonce"
import { FormPhotos } from "@/components/form-photos"
import { GestionPhotos } from "@/components/gestion-photos"
import { LienRetour } from "@/components/lien-retour"

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params

  const user = await exigerUtilisateur()

  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  const annonce = await prisma.annonce.findUnique({
    where: { id: id.data },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  })
  if (!annonce || !peutModifier(user, annonce)) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <LienRetour href={`/annonces/${annonce.id}`}>Retour à l&apos;annonce</LienRetour>
      <h1 className="mb-6 text-3xl font-extrabold text-gray-900">Modifier l&apos;annonce</h1>

      {/* Grand écran : formulaire à gauche, photos à droite. Mobile : les photos passent dessous. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <FormAnnonce
          action={modifierAnnonce.bind(null, annonce.id)}
          bouton="Enregistrer"
          avecStatutBien
          valeursInitiales={{
            titre: annonce.titre,
            description: annonce.description,
            prix: String(annonce.prix),
            dateDisponibilite: annonce.dateDisponibilite.toISOString().slice(0, 10),
            typeBien: annonce.typeBien,
            statutBien: annonce.statutBien,
            ville: annonce.ville ?? "",
          }}
        />

        <section aria-labelledby="titre-photos" className="carte space-y-4 p-6">
          <h2 id="titre-photos" className="text-xl font-bold text-gray-900">
            Photos ({annonce.photos.length})
          </h2>
          <GestionPhotos photos={annonce.photos} titre={annonce.titre} />
          <div className="border-t border-gray-200 pt-4">
            <FormPhotos action={ajouterPhotos.bind(null, annonce.id)} />
          </div>
        </section>
      </div>
    </div>
  )
}
