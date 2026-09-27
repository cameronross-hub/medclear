import type { Label, Recall } from '../api/openfda'
import type { EduLink } from '../api/medlineplus'
import type { PlainDrug } from './plain'

/** 'custom' = kept on the list by the user even though no database knows it (e.g. a supplement). */
export type MedStatus = 'loading' | 'ready' | 'notfound' | 'error' | 'custom'

export interface Med {
  id: string
  input: string
  status: MedStatus
  /** Dose times as "HH:MM" (24h), entered by the user from their doctor's, pharmacist's or vet's instructions. */
  times: string[]
  /** "How to take" instructions the user enters from their label, pharmacist or vet (e.g. "With food"). */
  how: string[]
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

export type ProfileKind = 'self' | 'person' | 'pet'

export interface Profile {
  id: string
  name: string
  kind: ProfileKind
  /** For pets, e.g. "dog". */
  species?: string
  meds: Med[]
}

export interface Question {
  text: string
  about?: string
  reason: 'curated' | 'boxed' | 'recall' | 'unknown' | 'list'
}
