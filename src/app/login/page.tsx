import { connecter } from "./actions"

export default function LoginPage() {
  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Connexion</h1>
      <form action={connecter} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required className="border rounded p-2" />
        <input name="password" type="password" placeholder="Mot de passe" required className="border rounded p-2" />
        <button type="submit" className="rounded bg-gray-800 text-white py-2">Se connecter</button>
      </form>
    </div>
  )
}
