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
        <h1>What's this pill for, and when do I take it?</h1>
        <p className="lede">A weekend build by Cameron Ross: a free, private tool for managing medicines at home. It shows what each one is for, when and how to take it, and a daily checklist for you, a parent, or a pet.</p>
        <div className="tiles">
          <div><b>$0</b><span>to run: public FDA and NIH data, no accounts</span></div>
          <div><b>0</b><span>pieces of personal data sent to a server</span></div>
          <div><b>{plainDrugs.length}</b><span>medicines with plain-language summaries, including {plainDrugs.filter((d) => d.vet).length} for pets</span></div>
          <div><b>4</b><span>live public data sources</span></div>
        </div>
      </header>

      <section className="case-sec">
        <h2><Icon name="user" /> Who it's for</h2>
        <div className="persona">
          <div className="avatar" aria-hidden="true">R</div>
          <div>
            <h3>Robert, 62 <span className="tag list">Illustrative persona</span></h3>
            <p>Takes five medicines a day for diabetes, blood pressure and cholesterol, keeps them in a pill organizer, and still forgets which is which, what each is for, and whether it goes with food. He also helps his 86-year-old mother with hers, and his elderly dog Buddy takes three more.</p>
          </div>
        </div>
        <div className="insight-box">
          <Icon name="bulb" />
          <p><strong>What changed after version 1:</strong> v1 explained one list of medicines. Watching how my own family manages medicines at home showed the gaps: people forget <em>when</em> and <em>how</em> to take each one, not just what it's for, and they often manage a parent's or a pet's medicines too. v2 added profiles for people and pets, dose times, how-to-take instructions, and a daily checklist.</p>
        </div>
        <div className="journey" role="list" aria-label="A day with medicines, without and with MedClear">
          {[
            ['Pill organizer', 'Which one was the morning pill?'],
            ['What is it for?', 'Labels full of jargon'],
            ['With food?', 'Instructions long forgotten'],
            ['Missed dose?', "Can't remember if he took it"],
          ].map(([t, d], i) => (
            <div className="step before" role="listitem" key={t}><span>{i + 1}</span><b>{t}</b><small>{d}</small></div>
          ))}
        </div>
        <div className="journey" role="list">
          {[
            ['Add each medicine', 'Brand names and typos are fine'],
            ['Plain-language card', 'What it is for, in plain words'],
            ['When and how', 'Times plus with food, empty stomach…'],
            ['Check off Today', 'For him, his mom and the dog'],
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
            <p>People who take several medicines a day forget what each one is for, when it's due, and how to take it (with food, on an empty stomach). Many also manage a parent's or a pet's medicines. <strong>Goal:</strong> in under five minutes, anyone can go from a pile of bottles to a plain-language list with times, instructions and a daily checklist.</p>
          </details>
          <details>
            <summary>Non-goals</summary>
            <ul><li>Medical or veterinary advice, dosing, or telling anyone to start or stop a drug</li><li>Push notifications, which would need a server; the Today checklist works on the device instead</li><li>A full drug-interaction checker (the free NIH interaction API was retired in 2024; the app shows label text instead)</li><li>Accounts, cloud storage, or collecting health data</li></ul>
          </details>
          <details>
            <summary>Requirements</summary>
            <ul>
              <li><span className="tag boxed">P0</span> Add medicines by brand, generic, or misspelled name</li>
              <li><span className="tag boxed">P0</span> Plain-language purpose, boxed warnings, active recalls, cited sources</li>
              <li><span className="tag boxed">P0</span> Dose times and how-to-take instructions the user enters, and a daily Today checklist</li>
              <li><span className="tag curated">P1</span> Printable question sheet for the doctor or vet</li>
              <li><span className="tag curated">P1</span> Installable phone app that works offline for lists already looked up</li>
              <li><span className="tag curated">P1</span> Profiles for each person or pet, and a daily checklist of the dose times the user enters</li>
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
          <div className="node star"><small>North Star</small><b>Days with every scheduled dose checked off</b></div>
          <div className="branches">
            <div className="node"><small>Input</small><b>Medicines with a time set</b></div>
            <div className="node"><small>Input</small><b>% of names resolved on first try</b></div>
            <div className="node"><small>Input</small><b>Return visits to Today</b></div>
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
          <div><h3>Now</h3><ul><li>Plain-language cards</li><li>Recalls and boxed warnings</li><li>Question sheets per person or pet</li><li>Profiles and a daily dose checklist</li><li>Installable app</li></ul></div>
          <div><h3>Next</h3><ul><li>Calendar export so the phone itself sends reminders</li><li>Pharmacist and vet review of every summary</li><li>Snap a photo of a pill bottle to add it</li><li>Spanish</li><li>Usability tests with five caregivers</li></ul></div>
          <div><h3>Later: inside an advocacy platform</h3><ul><li>Patient shares the list with their advocate at intake</li><li>Advocate sees flagged meds before specialist visits</li><li>Questions flow into the visit-prep brief</li></ul></div>
        </div>
      </section>
    </div>
  )
}
