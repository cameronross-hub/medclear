import { useState } from 'react'
import { addTime, formatTime, PRESETS } from '../lib/schedule'
import { Icon } from './Icon'

export function ScheduleEditor({ times, onChange, whoFrom }: { times: string[]; onChange: (t: string[]) => void; whoFrom: string }) {
  const [custom, setCustom] = useState('')
  return (
    <div className="schedule">
      <div className="time-chips" aria-live="polite">
        {times.length === 0 && <span className="muted small">No times yet.</span>}
        {times.map((t) => (
          <span key={t} className="time-chip">
            <Icon name="clock" size={14} /> {formatTime(t)}
            <button type="button" aria-label={`Remove ${formatTime(t)}`} onClick={() => onChange(times.filter((x) => x !== t))}><Icon name="x" size={14} /></button>
          </span>
        ))}
      </div>
      <div className="presets">
        {PRESETS.filter((p) => !times.includes(p.time)).map((p) => (
          <button key={p.time} type="button" className="chip-btn" onClick={() => onChange(addTime(times, p.time))}>
            + {p.label} <span className="muted">{formatTime(p.time)}</span>
          </button>
        ))}
        <form className="custom-time" onSubmit={(e) => { e.preventDefault(); onChange(addTime(times, custom)); setCustom('') }}>
          <input type="time" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Add a custom time" />
          <button className="chip-btn" type="submit" disabled={!custom}>Add</button>
        </form>
      </div>
      <p className="muted small">Use the times {whoFrom} gave you. MedClear doesn't suggest doses or times.</p>
    </div>
  )
}
