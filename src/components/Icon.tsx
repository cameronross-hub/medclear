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
