import type { Med, Profile, ProfileKind } from './types'

/** What persists: names, inputs and times only. Lookups are re-fetched (and served from the offline cache). */
export interface SavedMed {
  input: string
  times: string[]
  how?: string[]
  custom?: boolean
}
export interface SavedProfile {
  id: string
  name: string
  kind: ProfileKind
  species?: string
  meds: SavedMed[]
}
export interface SavedState {
  v: 2
  activeId: string
  profiles: SavedProfile[]
}

export const STATE_KEY = 'medclear-state-v2'
export const LEGACY_KEY = 'medclear-list'

/** A household shown on first visit so the app opens in a realistic working state. */
export const EXAMPLE_STATE: SavedState = {
  v: 2,
  activeId: 'me',
  profiles: [
    {
      id: 'me',
      name: 'Me',
      kind: 'self',
      meds: [
        { input: 'metformin 500 mg', times: ['08:00', '18:00'], how: ['With food'] },
        { input: 'lisinopril', times: ['08:00'] },
        { input: 'amlodipine', times: ['08:00'] },
        { input: 'omeprazole', times: ['07:30'], how: ['Before a meal'] },
        { input: 'Lipitor', times: ['21:00'] },
      ],
    },
    {
      id: 'mom',
      name: 'Mom',
      kind: 'person',
      meds: [
        { input: 'levothyroxine', times: ['06:30'], how: ['Empty stomach', 'With a full glass of water'] },
        { input: 'warfarin', times: ['18:00'] },
        { input: 'donepezil', times: ['21:00'] },
      ],
    },
    {
      id: 'buddy',
      name: 'Buddy',
      kind: 'pet',
      species: 'dog',
      meds: [
        { input: 'Rimadyl', times: ['08:00', '20:00'] },
        { input: 'gabapentin', times: ['08:00', '20:00'] },
        { input: 'Apoquel', times: ['08:00'] },
      ],
    },
  ],
}

type Storage = Pick<globalThis.Storage, 'getItem'>

/** Load saved state; migrate the v1 single list into a "My list" profile; null means first visit. */
export function loadState(storage: Storage): SavedState | null {
  try {
    const v2 = storage.getItem(STATE_KEY)
    if (v2) {
      const s = JSON.parse(v2) as SavedState
      if (s.v === 2 && Array.isArray(s.profiles)) return s
    }
    const v1 = storage.getItem(LEGACY_KEY)
    if (v1) {
      const list = JSON.parse(v1) as string[]
      return { v: 2, activeId: 'mine', profiles: [{ id: 'mine', name: 'My list', kind: 'self', meds: list.map((input) => ({ input, times: [], how: [] })) }] }
    }
  } catch {
    /* corrupted or unavailable storage: fall through to first-visit behavior */
  }
  return null
}

export function toSaved(profiles: Profile[], activeId: string): SavedState {
  return {
    v: 2,
    activeId,
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      species: p.species,
      meds: p.meds.map((m) => ({ input: m.input, times: m.times, ...(m.how.length ? { how: m.how } : {}), ...(m.status === 'custom' ? { custom: true } : {}) })),
    })),
  }
}

/** "Dad" -> "Dad's", "Me" -> "My", "Chris" -> "Chris'". */
export function possessive(p: Pick<Profile, 'name' | 'kind'>): string {
  if (p.kind === 'self') return 'My'
  return /s$/i.test(p.name) ? `${p.name}'` : `${p.name}'s`
}

export const audience = (p: Pick<Profile, 'kind'>) => (p.kind === 'pet' ? 'veterinarian' : 'advocate or doctor')

export function slug(name: string, taken: string[]): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'
  let id = base
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`
  return id
}

export type { Med }
