import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Avatar } from '../components/ProfileBar'
import { dosesFor, formatTime, nextDose, slotOf, todayKey, type Slot } from '../lib/schedule'
import type { Profile } from '../lib/types'

const KEY = 'medclear-taken'
const SLOTS: Slot[] = ['Morning', 'Midday', 'Evening', 'Night']
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

function loadDone(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { date: string; keys: string[] } | null
    return new Set(v && v.date === todayKey() ? v.keys : [])
  } catch {
    return new Set()
  }
}
function saveDone(keys: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), keys: [...keys] }))
  } catch {
    /* storage unavailable; checkmarks last for this visit */
  }
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 26, c = 2 * Math.PI * r, pct = total ? done / total : 0
  return (
    <svg className="ring" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${total} doses checked off`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
      {pct > 0 && <circle cx="32" cy="32" r={r} fill="none" stroke="var(--ok)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 32 32)" />}
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">{done}/{total}</text>
    </svg>
  )
}

export function Today({ profiles, onGoToList }: { profiles: Profile[]; onGoToList: () => void }) {
  const [filter, setFilter] = useState<string>('all')
  const [done, setDone] = useState<Set<string>>(loadDone)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const shown = filter === 'all' ? profiles : profiles.filter((p) => p.id === filter)
  const doses = useMemo(() => dosesFor(shown), [shown])
  const next = nextDose(doses, done, now)
  const checked = doses.filter((d) => done.has(d.key)).length

  const toggle = (key: string) =>
    setDone((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      saveDone(n)
      return n
    })

  const dateLabel = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const anyTimes = profiles.some((p) => p.meds.some((m) => m.times.length))

  if (!anyTimes) {
    return (
      <section className="empty">
        <Icon name="calendar" size={40} />
        <h2>No schedule yet</h2>
        <p>Open a medicine card and add the times {`you've been told to take it`}. Your daily checklist will show up here.</p>
        <button className="btn primary" onClick={onGoToList}>Go to medicines</button>
      </section>
    )
  }

  return (
    <section className="today" aria-labelledby="today-title">
      <div className="today-head">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="today-title">{dateLabel}</h2>
          <p className="muted">{checked === doses.length && doses.length ? 'Every dose is checked off. Nice work.' : `${doses.length - checked} doses left today`}</p>
        </div>
        <Ring done={checked} total={doses.length} />
      </div>

      <div className="filter-row" role="group" aria-label="Show doses for">
        <button className="filter-chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}><Icon name="users" size={16} /> Everyone</button>
        {profiles.filter((p) => p.meds.some((m) => m.times.length)).map((p) => (
          <button key={p.id} className="filter-chip" aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}><Avatar p={p} size={22} /> {p.name}</button>
        ))}
      </div>

      {next && (
        <div className="next-up">
          <span className="next-label"><Icon name="clock" size={16} /> Next up · {formatTime(next.time)}</span>
          <div className="next-body">
            <Avatar p={next.profile} size={40} />
            <div>
              <b className="dose-name">{title(next.med.name ?? next.med.input)}</b>
              {next.med.how.length > 0 && <span className="next-how">{next.med.how.join(' · ')}</span>}
              <span className="muted small">{next.profile.name}{next.med.plain ? ` · ${next.med.plain.for}` : ''}</span>
            </div>
            <button className="btn primary" onClick={() => toggle(next.key)}><Icon name="check" size={18} /> Done</button>
          </div>
        </div>
      )}

      {SLOTS.map((slot) => {
        const list = doses.filter((d) => slotOf(d.time) === slot)
        if (!list.length) return null
        return (
          <div className="slot" key={slot}>
            <h3>{slot}</h3>
            <ul>
              {list.map((d) => {
                const isDone = done.has(d.key)
                return (
                  <li key={d.key} className={isDone ? 'done' : ''}>
                    <label>
                      <input type="checkbox" checked={isDone} onChange={() => toggle(d.key)} />
                      <span className="dose-time">{formatTime(d.time)}</span>
                      <span className="dose-main">
                        <b className="dose-name">{title(d.med.name ?? d.med.input)}</b>
                        {d.med.how.length > 0 ? <span className="how-line">{d.med.how.join(' · ')}</span> : d.med.plain && <span className="muted small">{d.med.plain.cls}</span>}
                      </span>
                      <span className={`who-chip ${d.profile.kind}`}><Avatar p={d.profile} size={20} /> {d.profile.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}

      <p className="muted small">Checkmarks reset each day and stay on this device. MedClear doesn't send notifications. Keep it on your home screen and check doses off here.</p>
    </section>
  )
}
