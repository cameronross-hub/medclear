import { getJson } from './http'

const BASE = 'https://rxnav.nlm.nih.gov/REST'

interface ApproxResponse {
  approximateGroup?: { candidate?: { rxcui: string; score: string; name?: string; source: string }[] }
}
interface RelatedResponse {
  relatedGroup?: { conceptGroup?: { tty: string; conceptProperties?: { rxcui: string; name: string }[] }[] }
}

export interface Ingredient {
  rxcui: string
  name: string
}

/** Pick the best-scoring candidate's RxCUI (candidates arrive ranked). */
export function bestCandidate(data: ApproxResponse): string | null {
  const c = data.approximateGroup?.candidate ?? []
  return c.length ? c[0].rxcui : null
}

/** Extract single-ingredient concepts (TTY "IN") from a related.json response. */
export function ingredientsFrom(data: RelatedResponse): Ingredient[] {
  const groups = data.relatedGroup?.conceptGroup ?? []
  const list = groups.find((g) => g.tty === 'IN')?.conceptProperties ?? []
  return list.map((p) => ({ rxcui: p.rxcui, name: p.name.toLowerCase() }))
}

/** Resolve free text (including misspellings and brand names) to its ingredient(s). */
export async function resolveIngredient(term: string): Promise<Ingredient | null> {
  const approx = await getJson<ApproxResponse>(
    `${BASE}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=5`,
  )
  const rxcui = bestCandidate(approx)
  if (!rxcui) return null
  const related = await getJson<RelatedResponse>(`${BASE}/rxcui/${rxcui}/related.json?tty=IN`)
  const ings = ingredientsFrom(related)
  return ings[0] ?? null
}
