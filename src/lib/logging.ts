
// Transforme un SQL brut en «action table
export function resumer(sql: string) {
  const table = /(?:FROM|INTO|UPDATE)\s+"public"\."(\w+)"/i.exec(sql)?.[1] ?? "?"
  const action = sql.startsWith("SELECT COUNT") ? "COUNT"
    : /^(SELECT|INSERT|UPDATE|DELETE)/.exec(sql)?.[1] ?? "AUTRE"
  return { action, table }
}

const COULEURS: Record<string, string> = {
  SELECT: "\x1b[36m", COUNT: "\x1b[35m", INSERT: "\x1b[32m",
  UPDATE: "\x1b[33m", DELETE: "\x1b[31m",
}

// Regroupe les requêtes rafales : un « paquet » se termine après 150 ms de silence
let paquet: { action: string; table: string; ms: number }[] = []
let minuteur: NodeJS.Timeout | undefined

export function journaliser(sql: string, ms: number) {
  paquet.push({ ...resumer(sql), ms })
  clearTimeout(minuteur)
  minuteur = setTimeout(afficher, 150)
}

function afficher() {
  const total = paquet.reduce((s, r) => s + r.ms, 0)
  for (const r of paquet) {
    const c = COULEURS[r.action] ?? ""
    console.log(`  ${c}${r.action.padEnd(6)}\x1b[0m ${r.table.padEnd(10)} ${r.ms.toFixed(1)} ms${r.ms > 50 ? "  ⚠ lent" : ""}`)
  }
  console.log(`  → ${paquet.length} requête(s), ${total.toFixed(1)} ms au total\n`)
  paquet = []
}