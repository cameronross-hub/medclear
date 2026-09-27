import type { Med, Profile } from './types'

export const PRESETS = [
  { label: 'Morning', time: '08:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Evening', time: '18:00' },
  { label: 'Bedtime', time: '21:00' },
]

/** "18:00" -> "6:00 PM" */
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

export type Slot = 'Morning' | 'Midday' | 'Evening' | 'Night'
export function slotOf(t: string): Slot {
  const h = Number(t.split(':')[0])
  if (h >= 5 && h < 11) return 'Morning'
  if (h >= 11 && h < 15) return 'Midday'
  if (h >= 15 && h < 20) return 'Evening'
  return 'Night'
}

export function addTime(times: string[], t: string): string[] {
  return /^\d{2}:\d{2}$/.test(t) && !times.includes(t) ? [...times, t].sort() : times
}

export interface Dose {
  key: string
  time: string
  profile: Profile
  med: Med
}

/** Every scheduled dose for today, across the chosen profiles, in time order. */
export function dosesFor(profiles: Profile[]): Dose[] {
  const out: Dose[] = []
  for (const p of profiles)
    for (const m of p.meds)
      for (const t of m.times) out.push({ key: `${p.id}|${m.input}|${t}`, time: t, profile: p, med: m })
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.profile.name.localeCompare(b.profile.name))
}

/** The next dose not yet checked off: the first at or after now, else the earliest one still open (overdue). */
export function nextDose(doses: Dose[], done: Set<string>, now: Date): Dose | undefined {
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const open = doses.filter((d) => !done.has(d.key))
  return open.find((d) => d.time >= hhmm) ?? open[0]
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
