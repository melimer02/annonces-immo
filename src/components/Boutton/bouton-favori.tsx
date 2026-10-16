"use client"

import { useOptimistic } from "react"
import { basculerFavori } from "@/app/favoris/actions"
import { Heart } from "lucide-react" // Import de l'icône Lucide

type Props = {
  annonceId: number
  estFavoriInitial: boolean
  compact?: boolean 
}

export function BoutonFavori({ annonceId, estFavoriInitial, compact = false }: Props) {
  const [estFavoriOptimiste, majOptimiste] = useOptimistic(
    estFavoriInitial,
    (etatActuel) => !etatActuel
  )

  return (
    <form action={async () => {
      majOptimiste(undefined) 
      await basculerFavori(annonceId)
    }}>
      <button 
        type="submit" 
        title={estFavoriOptimiste ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={
          compact 
          
            ? "flex items-center justify-center p-2 "

            : `flex items-center gap-2 px-4 py-2 rounded-lg border  ${
                estFavoriOptimiste 
                  ? "bg-red-50 text-gray-500 border-pink-200" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 "
              }`
        }
      >

        <Heart 
          className={`w-5 h-5 transition-all duration-300 ${
            estFavoriOptimiste 
              ? "fill-pink-300 text-pink-300 animate-pop" 
              : "text-current" 
          }`} 
        />
        

        {!compact && (
          <span>{estFavoriOptimiste ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
        )}
      </button>
    </form>
  )
}