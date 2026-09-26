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
  const med = (over: Partial<Med>): Med => ({ id: Math.random().toString(), input: 'x', status: 'ready', ...over })
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
