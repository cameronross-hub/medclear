import { useId, useState } from 'react'
import { suggest } from '../lib/plain'
import { Icon } from './Icon'

export function MedInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)
  const listId = useId()
  const options = suggest(value)

  const submit = (v: string) => {
    const t = v.trim()
    if (!t) return
    onAdd(t)
    setValue('')
    setActive(-1)
  }

  return (
    <form
      className="med-input"
      onSubmit={(e) => {
        e.preventDefault()
        submit(active >= 0 ? options[active].value : value)
      }}
    >
      <label htmlFor="med-name">Add a medicine</label>
      <div className="med-input-row">
        <div className="combo">
          <input
            id="med-name"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setActive(-1)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, options.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, -1))
              } else if (e.key === 'Escape') setValue('')
            }}
            placeholder="e.g. metformin, Eliquis, Lipitor 20 mg"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          />
          {options.length > 0 && (
            <ul className="suggestions" id={listId} role="listbox">
              {options.map((o, i) => (
                <li
                  key={o.label}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    submit(o.value)
                  }}
                >
                  <Icon name="pill" size={16} /> {o.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn primary" type="submit" disabled={!value.trim()}>
          <Icon name="plus" size={18} /> Add
        </button>
      </div>
      <p className="hint">Type a brand or generic name. Spelling doesn't have to be perfect. Doses are fine to include.</p>
    </form>
  )
}
