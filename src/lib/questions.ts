import type { Med, ProfileKind, Question } from './types'

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export interface Who {
  kind: ProfileKind
  name: string
}

/** Build the question sheet for one profile's list. Never gives instructions; questions only. */
export function buildQuestions(meds: Med[], who: Who = { kind: 'self', name: 'Me' }): Question[] {
  const pet = who.kind === 'pet'
  const ready = meds.filter((m) => (m.status === 'ready' && m.name) || m.status === 'custom')
  const qs: Question[] = []
  for (const m of ready) {
    const raw = m.name ?? m.input
    const name = title(raw)
    if (m.label?.boxedHeadline) {
      qs.push({ about: name, reason: 'boxed', text: `${name} has an FDA boxed warning (${m.label.boxedHeadline.toLowerCase()}). What should we watch for?` })
    }
    if (m.recalls?.length) {
      qs.push({ about: name, reason: 'recall', text: `There is an ongoing FDA recall of some ${raw} products. Is our supply affected?` })
    }
    if (m.plain && (!pet || m.plain.vet)) {
      for (const a of m.plain.ask) qs.push({ about: name, reason: 'curated', text: a })
    } else if (pet) {
      qs.push({ about: name, reason: 'unknown', text: `Is ${raw} safe for ${who.name} alongside their other medicines, and what side effects should we watch for?` })
    } else {
      qs.push({ about: name, reason: 'unknown', text: `What is ${raw} for, and is it still needed?` })
    }
  }
  if (ready.length >= 2) {
    qs.push({
      reason: 'list',
      text: pet
        ? `Can you review all ${ready.length} of ${who.name}'s medicines together, including supplements and treats with medicine in them?`
        : `Can you review all ${ready.length} medicines together for interactions or duplicates, including over-the-counter drugs and supplements?`,
    })
  }
  if (pet && ready.length >= 2) {
    qs.push({ reason: 'list', text: `Does ${who.name} need bloodwork to keep an eye on these medicines?` })
  }
  if (!pet && ready.length >= 5) {
    qs.push({ reason: 'list', text: 'Is this person eligible for a Medicare Part D Medication Therapy Management (MTM) review with a pharmacist?' })
  }
  if (ready.length >= 1) {
    qs.push({ reason: 'list', text: 'Is there any medicine on this list we could stop or lower?' })
  }
  return qs
}
