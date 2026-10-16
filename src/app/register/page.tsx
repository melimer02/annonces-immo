import Link from "next/link"
import { FormRegister } from "@/components/form-register"
import { BoutonsSociaux } from "@/components/Boutton/boutons-sociaux"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>
}) {
  const { suite } = await searchParams

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="carte p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Créer un compte</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">
          Posez vos questions aux agents en quelques secondes.
        </p>
        <FormRegister  suite={suite} />
         <BoutonsSociaux />
      </div>
      <p className="mt-4 text-center text-sm text-gray-700">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-primary underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  )
}
