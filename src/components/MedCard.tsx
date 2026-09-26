import { useState } from 'react'
import type { Med } from '../lib/types'
import { Icon } from './Icon'

const CLASS_PLAIN: Record<string, string> = {
  'Class I': 'the most serious type: could cause serious harm',
  'Class II': 'may cause temporary or reversible problems',
  'Class III': 'unlikely to cause harm',
}
const fdaDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}/${d.slice(0, 4)}`
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

function LongText({ text }: { text: string }) {
  const [full, setFull] = useState(false)
  const short = text.length > 420 && !full
  return (
    <>
      <p className="label-text">{short ? text.slice(0, 420).replace(/\s\S*$/, '') + '…' : text}</p>
      {text.length > 420 && (
        <button className="link-btn" onClick={() => setFull((f) => !f)}>
          {full ? 'Show less' : 'Show the full section'}
        </button>
      )}
    </>
  )
}

export function MedCard({ med, onRemove, onRetry, onPick }: { med: Med; onRemove: () => void; onRetry: () => void; onPick: (s: string) => void }) {
  if (med.status === 'loading') {
    return (
      <article className="card rx loading" aria-busy="true">
        <div className="rx-strip"><span>Rx</span><span>Looking up…</span></div>
        <h3 className="rx-name">{med.input}</h3>
        <div className="skeleton" /><div className="skeleton short" />
      </article>
    )
  }
  if (med.status === 'notfound' || med.status === 'error') {
    return (
      <article className="card rx problem">
        <div className="rx-strip"><span>Rx</span><button className="icon-btn" onClick={onRemove} aria-label={`Remove ${med.input}`}><Icon name="trash" size={18} /></button></div>
        <h3 className="rx-name">{med.input}</h3>
        {med.status === 'notfound' ? (
          <>
            <p>We couldn't find a medicine by that name.{med.suggestions?.length ? ' Did you mean:' : ' Check the spelling on the bottle or pharmacy label.'}</p>
            {!!med.suggestions?.length && (
              <div className="chips">{med.suggestions.map((s) => <button key={s} className="chip-btn" onClick={() => onPick(s)}>{s}</button>)}</div>
            )}
          </>
        ) : (
          <>
            <p>We couldn't reach the drug database. Check your connection and try again.</p>
            <button className="btn" onClick={onRetry}>Try again</button>
          </>
        )}
      </article>
    )
  }

  const { plain, label, recalls, edu } = med
  const name = title(med.name!)
  const brands = plain?.brands ?? label?.brandNames.filter((b) => b.toLowerCase() !== med.name) ?? []

  return (
    <article className="card rx">
      <div className="rx-strip">
        <span>Rx</span>
        <span className="rx-class">{plain?.cls ?? 'Medicine'}</span>
        <button className="icon-btn" onClick={onRemove} aria-label={`Remove ${name}`}><Icon name="trash" size={18} /></button>
      </div>
      <h3 className="rx-name">{name}</h3>
      {brands.length > 0 && <p className="rx-brands">Also sold as {brands.slice(0, 3).join(', ')}</p>}

      <div className="pills">
        {label?.boxedHeadline && <span className="pill warn"><Icon name="alert" size={15} /> Boxed warning</span>}
        {recalls && recalls.length > 0 && <span className="pill crit"><Icon name="recall" size={15} /> {recalls.length} active recall{recalls.length > 1 ? 's' : ''}</span>}
        {recalls && recalls.length === 0 && <span className="pill ok"><Icon name="check" size={15} /> No active recalls found</span>}
      </div>

      <div className="for">
        <Icon name="info" size={22} />
        <p><strong>What it's for: </strong>{plain?.for ?? label?.indications?.slice(0, 220).replace(/\s\S*$/, '…') ?? 'We could not find a summary. Ask your pharmacist.'}</p>
      </div>

      <div className="sections">
        {plain && (
          <details open>
            <summary>Things to ask about or watch for</summary>
            <ul>{plain.watch.map((w) => <li key={w}>{w}</li>)}</ul>
          </details>
        )}
        {label?.boxedWarning && (
          <details>
            <summary><span className="sum-icon warn"><Icon name="alert" size={16} /></span>FDA boxed warning: {label.boxedHeadline ?? 'see details'}</summary>
            <p className="explain">A boxed warning is the FDA's strongest safety warning. It doesn't mean the medicine is wrong for you. It means this risk is worth discussing.</p>
            <LongText text={label.boxedWarning} />
          </details>
        )}
        {recalls && recalls.length > 0 && (
          <details>
            <summary><span className="sum-icon crit"><Icon name="recall" size={16} /></span>Active recalls ({recalls.length})</summary>
            <p className="explain">Recalls usually affect specific lots from one manufacturer, not every bottle. Your pharmacist can check your supply.</p>
            <ul className="recalls">
              {recalls.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <strong>{r.classification}</strong> ({CLASS_PLAIN[r.classification] ?? 'see FDA details'}) · {fdaDate(r.date)}
                  <br />{r.reason} <span className="muted">· {r.firm}</span>
                </li>
              ))}
            </ul>
            {recalls.length > 5 && <p className="muted small">Showing the 5 most recent of {recalls.length}.</p>}
          </details>
        )}
        {label && (
          <details>
            <summary><span className="sum-icon"><Icon name="book" size={16} /></span>From the official FDA label</summary>
            {label.indications && <><h4>Uses</h4><LongText text={label.indications} /></>}
            {label.interactions && <><h4>Drug interactions (label text)</h4><LongText text={label.interactions} /></>}
            {label.warnings && <><h4>Warnings and precautions</h4><LongText text={label.warnings} /></>}
          </details>
        )}
      </div>

      <footer className="rx-foot">
        <span className="muted">Sources:</span>
        {label && <a href={label.url} target="_blank" rel="noreferrer">FDA label (DailyMed) <Icon name="external" size={13} /></a>}
        {edu?.slice(0, 2).map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer">MedlinePlus: {l.title} <Icon name="external" size={13} /></a>)}
        {plain && <span className="muted">Summary drafted with AI from FDA labeling</span>}
        {!!med.failed?.length && <span className="muted">Couldn't load: {med.failed.join(', ')}</span>}
      </footer>
    </article>
  )
}
