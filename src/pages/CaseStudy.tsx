import { useEffect, useState } from 'react'
import { getLabelFreshness } from '../api/openfda'
import { BuildLog } from '../components/BuildLog'
import { Icon } from '../components/Icon'
import { plainDrugs } from '../lib/plain'

function Freshness() {
  const [d, setD] = useState<string | null>(null)
  useEffect(() => {
    getLabelFreshness().then(setD).catch(() => setD(''))
  }, [])
  return <b>{d === null ? '…' : d || 'unavailable'}</b>
}

export function CaseStudy() {
  return (
    <div className="case">
      <header className="case-hero">
        <p className="eyebrow">Product case study</p>
        <h1>Turning a pharmacy bag into good questions</h1>
        <p className="lede">A weekend build by Cameron Ross: a free, private tool that helps family caregivers understand a parent's medications and walk into appointments prepared.</p>
        <div className="tiles">
          <div><b>$0</b><span>to run: public FDA and NIH data, no accounts</span></div>
          <div><b>0</b><span>pieces of personal data sent to a server</span></div>
          <div><b>{plainDrugs.length}</b><span>common Medicare drugs with plain-language summaries</span></div>
          <div><b>4</b><span>live public data sources</span></div>
        </div>
      </header>

      <section className="case-sec">
        <h2><Icon name="user" /> Who it's for</h2>
        <div className="persona">
          <div className="avatar" aria-hidden="true">L</div>
          <div>
            <h3>Linda, 48 <span className="tag list">Illustrative persona</span></h3>
            <p>Works full-time and coordinates care for her father, Robert (74), who takes eight daily medicines prescribed by three different doctors. She isn't clinical. Before each appointment she wonders what each pill is for, whether any are risky together, and what to ask.</p>
          </div>
        </div>
        <div className="journey" role="list" aria-label="Caregiver journey without and with MedClear">
          {[
            ['Pharmacy bag', 'Eight bottles, jargon labels'],
            ['Web search', 'Dense FDA text, scary forums'],
            ['Appointment', '15 minutes, questions forgotten'],
            ['After', 'Still unsure what changed'],
          ].map(([t, d], i) => (
            <div className="step before" role="listitem" key={t}><span>{i + 1}</span><b>{t}</b><small>{d}</small></div>
          ))}
        </div>
        <div className="journey" role="list">
          {[
            ['Type the list', 'Misspellings and brand names are fine'],
            ['Read plain cards', 'Purpose, warnings, recalls'],
            ['Print questions', 'Grouped by medicine'],
            ['Share with advocate', 'Next on the roadmap'],
          ].map(([t, d], i) => (
            <div className="step after" role="listitem" key={t}><span>{i + 1}</span><b>{t}</b><small>{d}</small></div>
          ))}
        </div>
      </section>

      <section className="case-sec">
        <h2><Icon name="book" /> One-page PRD</h2>
        <div className="accordion">
          <details open>
            <summary>Problem and goal</summary>
            <p>Older adults on many medicines, and the family members helping them, struggle to understand what each drug does and what to ask. <strong>Goal:</strong> in under five minutes, a caregiver goes from a list of names to a printed, prioritized question sheet.</p>
          </details>
          <details>
            <summary>Non-goals</summary>
            <ul><li>Medical advice, dosing, or telling anyone to start or stop a drug</li><li>A full drug-interaction checker (the free NIH interaction API was retired in 2024; the app shows label text instead)</li><li>Accounts, cloud storage, or collecting health data</li></ul>
          </details>
          <details>
            <summary>Requirements</summary>
            <ul>
              <li><span className="tag boxed">P0</span> Add medicines by brand, generic, or misspelled name</li>
              <li><span className="tag boxed">P0</span> Plain-language purpose, boxed warnings, active recalls, cited sources</li>
              <li><span className="tag boxed">P0</span> Printable, editable question sheet</li>
              <li><span className="tag curated">P1</span> Installable phone app that works offline for lists already looked up</li>
              <li><span className="tag curated">P1</span> Accessible to older eyes: large type, high contrast, keyboard support</li>
            </ul>
          </details>
          <details>
            <summary>Risks and mitigations</summary>
            <ul><li><b>Wrong or oversimplified information.</b> Every card links to the official label, summaries are labeled as AI-drafted, and there is no dosing guidance.</li><li><b>Alarm fatigue from boxed warnings.</b> Plain explanation: "strongest warning, worth discussing, not a verdict."</li><li><b>Privacy.</b> Nothing leaves the browser except drug names sent to public APIs.</li></ul>
          </details>
        </div>
      </section>

      <section className="case-sec">
        <h2><Icon name="chart" /> How success would be measured</h2>
        <p className="muted">Planned instrumentation. This demo collects no analytics, so there are no usage numbers here by design.</p>
        <div className="tree">
          <div className="node star"><small>North Star</small><b>Caregivers who leave with a question sheet</b></div>
          <div className="branches">
            <div className="node"><small>Input</small><b>Lists started</b></div>
            <div className="node"><small>Input</small><b>% of names resolved on first try</b></div>
            <div className="node"><small>Input</small><b>Sheets printed or copied</b></div>
            <div className="node guard"><small>Guardrail</small><b>Not-found rate &lt; 5%</b></div>
            <div className="node guard"><small>Guardrail</small><b>First card in under 3 seconds</b></div>
          </div>
        </div>
      </section>

      <section className="case-sec">
        <h2><Icon name="git" /> How it was built</h2>
        <div className="flowline">
          <div><b>Claude Code</b><small>Plans, builds, tests</small></div>
          <span aria-hidden="true">→</span>
          <div><b>Codex</b><small>Independent review; ships one feature by PR</small></div>
          <span aria-hidden="true">→</span>
          <div><b>Cameron</b><small>Product decisions, review, merge</small></div>
          <span aria-hidden="true">→</span>
          <div><b>GitHub Pages</b><small>Auto-deploy on merge</small></div>
        </div>
        <details className="plain-details">
          <summary>Data sources</summary>
          <ul>
            <li><b>NIH RxNorm (RxNav):</b> turns any spelling or brand into a standard ingredient</li>
            <li><b>openFDA drug labels:</b> uses, boxed warnings, label interaction text. Data last updated <Freshness /></li>
            <li><b>openFDA enforcement reports:</b> recalls still ongoing in the last two years</li>
            <li><b>NIH MedlinePlus Connect:</b> patient-education pages</li>
          </ul>
        </details>
        <h3 className="log-title">Live build log</h3>
        <BuildLog />
      </section>

      <section className="case-sec">
        <h2><Icon name="list" /> Roadmap</h2>
        <div className="roadmap">
          <div><h3>Now</h3><ul><li>Plain-language cards</li><li>Recalls and boxed warnings</li><li>Question sheet</li><li>Installable app</li></ul></div>
          <div><h3>Next</h3><ul><li>Human pharmacist review of every summary</li><li>Snap a photo of a pill bottle to add it</li><li>Spanish</li><li>Usability tests with five caregivers</li></ul></div>
          <div><h3>Later: inside an advocacy platform</h3><ul><li>Patient shares the list with their advocate at intake</li><li>Advocate sees flagged meds before specialist visits</li><li>Questions flow into the visit-prep brief</li></ul></div>
        </div>
      </section>
    </div>
  )
}
