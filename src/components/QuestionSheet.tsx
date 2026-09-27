import { useMemo, useState } from 'react'
import { buildQuestions } from '../lib/questions'
import { audience, possessive } from '../lib/profiles'
import type { Profile, Question } from '../lib/types'
import { Icon } from './Icon'

const REASON: Record<Question['reason'], string> = {
  boxed: 'Boxed warning',
  recall: 'Recall',
  curated: 'Common question',
  unknown: 'Unfamiliar medicine',
  list: 'Whole list',
}

export function QuestionSheet({ profile, onGoToList }: { profile: Profile; onGoToList: () => void }) {
  const meds = profile.meds
  const questions = useMemo(() => buildQuestions(profile.meds, profile), [profile])
  const forWhom = profile.kind === 'self' ? `your ${audience(profile)}` : `${possessive(profile)} ${audience(profile)}`
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const kept = questions.filter((q) => !skipped.has(q.text))
  const ready = meds.filter((m) => m.status === 'ready' || m.status === 'custom')

  if (!ready.length) {
    return (
      <section className="empty">
        <Icon name="question" size={40} />
        <h2>No questions yet</h2>
        <p>Add medicines to {profile.kind === 'self' ? 'your' : `${possessive(profile)}`} list and we'll suggest questions to bring to the next appointment.</p>
        <button className="btn primary" onClick={onGoToList}>Go to my list</button>
      </section>
    )
  }

  const groups = new Map<string, Question[]>()
  for (const q of questions) {
    const k = q.about ?? 'About the whole list'
    groups.set(k, [...(groups.get(k) ?? []), q])
  }
  const asText = () =>
    [`Questions for ${forWhom} (${new Date().toLocaleDateString()})`, `Medicines: ${ready.map((m) => m.name ?? m.input).join(', ')}`, '']
      .concat(kept.map((q, i) => `${i + 1}. ${q.about ? `[${q.about}] ` : ''}${q.text}`))
      .join('\n')

  return (
    <section className="sheet" aria-labelledby="sheet-title">
      <div className="sheet-head">
        <div>
          <p className="eyebrow">Bring this to the appointment</p>
          <h2 id="sheet-title">Questions for {forWhom}</h2>
          <p className="muted">{kept.length} questions · {ready.length} medicines · uncheck any you don't need</p>
        </div>
        <div className="sheet-actions">
          <button className="btn primary" onClick={() => window.print()}><Icon name="print" size={18} /> Print</button>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(asText())
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {
                setCopied(false)
              }
            }}
          >
            <Icon name="copy" size={18} /> {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>
      </div>

      <div className="print-only print-meds">Medicines: {ready.map((m) => m.name ?? m.input).join(', ')}</div>

      {[...groups.entries()].map(([about, qs]) => (
        <div className="q-group" key={about}>
          <h3>{about}</h3>
          <ul>
            {qs.map((q) => (
              <li key={q.text} className={skipped.has(q.text) ? 'skipped' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={!skipped.has(q.text)}
                    onChange={() =>
                      setSkipped((s) => {
                        const n = new Set(s)
                        if (n.has(q.text)) n.delete(q.text)
                        else n.add(q.text)
                        return n
                      })
                    }
                  />
                  <span>{q.text}</span>
                </label>
                <span className={`tag ${q.reason}`}>{REASON[q.reason]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="muted small">MedClear suggests questions. It doesn't give medical or veterinary advice. Don't start, stop, or change a medicine without talking to a doctor, pharmacist or vet.</p>
    </section>
  )
}
