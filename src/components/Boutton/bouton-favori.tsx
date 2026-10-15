"use client"

import { useOptimistic } from "react"
import { basculerFavori } from "@/app/annonces/actions"

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
            // Design pour la petite carte 
            ? `p-2 rounded-full bg-white/90 shadow hover:scale-110 transition-transform ${estFavoriOptimiste ? "text-red-500" : "text-gray-400"}`
            // Design classique pour la page détaillée 
            : `px-4 py-2 rounded border font-medium transition-colors ${
                estFavoriOptimiste 
                  ? "bg-red-50 text-red-600 border-red-200" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`
        }
      >
        {compact ? (
           <span className="text-xl leading-none block">{estFavoriOptimiste ? "❤️" : "🤍"}</span>
        ) : (
           <>{estFavoriOptimiste ? "❤️ Retiré des favoris" : "🤍 Ajouter aux favoris"}</>
        )}
      </button>
    </form>
  )
}