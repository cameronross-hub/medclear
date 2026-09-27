import { describe, expect, it } from 'vitest'
import { boxedHeadline, cleanSection, isSingleIngredient } from '../api/openfda'
import { bestCandidate, ingredientsFrom } from '../api/rxnav'
import { linksFrom } from '../api/medlineplus'
import { findPlain, normalizeInput, suggest } from './plain'
import { buildQuestions } from './questions'
import type { Med } from './types'

describe('label text', () => {
  it('strips the numbered section heading', () => {
    expect(cleanSection(['1 INDICATIONS AND USAGE Metformin hydrochloride tablets are indicated as an adjunct'])).toBe(
      'Metformin hydrochloride tablets are indicated as an adjunct',
    )
    expect(cleanSection(['1 INDICATIONS AND USAGE Hypothyroidism Levothyroxine sodium tablets'])).toBe(
      'Hypothyroidism Levothyroxine sodium tablets',
    )
  })
  it('returns undefined for empty sections', () => {
    expect(cleanSection(undefined)).toBeUndefined()
  })
  it('extracts boxed warning headlines', () => {
    expect(boxedHeadline(['WARNING: LACTIC ACIDOSIS Postmarketing cases of metformin-associated'])).toBe('Lactic acidosis')
    expect(boxedHeadline(['WARNING: BLEEDING RISK Warfarin sodium can cause major bleeding'])).toBe('Bleeding risk')
    expect(boxedHeadline(['WARNING: NOT FOR TREATMENT OF OBESITY OR FOR WEIGHT LOSS Thyroid hormones, including'])).toBe(
      'Not for treatment of obesity or for weight loss',
    )
    expect(boxedHeadline(['Some text with no heading'])).toBeUndefined()
  })
  it('detects combination products', () => {
    expect(isSingleIngredient(['AMLODIPINE BESYLATE'])).toBe(true)
    expect(isSingleIngredient(['AMLODIPINE BESYLATE AND BENAZEPRIL HYDROCHLORIDE'])).toBe(false)
    expect(isSingleIngredient(['OLMESARTAN / AMLODIPINE'])).toBe(false)
    expect(isSingleIngredient([])).toBe(false)
  })
})

describe('rxnav + medlineplus parsers', () => {
  it('takes the top candidate', () => {
    expect(bestCandidate({ approximateGroup: { candidate: [{ rxcui: '6809', score: '8', source: 'RXNORM' }] } })).toBe('6809')
    expect(bestCandidate({})).toBeNull()
  })
  it('keeps only single ingredients', () => {
    const r = ingredientsFrom({
      relatedGroup: {
        conceptGroup: [
          { tty: 'IN', conceptProperties: [{ rxcui: '6809', name: 'Metformin' }] },
          { tty: 'MIN', conceptProperties: [{ rxcui: '1', name: 'glipizide / metformin' }] },
        ],
      },
    })
    expect(r).toEqual([{ rxcui: '6809', name: 'metformin' }])
  })
  it('keeps only https education links', () => {
    expect(
      linksFrom({ feed: { entry: [{ title: { _value: 'Metformin' }, link: [{ href: 'https://medlineplus.gov/druginfo/meds/a696005.html' }] }, { link: [{ href: 'javascript:x' }] }] } }),
    ).toEqual([{ title: 'Metformin', href: 'https://medlineplus.gov/druginfo/meds/a696005.html' }])
  })
})

describe('plain-language lookup', () => {
  it('normalizes doses and forms', () => {
    expect(normalizeInput('Metformin 500 mg twice daily')).toBe('metformin')
    expect(normalizeInput('Toprol-XL 25mg')).toBe('toprol-xl')
    expect(normalizeInput('insulin glargine (Lantus) 20 units')).toBe('insulin glargine')
  })
  it('finds by generic and brand', () => {
    expect(findPlain('ELIQUIS 5 mg')?.g).toBe('apixaban')
    expect(findPlain('lisinopril')?.g).toBe('lisinopril')
    expect(findPlain('Toprol-XL')?.g).toBe('metoprolol')
    expect(findPlain('notadrug')).toBeUndefined()
  })
  it('suggests from generics and brands', () => {
    expect(suggest('lip').map((s) => s.value)).toContain('atorvastatin')
    expect(suggest('a').length).toBe(0)
  })
})

describe('question sheet', () => {
  const med = (over: Partial<Med>): Med => ({ id: Math.random().toString(), input: 'x', status: 'ready', times: [], ...over })
  it('adds boxed-warning, recall, curated and list questions', () => {
    const qs = buildQuestions([
      med({ name: 'warfarin', plain: findPlain('warfarin'), label: { boxedHeadline: 'Bleeding risk' } as never, recalls: [] }),
      med({ name: 'metformin', recalls: [{ id: 'D-1' } as never] }),
    ])
    expect(qs.some((q) => q.reason === 'boxed' && q.text.includes('bleeding risk'))).toBe(true)
    expect(qs.some((q) => q.reason === 'recall' && q.about === 'Metformin')).toBe(true)
    expect(qs.some((q) => q.reason === 'unknown' && q.text.includes('metformin'))).toBe(true)
    expect(qs.filter((q) => q.reason === 'list').length).toBe(2)
  })
  it('ignores cards that are still loading or not found', () => {
    expect(buildQuestions([med({ status: 'loading', name: 'x' }), med({ status: 'notfound' })])).toEqual([])
  })
  it('never tells anyone to change a dose', () => {
    const qs = buildQuestions([med({ name: 'warfarin', plain: findPlain('warfarin') })])
    expect(qs.every((q) => !/\b(stop taking|double|skip your dose)\b/i.test(q.text))).toBe(true)
  })
})

