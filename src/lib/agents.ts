export type Agent = 'Claude Code' | 'Codex' | 'Cameron'

/** Attribute a commit or PR to the agent that made it, from its message, branch or co-author trailer. */
export function agentOf(text: string): Agent {
  if (/codex/i.test(text)) return 'Codex'
  if (/claude/i.test(text)) return 'Claude Code'
  return 'Cameron'
}
