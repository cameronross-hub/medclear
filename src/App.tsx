import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './components/Icon'
import { MedCard } from './components/MedCard'
import { MedInput } from './components/MedInput'
import { QuestionSheet } from './components/QuestionSheet'
import { buildQuestions } from './lib/questions'
import { resolveMed } from './lib/resolve'
import type { Med } from './lib/types'
import { CaseStudy } from './pages/CaseStudy'

const KEY = 'medclear-list'
const EXAMPLE = ['metformin 500 mg', 'lisinopril', 'Lipitor', 'amlodipine', 'levothyroxine', 'warfarin', 'omeprazole', 'donepezil']

type Route = 'list' | 'questions' | 'about'
const routeFromHash = (): Route => (location.hash === '#/questions' ? 'questions' : location.hash === '#/about' ? 'about' : 'list')

const store = {
  load(): string[] | null {
    try {
      const v = localStorage.getItem(KEY)
      return v ? (JSON.parse(v) as string[]) : null
    } catch {
      return null
    }
  },
  save(list: string[] | null) {
    try {
      if (list === null) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, JSON.stringify(list))
    } catch {
      /* storage unavailable (private mode); the app still works for this visit */
    }
  },
}

let seq = 0
const newMed = (input: string): Med => ({ id: `m${++seq}`, input, status: 'loading' })

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [saved] = useState(store.load)
  const [isExample, setIsExample] = useState(saved === null)
  const [meds, setMeds] = useState<Med[]>(() => (saved ?? EXAMPLE).map(newMed))

  useEffect(() => {
    const on = () => {
      setRoute(routeFromHash())
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  const lookup = useCallback((m: Med) => {
    resolveMed(m).then((r) => setMeds((all) => all.map((x) => (x.id === m.id ? r : x))))
  }, [])

  // Resolve anything still loading (initial list, new adds, retries).
  const started = useRef(new Set<string>())
  useEffect(() => {
    for (const m of meds) if (m.status === 'loading' && !started.current.has(m.id)) {
      started.current.add(m.id)
      lookup(m)
    }
  }, [meds, lookup])

  useEffect(() => {
    if (!isExample) store.save(meds.map((m) => m.input))
  }, [meds, isExample])

  const add = (input: string) => {
    if (isExample) {
      setIsExample(false)
      setMeds([newMed(input)])
    } else setMeds((all) => [...all, newMed(input)])
  }
  const remove = (id: string) => {
    setIsExample(false)
    setMeds((all) => all.filter((m) => m.id !== id))
  }
  const retry = (m: Med) => setMeds((all) => all.map((x) => (x.id === m.id ? newMed(m.input) : x)))
  const clearAll = () => {
    setIsExample(false)
    setMeds([])
    store.save([])
  }

  const ready = meds.filter((m) => m.status === 'ready')
  const boxed = ready.filter((m) => m.label?.boxedHeadline).length
  const recalls = ready.filter((m) => m.recalls?.length).length
  const loading = meds.filter((m) => m.status === 'loading').length
  const qCount = buildQuestions(meds).length

  const tabs: { r: Route; label: string; icon: IconName; badge?: number }[] = [
    { r: 'list', label: 'My list', icon: 'pill', badge: meds.length || undefined },
    { r: 'questions', label: 'Questions', icon: 'question', badge: qCount || undefined },
    { r: 'about', label: 'Case study', icon: 'chart' },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/"><img className="logo" src={`${import.meta.env.BASE_URL}favicon.svg`} width={32} height={32} alt="" />MedClear</a>
        <nav className="tabs top" aria-label="Main">
          {tabs.map((t) => (
            <a key={t.r} href={t.r === 'list' ? '#/' : `#/${t.r}`} aria-current={route === t.r ? 'page' : undefined}>
              <Icon name={t.icon} size={18} /> {t.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="main">
        {route === 'list' && (
          <>
            <section className="intro">
              <h1>Understand every medicine on the list.</h1>
              <p className="lede">Plain-language explanations, FDA warnings and recalls, and a question sheet for the next appointment. Free and private: your list never leaves this device.</p>
            </section>

            <MedInput onAdd={add} />

            {isExample && (
              <div className="banner" role="status">
                <Icon name="info" />
                <p><strong>This is an example list</strong> for a 74-year-old on eight medicines. Add your own medicine to replace it.</p>
                <button className="btn" onClick={clearAll}>Start my own list</button>
              </div>
            )}

            {meds.length > 0 && (
              <div className="summary" aria-live="polite">
                <div className="sum"><Icon name="pill" /><b>{meds.length}</b><span>medicines</span></div>
                <div className={`sum ${boxed ? 'warn' : ''}`}><Icon name="alert" /><b>{boxed}</b><span>boxed warnings</span></div>
                <div className={`sum ${recalls ? 'crit' : 'ok'}`}><Icon name="recall" /><b>{recalls}</b><span>with active recalls</span></div>
                <a className="sum link" href="#/questions"><Icon name="question" /><b>{qCount}</b><span>questions ready →</span></a>
              </div>
            )}
            {loading > 0 && <p className="muted small">Looking up {loading} medicine{loading > 1 ? 's' : ''} in FDA and NIH databases…</p>}

            <div className="cards">
              {meds.map((m) => (
                <MedCard key={m.id} med={m} onRemove={() => remove(m.id)} onRetry={() => retry(m)} onPick={(s) => { remove(m.id); add(s) }} />
              ))}
            </div>

            {meds.length === 0 && (
              <section className="empty">
                <Icon name="pill" size={40} />
                <h2>Your list is empty</h2>
                <p>Add the first medicine above. Brand names, generic names, and doses all work.</p>
              </section>
            )}
            {meds.length > 0 && !isExample && (
              <button className="link-btn danger" onClick={clearAll}><Icon name="trash" size={16} /> Clear my list from this device</button>
            )}
          </>
        )}

        {route === 'questions' && <QuestionSheet meds={meds} onGoToList={() => (location.hash = '#/')} />}
        {route === 'about' && <CaseStudy />}

        <footer className="disclaimer">
          <Icon name="shield" size={18} />
          <p><strong>Not medical advice.</strong> MedClear explains public FDA and NIH information and suggests questions. Always talk to your doctor or pharmacist before changing any medicine. In an emergency, call 911.</p>
        </footer>
      </main>

      <nav className="tabs bottom" aria-label="Main">
        {tabs.map((t) => (
          <a key={t.r} href={t.r === 'list' ? '#/' : `#/${t.r}`} aria-current={route === t.r ? 'page' : undefined}>
            <span className="tab-icon"><Icon name={t.icon} size={22} />{t.badge ? <i>{t.badge}</i> : null}</span>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
