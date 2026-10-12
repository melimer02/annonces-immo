import { FormLogin } from "@/components/form-login"

export default function LoginPage() {
  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Connexion</h1>
      <FormLogin />
    </div>
  )
}
