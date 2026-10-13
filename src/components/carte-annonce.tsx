import Link from "next/link"

const LIBELLE_TYPE: Record<string, string> = { VENTE: "Vente", LOCATION: "Location" }

type Props = {
  annonce: {
    id: number
    titre: string
    typeBien: string
    prix: number
    statutPublication: string
    photos: { url: string }[]
  }
}

export function CarteAnnonce({ annonce }: Props) {
  const photo = annonce.photos[0]

  return (
    <article className="h-full overflow-hidden rounded-lg border shadow transition hover:bg-gray-50">
      <Link href={`/annonces/${annonce.id}`} className="block h-full">
        {photo ? (
          // alt vide : image décorative, le titre ci-dessous nomme déjà le lien
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-sm text-gray-600">
            Pas de photo
          </div>
        )}
        <div className="p-4">
          <h2 className="text-lg font-semibold">
            {annonce.titre}
            {annonce.statutPublication === "BROUILLON" && (
              <span className="ml-2 text-xs font-normal text-orange-700">(brouillon)</span>
            )}
          </h2>
          <p className="text-sm text-gray-600">{LIBELLE_TYPE[annonce.typeBien] ?? annonce.typeBien}</p>
          <p className="text-gray-800">{annonce.prix.toLocaleString("fr-FR")} €</p>
        </div>
      </Link>
    </article>
  )
}
