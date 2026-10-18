import { prisma } from "@/lib/prisma"

export const PAR_PAGE_ADMIN = 10

const filtreVue = {
  attente: { role: "AGENT", statutPro: "EN_ATTENTE" },
  agents: { role: "AGENT" },
  particuliers: { role: "USER" },
  tous: {},
} as const

export async function listerUtilisateurs(
  { page, vue, q }: { page: number; vue: keyof typeof filtreVue; q?: string }
) {
  const where = {
    ...filtreVue[vue],
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  }
  const [utilisateurs, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAR_PAGE_ADMIN,
      take: PAR_PAGE_ADMIN,
      select: {
        id: true, name: true, email: true, role: true, statutPro: true, createdAt: true,
        _count: { select: { annonces: true } },   // une seule requête groupée, pas de N+1
      },
    }),
    prisma.user.count({ where }),
  ])
  return { utilisateurs, total }
}

export async function statistiquesAdmin() {
  const [utilisateurs, enAttente, agents, annonces] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "AGENT", statutPro: "EN_ATTENTE" } }),
    prisma.user.count({ where: { role: "AGENT", statutPro: "VALIDE" } }),
    prisma.annonce.count(),
  ])
  return { utilisateurs, enAttente, agents, annonces }
}

export const compterEnAttente = () =>
  prisma.user.count({ where: { role: "AGENT", statutPro: "EN_ATTENTE" } })