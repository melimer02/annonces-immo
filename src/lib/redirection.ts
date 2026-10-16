// src/lib/redirection.ts

export function suiteSure(suite: unknown): string {
  return typeof suite === "string" && suite.startsWith("/") && !suite.startsWith("//")
    ? suite
    : "/annonces"
}