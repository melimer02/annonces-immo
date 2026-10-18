"use client"

import { useOptimistic } from "react"
import { basculerFavori } from "@/app/favoris/actions"
import { Heart } from "lucide-react"

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
        className={`group flex items-center transition-all duration-200 focus:outline-none ${
          compact 
            // Style compact 
            ? `justify-center rounded-full p-2 ${
                estFavoriOptimiste 
                  ? "bg-red-50 text-red-500" 
                  : "bg-transparent text-gray-400 hover:bg-red-50 hover:text-red-400"
              }`
            // Style large 
            : `gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                estFavoriOptimiste 
                  ? "border-red-100 bg-red-50 text-red-700" 
                  : "border-gray-200 bg-white text-gray-700 hover:border-red-100 hover:bg-red-50/50 hover:text-red-600"
              }`
        }`}
      >
        <Heart 
          className={`h-5 w-5 transition-transform duration-300 ${
            estFavoriOptimiste 
              ? "fill-red-500 text-red-500 scale-110" 
              : "text-current group-hover:scale-105"  
          }`} 
        />
        
        {!compact && (
          <span className="leading-none">{estFavoriOptimiste ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
        )}
      </button>
    </form>
  )
}