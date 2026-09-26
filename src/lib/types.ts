import type { Label, Recall } from '../api/openfda'
import type { EduLink } from '../api/medlineplus'
import type { PlainDrug } from './plain'

export type MedStatus = 'loading' | 'ready' | 'notfound' | 'error'

export interface Med {
  id: string
  input: string
  status: MedStatus
  name?: string
  rxcui?: string
  plain?: PlainDrug
  label?: Label | null
  recalls?: Recall[]
  edu?: EduLink[]
  suggestions?: string[]
  /** Which live sources failed, so the card can say so instead of going blank. */
  failed?: string[]
}

export interface Question {
  text: string
  about?: string
  reason: 'curated' | 'boxed' | 'recall' | 'unknown' | 'list'
}
