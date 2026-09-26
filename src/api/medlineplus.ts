import { getJson } from './http'

interface FeedResponse {
  feed?: { entry?: { title?: { _value?: string }; link?: { href: string }[] }[] }
}

export interface EduLink {
  title: string
  href: string
}

export function linksFrom(data: FeedResponse): EduLink[] {
  return (data.feed?.entry ?? [])
    .map((e) => ({ title: e.title?._value ?? 'MedlinePlus', href: e.link?.[0]?.href ?? '' }))
    .filter((l) => l.href.startsWith('https://'))
}

/** Patient-education pages from NIH MedlinePlus for an RxNorm concept. */
export async function getEducation(rxcui: string): Promise<EduLink[]> {
  const url =
    'https://connect.medlineplus.gov/service?mainSearchCriteria.v.cs=2.16.840.1.113883.6.88' +
    `&mainSearchCriteria.v.c=${encodeURIComponent(rxcui)}&knowledgeResponseType=application/json`
  return linksFrom(await getJson<FeedResponse>(url))
}
