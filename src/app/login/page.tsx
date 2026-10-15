import Link from "next/link"
import { FormLogin } from "@/components/form-login"

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="carte p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Connexion</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Accédez à votre compte ImmoWeb.</p>
        <FormLogin />
      </div>
      <p className="mt-4 text-center text-sm text-gray-700">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-primary underline">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  )
}
