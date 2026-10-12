import type { ReactNode } from "react"

export function Champ({
  label,
  erreurs,
  children,
}: {
  label: string
  erreurs?: string[]
  children: ReactNode
}) {
  const message = erreurs?.[0]
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {message && (
        <span role="alert" className="text-sm text-red-600">
          {message}
        </span>
      )}
    </label>
  )
}
