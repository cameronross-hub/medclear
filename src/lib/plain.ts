import data from '../data/plain-language.json'
import vet from '../data/vet-drugs.json'

export interface PlainDrug {
  g: string
  brands: string[]
  cls: string
  for: string
  watch: string[]
  ask: string[]
  /** Veterinary-only medicine: no FDA human label or human recall data applies. */
  vet?: boolean
}

export const plainMeta = data.meta
export const plainDrugs: PlainDrug[] = [...data.drugs, ...vet.drugs.map((d) => ({ ...d, vet: true }))]

/** "Metformin 500 mg twice daily" -> "metformin". Keeps multi-word names like "insulin glargine". */
export function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/\s\d|\d/)[0]
    .replace(/(^|\s)(tablets?|tabs?|capsules?|caps?|er|xr|xl|sr|oral|pills?)(?=\s|$)/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Find a curated entry by generic or brand name. */
export function findPlain(input: string): PlainDrug | undefined {
  const n = normalizeInput(input)
  if (!n) return undefined
  return (
    plainDrugs.find((d) => d.g === n) ??
    plainDrugs.find((d) => d.brands.some((b) => b.toLowerCase() === n)) ??
    plainDrugs.find((d) => n.startsWith(d.g + ' ') || d.g.startsWith(n + ' '))
  )
}

/** Autocomplete suggestions from the curated list: generic and brand names that start with the query. */
export function suggest(query: string, limit = 6): { label: string; value: string }[] {
  const n = query.toLowerCase().trim()
  if (n.length < 2) return []
  const out: { label: string; value: string }[] = []
  for (const d of plainDrugs) {
    if (d.g.startsWith(n)) out.push({ label: `${d.g} (${d.brands[0]})`, value: d.g })
    else {
      const b = d.brands.find((x) => x.toLowerCase().startsWith(n))
      if (b) out.push({ label: `${b} (${d.g})`, value: d.g })
    }
    if (out.length >= limit) break
  }
  return out
}
