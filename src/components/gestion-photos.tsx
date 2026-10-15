import { supprimerPhoto } from "@/app/annonces/photos-actions"

type Props = {
  photos: { id: number; url: string }[]
  titre: string
}

export function GestionPhotos({ photos, titre }: Props) {
  if (photos.length === 0) {
    return <p className="text-sm text-gray-500">Aucune photo pour cette annonce.</p>
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p, i) => (
        <li key={p.id} className="overflow-hidden rounded-lg border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={`${titre} : photo ${i + 1} sur ${photos.length}`}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="flex items-center justify-between gap-2 p-2">
            <span className="text-xs text-gray-600">
              {i === 0 ? "Photo principale" : `Photo ${i + 1}`}
            </span>
            <form action={supprimerPhoto.bind(null, p.id)}>
              <button
                type="submit"
                aria-label={`Supprimer la photo ${i + 1}`}
                className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Supprimer
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}
