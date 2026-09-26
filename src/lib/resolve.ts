import { getJson } from '../api/http'
import { getEducation } from '../api/medlineplus'
import { getLabel, getRecalls } from '../api/openfda'
import { resolveIngredient } from '../api/rxnav'
import { findPlain, normalizeInput } from './plain'
import type { Med } from './types'

interface SpellingResponse {
  suggestionGroup?: { suggestionList?: { suggestion?: string[] } | null }
}

async function spellingSuggestions(term: string): Promise<string[]> {
  try {
    const d = await getJson<SpellingResponse>(
      `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(term)}`,
    )
    return (d.suggestionGroup?.suggestionList?.suggestion ?? []).slice(0, 4)
  } catch {
    return []
  }
}

/** Resolve one typed medicine into a card: curated summary + live FDA label, recalls and MedlinePlus links. */
export async function resolveMed(base: Med): Promise<Med> {
  const query = normalizeInput(base.input) || base.input.trim()
  const plain = findPlain(base.input)
  let ing = null
  try {
    ing = await resolveIngredient(plain?.g ?? query)
  } catch {
    if (!plain) return { ...base, status: 'error', failed: ['RxNorm'] }
  }
  const name = plain?.g ?? ing?.name
  if (!name) return { ...base, status: 'notfound', suggestions: await spellingSuggestions(query) }

  const failed: string[] = []
  const [label, recalls, edu] = await Promise.all([
    getLabel(name).catch(() => (failed.push('FDA label'), undefined)),
    getRecalls(name).catch(() => (failed.push('FDA recalls'), undefined)),
    ing ? getEducation(ing.rxcui).catch(() => (failed.push('MedlinePlus'), undefined)) : Promise.resolve(undefined),
  ])
  return { ...base, status: 'ready', name, rxcui: ing?.rxcui, plain, label, recalls, edu, failed }
}
