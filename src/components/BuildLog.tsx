import { useEffect, useState } from 'react'
import { getJson } from '../api/http'
import type { Agent } from '../lib/agents'
import { agentOf } from '../lib/agents'
import { Icon } from './Icon'

const REPO = 'cameronross-hub/medclear'

interface Commit { sha: string; html_url: string; commit: { message: string; author: { date: string } } }
interface Pull { number: number; title: string; html_url: string; state: string; merged_at: string | null; created_at: string; head: { ref: string }; user: { login: string } }

type Entry = { kind: 'commit' | 'pr'; date: string; title: string; url: string; agent: Agent; meta: string }


export function BuildLog() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      getJson<Commit[]>(`https://api.github.com/repos/${REPO}/commits?per_page=40`),
      getJson<Pull[]>(`https://api.github.com/repos/${REPO}/pulls?state=all&per_page=20`).catch(() => [] as Pull[]),
    ])
      .then(([commits, pulls]) => {
        const c: Entry[] = commits.map((x) => ({
          kind: 'commit',
          date: x.commit.author.date,
          title: x.commit.message.split('\n')[0],
          url: x.html_url,
          agent: agentOf(x.commit.message),
          meta: x.sha.slice(0, 7),
        }))
        const p: Entry[] = pulls.map((x) => ({
          kind: 'pr',
          date: x.created_at,
          title: x.title,
          url: x.html_url,
          agent: agentOf(`${x.head.ref} ${x.title}`),
          meta: `#${x.number} · ${x.merged_at ? 'merged' : x.state}`,
        }))
        setEntries([...c, ...p].sort((a, b) => b.date.localeCompare(a.date)))
      })
      .catch(() => setError(true))
  }, [])

  if (error) return <p className="muted">The build log couldn't load from GitHub right now (it's rate-limited to 60 requests an hour). <a href={`https://github.com/${REPO}/commits/main`}>View commits on GitHub</a>.</p>
  if (!entries) return <div className="skeleton" />

  const counts = { commits: entries.filter((e) => e.kind === 'commit').length, prs: entries.filter((e) => e.kind === 'pr').length, codex: entries.filter((e) => e.agent === 'Codex').length }
  return (
    <>
      <div className="mini-stats">
        <div><b>{counts.commits}</b><span>commits</span></div>
        <div><b>{counts.prs}</b><span>pull requests</span></div>
        <div><b>{counts.codex}</b><span>by or reviewed by Codex</span></div>
      </div>
      <ol className="log">
        {entries.slice(0, 25).map((e) => (
          <li key={e.kind + e.url}>
            <span className={`agent ${e.agent.split(' ')[0].toLowerCase()}`}>{e.agent}</span>
            <a href={e.url} target="_blank" rel="noreferrer">{e.kind === 'pr' ? <Icon name="git" size={14} /> : null} {e.title}</a>
            <span className="muted small">{e.meta} · {new Date(e.date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </li>
        ))}
      </ol>
    </>
  )
}
