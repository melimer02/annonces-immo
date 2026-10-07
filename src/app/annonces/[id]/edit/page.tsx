import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { exigerUtilisateur } from "@/lib/session"
import { peutModifier } from "@/lib/authz"
import { IdInput } from "@/lib/shema"
import { modifierAnnonce } from "@/app/annonces/actions"

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
  if (!annonce || !peutModifier(user, annonce)) notFound() // Vérifie si l'annonce existe et si l'utilisateur a le droit de la modifier

  const date = annonce.dateDisponibilite.toISOString().slice(0, 10)

  return (
    <form
      action={modifierAnnonce.bind(null, annonce.id)}
      className="flex flex-col gap-3 p-6 max-w-lg mx-auto"
    >
      <input name="titre" defaultValue={annonce.titre} required className="border rounded p-2" />
      <textarea name="description" defaultValue={annonce.description} required className="border rounded p-2" />
      <input name="prix" type="number" step="any" defaultValue={annonce.prix} required className="border rounded p-2" />
      <input name="dateDisponibilite" type="date" defaultValue={date} required className="border rounded p-2" />
      <select name="typeBien" defaultValue={annonce.typeBien} className="border rounded p-2">
        <option value="VENTE">Vente</option>
        <option value="LOCATION">Location</option>
      </select>
      <select name="statutBien" defaultValue={annonce.statutBien} className="border rounded p-2">
        <option value="DISPONIBLE">Disponible</option>
        <option value="LOUE">Loué</option>
        <option value="VENDU">Vendu</option>
      </select>
      <button type="submit" className="rounded bg-gray-800 text-white py-2">Enregistrer</button>
    </form>
  )
}