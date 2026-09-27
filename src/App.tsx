import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './components/Icon'
import { MedCard } from './components/MedCard'
import { MedInput } from './components/MedInput'
import { ProfileBar } from './components/ProfileBar'
import { QuestionSheet } from './components/QuestionSheet'
import { EXAMPLE_STATE, LEGACY_KEY, loadState, possessive, slug, STATE_KEY, toSaved, type SavedState } from './lib/profiles'
import { buildQuestions } from './lib/questions'
import { resolveMed } from './lib/resolve'
import type { Med, Profile, ProfileKind } from './lib/types'
import { CaseStudy } from './pages/CaseStudy'
import { Today } from './pages/Today'

type Route = 'list' | 'today' | 'questions' | 'about'
const ROUTES: Record<string, Route> = { '#/today': 'today', '#/questions': 'questions', '#/about': 'about' }
const routeFromHash = (): Route => ROUTES[location.hash] ?? 'list'

const readStorage = (): SavedState | null => {
  try {
    return loadState(localStorage)
  } catch {
    return null
  }
}
const writeStorage = (s: SavedState) => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s))
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* storage unavailable (private mode); the app still works for this visit */
  }
}

let seq = 0
const newMed = (input: string, times: string[] = [], custom = false): Med => ({ id: `m${++seq}`, input, times, status: custom ? 'custom' : 'loading' })
const hydrate = (s: SavedState): Profile[] =>
  s.profiles.map((p) => ({ id: p.id, name: p.name, kind: p.kind, species: p.species, meds: p.meds.map((m) => newMed(m.input, m.times ?? [], !!m.custom)) }))

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [saved] = useState(readStorage)
  const [isExample, setIsExample] = useState(saved === null)
  const [profiles, setProfiles] = useState<Profile[]>(() => hydrate(saved ?? EXAMPLE_STATE))
  const [activeId, setActiveId] = useState(() => (saved ?? EXAMPLE_STATE).activeId)
  const active = profiles.find((p) => p.id === activeId) ?? profiles[0]

  useEffect(() => {
    const on = () => {
      setRoute(routeFromHash())
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  const updateMed = useCallback((medId: string, fn: (m: Med) => Med) => {
    setProfiles((ps) => ps.map((p) => (p.meds.some((m) => m.id === medId) ? { ...p, meds: p.meds.map((m) => (m.id === medId ? fn(m) : m)) } : p)))
  }, [])

  // Resolve anything still loading (initial lists, new adds, retries), across every profile.
  const started = useRef(new Set<string>())
  useEffect(() => {
    for (const p of profiles)
      for (const m of p.meds)
        if (m.status === 'loading' && !started.current.has(m.id)) {
          started.current.add(m.id)
          resolveMed(m).then((r) => updateMed(m.id, (cur) => ({ ...r, times: cur.times })))
        }
  }, [profiles, updateMed])

  useEffect(() => {
    if (!isExample && active) writeStorage(toSaved(profiles, active.id))
  }, [profiles, active, isExample])

  /** Any edit turns the example household into the user's own data. */
  const edit = (fn: (ps: Profile[]) => Profile[]) => {
    setIsExample(false)
    setProfiles(fn)
  }
  const editActive = (fn: (p: Profile) => Profile) => edit((ps) => ps.map((p) => (p.id === active.id ? fn(p) : p)))

  const add = (input: string) => editActive((p) => ({ ...p, meds: [...p.meds, newMed(input)] }))
  const remove = (id: string) => editActive((p) => ({ ...p, meds: p.meds.filter((m) => m.id !== id) }))
  const retry = (m: Med) => editActive((p) => ({ ...p, meds: p.meds.map((x) => (x.id === m.id ? newMed(m.input, m.times) : x)) }))
  const keep = (m: Med) => editActive((p) => ({ ...p, meds: p.meds.map((x) => (x.id === m.id ? { ...x, status: 'custom' } : x)) }))
  const setTimes = (m: Med, times: string[]) => {
    setIsExample(false)
    updateMed(m.id, (x) => ({ ...x, times }))
  }
  const addProfile = ({ name, kind, species }: { name: string; kind: ProfileKind; species?: string }) => {
    const id = slug(name, profiles.map((p) => p.id))
    edit((ps) => [...ps, { id, name, kind, species, meds: [] }])
    setActiveId(id)
  }
  const removeProfile = () => {
    if (profiles.length <= 1) return
    const rest = profiles.filter((p) => p.id !== active.id)
    edit(() => rest)
    setActiveId(rest[0].id)
  }
  const startOwn = () => {
    setIsExample(false)
    setProfiles([{ id: 'me', name: 'Me', kind: 'self', meds: [] }])
    setActiveId('me')
  }

  const ready = active.meds.filter((m) => m.status === 'ready')
  const boxed = ready.filter((m) => m.label?.boxedHeadline).length
  const recalls = ready.filter((m) => m.recalls?.length).length
  const loading = profiles.reduce((n, p) => n + p.meds.filter((m) => m.status === 'loading').length, 0)
  const qCount = buildQuestions(active.meds, active).length
  const doseCount = profiles.reduce((n, p) => n + p.meds.reduce((k, m) => k + m.times.length, 0), 0)
  const pet = active.kind === 'pet' ? { name: active.name } : null
  const whose = possessive(active)

  const tabs: { r: Route; label: string; icon: IconName; badge?: number }[] = [
    { r: 'list', label: 'Medicines', icon: 'pill', badge: active.meds.length || undefined },
    { r: 'today', label: 'Today', icon: 'calendar', badge: doseCount || undefined },
    { r: 'questions', label: 'Questions', icon: 'question', badge: qCount || undefined },
    { r: 'about', label: 'Case study', icon: 'chart' },
  ]
  const href = (r: Route) => (r === 'list' ? '#/' : `#/${r}`)

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/"><img className="logo" src={`${import.meta.env.BASE_URL}favicon.svg`} width={32} height={32} alt="" />MedClear</a>
        <nav className="tabs top" aria-label="Main">
          {tabs.map((t) => (
            <a key={t.r} href={href(t.r)} aria-current={route === t.r ? 'page' : undefined}>
              <Icon name={t.icon} size={18} /> {t.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="main">
        {(route === 'list' || route === 'questions') && (
          <ProfileBar profiles={profiles} activeId={active.id} onSelect={setActiveId} onAdd={addProfile} />
        )}

        {route === 'list' && (
          <>
            {isExample && (
              <div className="banner" role="status">
                <Icon name="info" />
                <p><strong>This is an example household:</strong> Dad on eight medicines, Buddy the dog on three, and you. Add a medicine or a person to make it yours.</p>
                <button className="btn" onClick={startOwn}>Start my own</button>
              </div>
            )}

            <section className="intro">
              <h1>{active.kind === 'self' ? 'My medicines' : `${whose} medicines`}</h1>
              <p className="lede">
                {active.kind === 'pet'
                  ? `What each of ${whose} medicines is for, warnings, and questions for the vet.`
                  : 'Plain-language explanations, FDA warnings and recalls, a daily schedule, and questions for the next appointment.'}{' '}
                Private: the list never leaves this device.
              </p>
            </section>

            <MedInput onAdd={add} />

            {active.meds.length > 0 && (
              <div className="summary" aria-live="polite">
                <div className="sum"><Icon name="pill" /><b>{active.meds.length}</b><span>medicines</span></div>
                <div className={`sum ${boxed ? 'warn' : ''}`}><Icon name="alert" /><b>{boxed}</b><span>boxed warnings</span></div>
                <div className={`sum ${recalls ? 'crit' : 'ok'}`}><Icon name="recall" /><b>{recalls}</b><span>with active recalls</span></div>
                <a className="sum link" href="#/today"><Icon name="calendar" /><b>{active.meds.reduce((k, m) => k + m.times.length, 0)}</b><span>doses a day →</span></a>
              </div>
            )}
            {loading > 0 && <p className="muted small">Looking up {loading} medicine{loading > 1 ? 's' : ''} in FDA and NIH databases…</p>}

            <div className="cards">
              {active.meds.map((m) => (
                <MedCard
                  key={m.id}
                  med={m}
                  pet={pet}
                  onRemove={() => remove(m.id)}
                  onRetry={() => retry(m)}
                  onPick={(s) => { remove(m.id); add(s) }}
                  onKeep={() => keep(m)}
                  onTimes={(t) => setTimes(m, t)}
                />
              ))}
            </div>

            {active.meds.length === 0 && (
              <section className="empty">
                <Icon name={active.kind === 'pet' ? 'paw' : 'pill'} size={40} />
                <h2>No medicines yet</h2>
                <p>Add the first one above. Brand names, generic names, and doses all work.</p>
              </section>
            )}
            {!isExample && (
              <div className="manage">
                {profiles.length > 1 && <button className="link-btn danger" onClick={removeProfile}><Icon name="trash" size={16} /> Remove {active.name}'s profile</button>}
              </div>
            )}
          </>
        )}

        {route === 'today' && <Today profiles={profiles} onGoToList={() => (location.hash = '#/')} />}
        {route === 'questions' && <QuestionSheet profile={active} onGoToList={() => (location.hash = '#/')} />}
        {route === 'about' && <CaseStudy />}

        <footer className="disclaimer">
          <Icon name="shield" size={18} />
          <p><strong>Not medical or veterinary advice.</strong> MedClear explains public FDA and NIH information, keeps a schedule you enter, and suggests questions. Always talk to a doctor, pharmacist or vet before changing any medicine. In an emergency, call 911 or your emergency vet.</p>
        </footer>
      </main>

      <nav className="tabs bottom" aria-label="Main">
        {tabs.map((t) => (
          <a key={t.r} href={href(t.r)} aria-current={route === t.r ? 'page' : undefined}>
            <span className="tab-icon"><Icon name={t.icon} size={22} />{t.badge ? <i>{t.badge}</i> : null}</span>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
