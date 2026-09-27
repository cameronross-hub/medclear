import { useState } from 'react'
import type { Profile, ProfileKind } from '../lib/types'
import { Icon } from './Icon'

export function Avatar({ p, size = 36 }: { p: Pick<Profile, 'name' | 'kind'>; size?: number }) {
  return (
    <span className={`avatar-chip ${p.kind}`} style={{ width: size, height: size }} aria-hidden="true">
      {p.kind === 'pet' ? <Icon name="paw" size={Math.round(size * 0.55)} /> : p.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

const KINDS: { k: ProfileKind; label: string }[] = [
  { k: 'self', label: 'Me' },
  { k: 'person', label: 'Family member' },
  { k: 'pet', label: 'Pet' },
]

export function ProfileBar({
  profiles,
  activeId,
  onSelect,
  onAdd,
}: {
  profiles: Profile[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: (p: { name: string; kind: ProfileKind; species?: string }) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ProfileKind>('person')
  const [species, setSpecies] = useState('dog')
  const hasSelf = profiles.some((p) => p.kind === 'self')

  const submit = () => {
    const n = kind === 'self' ? 'Me' : name.trim()
    if (!n) return
    onAdd({ name: n, kind, species: kind === 'pet' ? species.trim() || undefined : undefined })
    setAdding(false)
    setName('')
  }

  return (
    <div className="profiles">
      <div className="profile-row" role="tablist" aria-label="Whose medicines">
        {profiles.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === activeId} className="profile-chip" onClick={() => onSelect(p.id)}>
            <Avatar p={p} size={30} />
            <span className="pc-name">{p.name}{p.kind === 'pet' && p.species ? <small> · {p.species}</small> : null}</span>
            <span className="pc-count">{p.meds.length}</span>
          </button>
        ))}
        <button className="profile-chip add" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
          <span className="avatar-chip add" aria-hidden="true"><Icon name="plus" size={16} /></span>
          <span className="pc-name">Add person or pet</span>
        </button>
      </div>

      {adding && (
        <form className="add-profile" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset>
            <legend>Who takes these medicines?</legend>
            <div className="seg">
              {KINDS.map((k) => (
                <label key={k.k} className={kind === k.k ? 'on' : ''}>
                  <input type="radio" name="kind" value={k.k} checked={kind === k.k} disabled={k.k === 'self' && hasSelf} onChange={() => setKind(k.k)} />
                  {k.k === 'pet' ? <Icon name="paw" size={16} /> : <Icon name="user" size={16} />} {k.label}
                </label>
              ))}
            </div>
          </fieldset>
          {kind !== 'self' && (
            <div className="add-fields">
              <label>
                Name
                <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'pet' ? 'e.g. Buddy' : 'e.g. Dad, Mom, Grandma'} autoFocus />
              </label>
              {kind === 'pet' && (
                <label>
                  Animal
                  <input id="profile-species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="dog, cat…" />
                </label>
              )}
            </div>
          )}
          <div className="add-actions">
            <button className="btn primary" type="submit" disabled={kind !== 'self' && !name.trim()}>Add profile</button>
            <button className="btn" type="button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
