export type Agent = 'Claude Code' | 'Codex' | 'Cameron'

/**
 * Attribute a commit or PR from explicit markers only, so a message that merely mentions a tool isn't miscredited:
 * Codex = "(Codex)" in the subject, a codex/ branch, or "by Codex"; Claude Code = its Co-Authored-By trailer.
 */
export function agentOf(text: string): Agent {
  if (/\(codex\)|(^|\s)codex\/|\bby codex\b/i.test(text)) return 'Codex'
  if (/co-authored-by:\s*claude/i.test(text)) return 'Claude Code'
  return 'Cameron'
}
