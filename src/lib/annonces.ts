import { prisma } from "@/lib/prisma"
import type { Acteur } from "@/lib/authz"

export const PAR_PAGE = 6


export function filtreVisibilite(user: Acteur | null) {
  if (user?.role === "ADMIN") {
    return [{ statutPublication: "PUBLIEE" as const }, { statutPublication: "BROUILLON" as const }]
  }
  if (user) {
    return [
      { statutPublication: "PUBLIEE" as const },
      { statutPublication: "BROUILLON" as const, auteurId: user.id },
    ]
  }
  return [{ statutPublication: "PUBLIEE" as const }]
}

export type FiltresAnnonces = {
  page: number
  type?: "VENTE" | "LOCATION"
  ville?: string
  prixMin?: number
  prixMax?: number
}

export async function listerAnnonces(
  user: Acteur | null,
  { page, type, ville, prixMin, prixMax }: FiltresAnnonces
) {
  const where = {
    OR: filtreVisibilite(user),
    ...(type ? { typeBien: type } : {}),
    ...(ville ? { ville: { contains: ville, mode: "insensitive" as const } } : {}),
    ...(prixMin !== undefined || prixMax !== undefined
      ? { prix: { gte: prixMin, lte: prixMax } }
      : {}),
  
  }

  const [annonces, total] = await Promise.all([
    prisma.annonce.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      include: { photos: { orderBy: { createdAt: "asc" }, take: 1, select: { url: true } } },
    }),
    prisma.annonce.count({ where }),
  ])

  return { annonces, total }
}
