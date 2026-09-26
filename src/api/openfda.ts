import { getJson, NotFoundError } from './http'

const BASE = 'https://api.fda.gov/drug'

interface LabelResult {
  set_id: string
  effective_time?: string
  indications_and_usage?: string[]
  purpose?: string[]
  boxed_warning?: string[]
  warnings_and_cautions?: string[]
  warnings?: string[]
  drug_interactions?: string[]
  openfda?: { brand_name?: string[]; generic_name?: string[] }
}
interface LabelResponse {
  meta: { last_updated: string }
  results: LabelResult[]
}
interface RecallResult {
  recall_number: string
  report_date: string
  status: string
  classification: string
  reason_for_recall: string
  product_description: string
  recalling_firm: string
  openfda?: { generic_name?: string[] }
}
interface RecallResponse {
  results: RecallResult[]
}

export interface Label {
  setId: string
  effective?: string
  brandNames: string[]
  indications?: string
  boxedWarning?: string
  boxedHeadline?: string
  warnings?: string
  interactions?: string
  url: string
  lastUpdated: string
}

export interface Recall {
  id: string
  date: string
  classification: string
  reason: string
  product: string
  firm: string
}

/** Remove the leading section heading FDA labels start with ("1 INDICATIONS AND USAGE ...") and collapse whitespace. */
export function cleanSection(text?: string[]): string | undefined {
  if (!text?.length) return undefined
  const joined = text.join(' ').replace(/\s+/g, ' ').trim()
  const stripped = joined.replace(/^(\d+(\.\d+)*\s+)?[A-Z][A-Z &,:/()-]{3,}?(?=\s[A-Z]?[a-z(•])/, '').trim()
  return stripped || joined
}

/** Pull the all-caps title out of a boxed warning, e.g. "WARNING: LACTIC ACIDOSIS" -> "Lactic acidosis". */
export function boxedHeadline(text?: string[]): string | undefined {
  if (!text?.length) return undefined
  const joined = text.join(' ').replace(/\s+/g, ' ').trim()
  const m = joined.match(/^(?:BOXED\s+)?WARNINGS?:?\s*([A-Z0-9][A-Z0-9 ,;:/()'&.-]*?)(?=\s+[A-Z]?[a-z([•])/)
  if (!m) return undefined
  const t = m[1].trim().replace(/[:;,]$/, '').toLowerCase()
  return t ? t[0].toUpperCase() + t.slice(1) : undefined
}

/** True when an openFDA generic_name describes one ingredient, not a combination product. */
export function isSingleIngredient(names?: string[]): boolean {
  const n = (names ?? []).join(' ')
  return !!n && !/\sAND\s|\/|,/i.test(n)
}

const q = (name: string) => encodeURIComponent(`"${name}"`)

/** Most recent label for an ingredient. Prefers labels that include an indications section. */
export async function getLabel(ingredient: string): Promise<Label | null> {
  let data: LabelResponse
  try {
    data = await getJson<LabelResponse>(
      `${BASE}/label.json?search=openfda.generic_name:${q(ingredient)}+AND+_exists_:indications_and_usage&sort=effective_time:desc&limit=10`,
    )
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
  const r = data.results.find((x) => isSingleIngredient(x.openfda?.generic_name)) ?? data.results[0]
  if (!r) return null
  return {
    setId: r.set_id,
    effective: r.effective_time,
    brandNames: r.openfda?.brand_name ?? [],
    indications: cleanSection(r.indications_and_usage ?? r.purpose),
    boxedWarning: cleanSection(r.boxed_warning),
    boxedHeadline: boxedHeadline(r.boxed_warning),
    warnings: cleanSection(r.warnings_and_cautions ?? r.warnings),
    interactions: cleanSection(r.drug_interactions),
    url: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${r.set_id}`,
    lastUpdated: data.meta.last_updated,
  }
}

/** Ongoing recalls (single-ingredient products) reported in the last two years, newest first. An empty array means none were found. */
export async function getRecalls(ingredient: string, now = new Date()): Promise<Recall[]> {
  const from = new Date(now)
  from.setFullYear(from.getFullYear() - 2)
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  try {
    const data = await getJson<RecallResponse>(
      `${BASE}/enforcement.json?search=openfda.generic_name:${q(ingredient)}+AND+status:"Ongoing"+AND+report_date:[${ymd(from)}+TO+${ymd(now)}]&sort=report_date:desc&limit=100`,
    )
    return data.results.filter((r) => r.openfda?.generic_name == null || isSingleIngredient(r.openfda.generic_name)).map((r) => ({
      id: r.recall_number,
      date: r.report_date,
      classification: r.classification,
      reason: r.reason_for_recall,
      product: r.product_description,
      firm: r.recalling_firm,
    }))
  } catch (e) {
    if (e instanceof NotFoundError) return []
    throw e
  }
}

/** openFDA's own data-freshness stamp, shown on the case study page. */
export async function getLabelFreshness(): Promise<string> {
  const data = await getJson<LabelResponse>(`${BASE}/label.json?limit=1`)
  return data.meta.last_updated
}
