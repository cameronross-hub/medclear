export class NotFoundError extends Error {}

/** GET JSON with a timeout. openFDA returns 404 for "no results", so callers can catch NotFoundError. */
export async function getJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (res.status === 404) throw new NotFoundError(url)
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}
