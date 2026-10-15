import Link from "next/link"
import { BoutonFavori } from "@/components/Boutton/bouton-favori"

type Props = {
  annonce: {
    id: number
    titre: string
    typeBien: string
    prix: number
    statutPublication: string
    photos: { url: string }[]
  }
  estFavori?: boolean
  userRole?: string
}

export function CarteAnnonce({ annonce, estFavori = false, userRole }: Props) {
  // Récupère la première photo ou une image par défaut
  const imageCover = annonce.photos?.[0]?.url || "/placeholder.jpg"

  return (
    <div className="border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* ZONE IMAGE (Relative pour pouvoir superposer le cœur) */}
      <div className="relative aspect-video w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageCover}
          alt={annonce.titre}
          className="object-cover w-full h-full"
        />
        
        {/* LE CŒUR SUPERPOSÉ EN HAUT À DROITE */}
        {userRole === "USER" && (
          <div className="absolute top-2 right-2 z-10">
            <BoutonFavori 
              annonceId={annonce.id} 
              estFavoriInitial={estFavori ?? false} 
              compact={true} // Active le mode "icône uniquement"
            />
          </div>
        )}
      </div>

      {/* ZONE TEXTE */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg">{annonce.titre}</h3>
        <p className="text-gray-500 text-sm mt-1">{annonce.typeBien}</p>
        <p className="font-semibold text-xl mt-2">{annonce.prix.toLocaleString("fr-FR")} €</p>
        
        <div className="mt-auto pt-4 flex justify-between items-end">
          <Link href={`/annonces/${annonce.id}`} className="text-blue-600 underline text-sm">
            Voir les détails
          </Link>
        </div>
      </div>
      
    </div>
  )
}