describe('build-log attribution', async () => {
  const { agentOf } = await import('./agents')
  it('credits only explicit markers', () => {
    expect(agentOf('feat: MVP\n\n- AGENTS.md shared by Claude Code and Codex\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')).toBe('Claude Code')
    expect(agentOf('feat: printable appointment sheet (Codex)')).toBe('Codex')
    expect(agentOf('codex/print-and-text-size feat: printing')).toBe('Codex')
    expect(agentOf('docs: independent code review by Codex')).toBe('Codex')
    expect(agentOf('Merge pull request #2')).toBe('Cameron')
  })
})

describe('pets and custom entries in the question sheet', async () => {
  const { buildQuestions } = await import('./questions')
  const { findPlain } = await import('./plain')
  const m = (over: Partial<Med>): Med => ({ id: Math.random().toString(), input: 'x', status: 'ready', times: [], ...over })
  it('addresses the vet and skips human-only curated questions for pets', () => {
    const qs = buildQuestions([m({ name: 'gabapentin', plain: findPlain('gabapentin') }), m({ name: 'carprofen', plain: findPlain('Rimadyl') })], { kind: 'pet', name: 'Buddy' })
    expect(findPlain('Rimadyl')?.vet).toBe(true)
    expect(qs.some((q) => q.text.includes('safe for Buddy'))).toBe(true)
    expect(qs.some((q) => q.text.includes('bloodwork'))).toBe(true)
    expect(qs.some((q) => q.text.includes('Medicare'))).toBe(false)
  })
  it('includes custom entries', () => {
    const qs = buildQuestions([m({ status: 'custom', input: 'fish oil' })])
    expect(qs.some((q) => q.text.includes('fish oil'))).toBe(true)
  })
})

describe('schedule', async () => {
  const s = await import('./schedule')
  it('formats and buckets times', () => {
    expect(s.formatTime('08:00')).toBe('8:00 AM')
    expect(s.formatTime('18:30')).toBe('6:30 PM')
    expect(s.formatTime('00:15')).toBe('12:15 AM')
    expect(s.slotOf('06:30')).toBe('Morning')
    expect(s.slotOf('12:00')).toBe('Midday')
    expect(s.slotOf('18:00')).toBe('Evening')
    expect(s.slotOf('21:00')).toBe('Night')
  })
  it('adds times sorted, without duplicates or junk', () => {
    expect(s.addTime(['18:00'], '08:00')).toEqual(['08:00', '18:00'])
    expect(s.addTime(['08:00'], '08:00')).toEqual(['08:00'])
    expect(s.addTime(['08:00'], '')).toEqual(['08:00'])
  })
  it('orders doses across profiles and finds the next one', () => {
    const med = (input: string, times: string[]): Med => ({ id: input, input, status: 'ready', times })
    const profiles = [
      { id: 'dad', name: 'Dad', kind: 'person' as const, meds: [med('metformin', ['08:00', '18:00'])] },
      { id: 'buddy', name: 'Buddy', kind: 'pet' as const, meds: [med('Rimadyl', ['08:00'])] },
    ]
    const doses = s.dosesFor(profiles)
    expect(doses.map((d) => `${d.profile.name} ${d.time}`)).toEqual(['Buddy 08:00', 'Dad 08:00', 'Dad 18:00'])
    const at = (h: number) => new Date(2026, 8, 27, h, 0)
    expect(s.nextDose(doses, new Set(), at(12))?.time).toBe('18:00')
    expect(s.nextDose(doses, new Set([doses[2].key]), at(12))?.key).toBe(doses[0].key)
    expect(s.nextDose(doses, new Set(doses.map((d) => d.key)), at(12))).toBeUndefined()
  })
})

describe('profiles storage', async () => {
  const p = await import('./profiles')
  const store = (data: Record<string, string>) => ({ getItem: (k: string) => data[k] ?? null })
  it('returns null on first visit', () => {
    expect(p.loadState(store({}))).toBeNull()
  })
  it('migrates the v1 single list', () => {
    const s = p.loadState(store({ [p.LEGACY_KEY]: JSON.stringify(['metformin', 'Lipitor']) }))
    expect(s?.profiles).toHaveLength(1)
    expect(s?.profiles[0].meds.map((m) => m.input)).toEqual(['metformin', 'Lipitor'])
  })
  it('survives corrupted storage', () => {
    expect(p.loadState(store({ [p.STATE_KEY]: '{not json' }))).toBeNull()
  })
  it('writes possessives and unique ids', () => {
    expect(p.possessive({ name: 'Dad', kind: 'person' })).toBe("Dad's")
    expect(p.possessive({ name: 'Chris', kind: 'person' })).toBe("Chris'")
    expect(p.possessive({ name: 'Me', kind: 'self' })).toBe('My')
    expect(p.slug('Mom', ['mom'])).toBe('mom-2')
  })
  it('example household has Dad, a dog and Me with schedules', () => {
    expect(p.EXAMPLE_STATE.profiles.map((x) => x.kind)).toEqual(['person', 'pet', 'self'])
    expect(p.EXAMPLE_STATE.profiles.every((x) => x.meds.every((m) => m.times.length > 0))).toBe(true)
  })
})
