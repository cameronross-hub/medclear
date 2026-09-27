const paths = {
  pill: 'M10.5 20.5 3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7Z M8.5 8.5l7 7',
  alert: 'M12 3 2 21h20L12 3Z M12 10v5 M12 18h.01',
  recall: 'M4 4h16v6H4z M6 10v10h12V10 M10 14h4',
  check: 'M4 12.5 9.5 18 20 6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 11v6 M12 7.5h.01',
  book: 'M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Z M4 19a2 2 0 0 1 2-2h14',
  print: 'M6 9V3h12v6 M6 18H4v-7h16v7h-2 M7 14h10v7H7z',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  plus: 'M12 5v14 M5 12h14',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01',
  question: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5 M12 17.5h.01',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21a8 8 0 0 1 16 0',
  git: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 9a9 9 0 0 1-9 9',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z M9 12l2 2 4-4',
  paw: 'M12 13c-3 0-5 2.6-5 4.6 0 1.5 1.2 2.4 2.6 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.9 2.6-2.4 0-2-2-4.6-5-4.6Z M5.5 12.5a1.7 2.1 0 1 0 0-4.2 1.7 2.1 0 0 0 0 4.2Z M9.3 8.3a1.7 2.1 0 1 0 0-4.2 1.7 2.1 0 0 0 0 4.2Z M14.7 8.3a1.7 2.1 0 1 0 0-4.2 1.7 2.1 0 0 0 0 4.2Z M18.5 12.5a1.7 2.1 0 1 0 0-4.2 1.7 2.1 0 0 0 0 4.2Z',
  bulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 7v5l3 2',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h3',
  x: 'M6 6l12 12 M18 6 6 18',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="icon"
    >
      <path d={paths[name]} />
    </svg>
  )
}
