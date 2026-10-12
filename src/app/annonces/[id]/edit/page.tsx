import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"
import { peutModifier } from "@/lib/authz"
import { IdInput } from "@/lib/shema"
import { modifierAnnonce } from "@/app/annonces/actions"
import { FormAnnonce } from "@/components/form-annonce"

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params

  const user = await exigerUtilisateur()

  const id = IdInput.safeParse(rawId)
  if (!id.success) notFound()

  const annonce = await prisma.annonce.findUnique({ where: { id: id.data } })
  if (!annonce || !peutModifier(user, annonce)) notFound()

  return (
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
      }}
    />
  )
}
