import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { utilisateurCourant } from "@/lib/session"
import { CarteAnnonce } from "@/components/carte-annonce"
import { EtatVide } from "@/components/etat-vide"
import Link from "next/link"

export default async function FavorisPage() {
  const user = await utilisateurCourant()
  
  // Si l'utilisateur n'est pas connecté ou n'est pas un USER, on le redirige
  if (!user || user.role !== "USER") redirect("/")

   const favoris = await prisma.favori.findMany({
    where: { userId: user.id },
    include: {
      annonce: {
        include: {
          photos: true 
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mes annonces favorites</h1>

      {favoris.length === 0 ? (
        <EtatVide 
          titre="Vous n'avez aucun favori" 
          action={{ href: "/annonces", libelle: "Explorer les annonces" }} 
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoris.map((favori) => (
            <li key={favori.id}>

              <CarteAnnonce 
                annonce={favori.annonce} 
                estFavori={true} 
                userRole={user.role}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}