import type { Med, Question } from './types'

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Build the "Questions for your advocate or doctor" sheet from the resolved list. Never gives instructions. */
export function buildQuestions(meds: Med[]): Question[] {
  const ready = meds.filter((m) => m.status === 'ready' && m.name)
  const qs: Question[] = []
  for (const m of ready) {
    const name = title(m.name!)
    if (m.label?.boxedHeadline) {
      qs.push({ about: name, reason: 'boxed', text: `${name} has an FDA boxed warning (${m.label.boxedHeadline.toLowerCase()}). What should we watch for?` })
    }
    if (m.recalls?.length) {
      qs.push({ about: name, reason: 'recall', text: `There is an ongoing FDA recall of some ${m.name} products. Is my supply affected?` })
    }
    if (m.plain) {
      for (const a of m.plain.ask) qs.push({ about: name, reason: 'curated', text: a })
    } else {
      qs.push({ about: name, reason: 'unknown', text: `What is ${m.name} for, and do I still need it?` })
    }
  }
  if (ready.length >= 2) {
    qs.push({ reason: 'list', text: `Can you review all ${ready.length} of my medicines together for interactions or duplicates, including over-the-counter drugs and supplements?` })
  }
  if (ready.length >= 5) {
    qs.push({ reason: 'list', text: 'Am I eligible for a Medicare Part D Medication Therapy Management (MTM) review with a pharmacist?' })
  }
  if (ready.length >= 1) {
    qs.push({ reason: 'list', text: 'Is there any medicine on this list I could stop or lower?' })
  }
  return qs
}
