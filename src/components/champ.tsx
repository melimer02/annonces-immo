import { cloneElement, useId, type ReactElement } from "react"

export function Champ({
  label,
  erreurs,
  children,
}: {
  label: string
  erreurs?: string[]
  children: ReactElement<Record<string, unknown>>
}) {
  const id = useId()
  const idErreur = `${id}-erreur`
  const message = erreurs?.[0]

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {/* On injecte id + aria-* dans le champ passé en enfant */}
      {cloneElement(children, {
        id,
        "aria-invalid": message ? true : undefined,
        "aria-describedby": message ? idErreur : undefined,
      })}
      {message && (
        <p id={idErreur} role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
