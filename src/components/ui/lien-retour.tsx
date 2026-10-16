import Link from "next/link"
import type { ReactNode } from "react"

export function LienRetour({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover hover:underline"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  )
}
