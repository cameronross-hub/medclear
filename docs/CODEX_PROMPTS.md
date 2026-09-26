# Codex playbook for MedClear

How Cameron uses Codex as the **independent reviewer and second builder** on a repo that Claude Code built. Paste each prompt as written. Each step says what to look for before moving on.

**The workflow in one line:** Claude Code builds → Codex reviews (read-only) → Claude Code fixes → Codex re-reviews the fix → Codex builds one feature on its own branch and opens a PR → Cameron reviews and merges.

---

## 0. One-time setup (about 5 minutes)

```bash
cd path/to/medclear
git pull                 # make sure you're on the latest main
codex                    # first run: choose "Sign in with ChatGPT" and log in yourself
```
- Codex reads **`AGENTS.md`** automatically. That file holds the project rules, commands and review checklist, so you don't need to repeat them in prompts.
- **For review steps, keep Codex read-only.** In the Codex session, use `/approvals` (or `/permissions`, depending on version) and choose **Read Only**. Switch to a write-enabled mode only for step 4. Run `codex --help` if a command name has changed in your version.
- `/review` is Codex's built-in code-review command. Prompt 2 below is a more thorough, project-specific version of it.
- Use the strongest model available on your plan, with high reasoning effort, for reviews (`/model`).

---

### Using the Codex Mac app instead of the terminal (what Cameron uses)
1. Open the Codex app and **Sign in with ChatGPT**.
2. Start a project on your local `medclear` folder (the repo root, so `AGENTS.md` is picked up).
3. Run threads **Local** (not Cloud or Worktree) for review steps, so `REVIEW.md` lands in this folder and `gh` acts as `cameronross-hub`.
4. Set the permission control near the message box to **Read only** for steps 1, 2 and 4, and allow edits only for step 5.
5. Choose the strongest model with high reasoning effort. Prompts below paste in unchanged.

---

## 1. Orientation (read-only, about 3 minutes)
Use this first, so Codex builds a mental model before judging anything.

```text
Read AGENTS.md, README.md, package.json, vite.config.ts and everything under src/.
Do not change any files.

Then give me:
1. A 6–8 sentence summary of what this app does, who it's for, and its hard rules.
2. A diagram (ASCII is fine) of the data flow from "user types a drug name" to "card rendered" to "question sheet", naming the functions and files involved.
3. The five places you think bugs are most likely to hide, and why.
Keep it concise. I'll ask for the full review next.
```
**Look for:** does it correctly restate the hard rules ($0, privacy, not medical advice, no fabricated data, cited sources, accessibility)? If not, it didn't read AGENTS.md. Say "re-read AGENTS.md."

---

## 2. Full independent code review → `REVIEW.md` (read-only, 10–20 minutes)

```text
You are the independent reviewer for this repo. Another agent (Claude Code) wrote it.
Your job is to find real problems, not to praise or restyle. Do NOT modify source files.

Run: npm ci (if needed), npm run build, npm run lint, npm test. Report the results.

Then review the whole codebase against the "Review checklist" and "Hard rules" in AGENTS.md,
plus these focus areas:

A. Medical safety & copy
   - Any text that could read as medical advice, dosing guidance, or a recommendation to
     start/stop/change a medicine (UI copy, plain-language.json, generated questions).
   - Spot-check at least 15 entries in src/data/plain-language.json against the openFDA label
     (https://api.fda.gov/drug/label.json?search=openfda.generic_name:"NAME"&limit=1) and flag
     anything inaccurate, outdated, or overstated. Quote the label text you compared against.
B. Data correctness & API edge cases (src/api, src/lib/resolve.ts)
   - openFDA 404 = "no results" handling; 429 rate limits; timeouts; network offline.
   - Salt forms and brands (e.g. "metformin hydrochloride", "Toprol XL", "Eliquis"),
     misspellings ("metforman", "eliqis"), combination products ("Entresto", "amlodipine/benazepril"),
     OTC drugs ("ibuprofen"), nonsense ("asdfgh"). Actually call the live APIs for these
     and tell me what the app would show for each.
   - Is the recall filter (ongoing, last 2 years, single-ingredient) correct? Any false
     "No active recalls found"?
   - cleanSection / boxedHeadline regexes: find label texts where they produce wrong output.
C. React state & async
   - Races: a card removed or retried while its lookup is in flight; duplicate lookups under
     StrictMode; stale closures; localStorage failures; example-list → own-list transitions.
D. Accessibility (users skew older)
   - Combobox ARIA pattern in MedInput, focus management, keyboard-only use, 48px touch
     targets, color contrast in BOTH light and dark themes (compute ratios for the
     warn/crit/ok pill colors), screen-reader names for icon buttons, details/summary use.
E. PWA & deploy
   - manifest scope/start_url with base "/medclear/", icon purposes, service-worker caching
     (does NetworkFirst cache openFDA 404s or errors in a harmful way?), update behavior,
     iOS standalone quirks, GitHub Pages workflow correctness.
F. Privacy & security
   - Anything that leaks the medication list (URLs, referrers, third-party requests beyond
     the four documented APIs + Google Fonts), unsafe HTML, target=_blank without rel.
G. Code quality
   - Dead code, duplicated logic, missing tests for important branches.

Write your findings to a new file REVIEW.md (this is the only file you may create) with:
- A summary table: #, severity (Critical / High / Medium / Low / Nit), area, file:line, one-line title.
- For each finding: what's wrong, a concrete repro (input → actual vs expected), why it
  matters for a caregiver, and a suggested fix (describe it or show a short diff; don't apply it).
- A section "Verified OK" listing the checklist items you confirmed and how.
- A section "Test gaps": specific test cases you'd add.
Order by severity. Only include issues you are confident about. Mark anything uncertain as
"Needs confirmation" with what would confirm it.
```
**Look for:** concrete repros with file:line, not vague advice. If a finding says "consider…" without a repro, ask: "Show me the input that triggers it, or drop it."

Then commit the review so it shows up in the build log:
```bash
git add REVIEW.md && git commit -m "docs: independent code review by Codex" && git push
```

---

## 3. Hand the review to Claude Code (in Claude Code, not Codex)

```text
Codex wrote an independent review in REVIEW.md. For each finding:
- Critical/High/Medium: fix it, with a test where possible.
- Low/Nit: fix it if it takes under 10 minutes, otherwise explain why we're deferring it.
- If you disagree with a finding, don't fix it. Explain why in REVIEW.md under the finding
  ("Claude Code response: ...").
Keep npm run build, lint and test green. Commit fixes on a branch fix/codex-review-1 with
Conventional Commit messages that reference the finding number (e.g. "fix: handle 429 from openFDA (REVIEW #3)"),
then open a PR to main and summarize what was fixed, deferred, or disputed.
```

---

## 4. Codex re-reviews the fixes (read-only)

```text
Claude Code addressed REVIEW.md on branch fix/codex-review-1. Check out that branch and review
ONLY the diff against main (git diff main...fix/codex-review-1).
For each finding in REVIEW.md, mark: Fixed ✅ / Partially fixed ⚠️ / Not fixed ❌ / Disputed (agree or disagree?).
Flag any regressions or new issues the fixes introduced. Run build, lint and test.
Post your verdict as a PR review comment with gh:
  gh pr review <PR number> --comment --body "<your verdict>"
If everything is fixed, finish with "LGTM from Codex". Do not approve on GitHub; Cameron merges.
```

---

## 5. Codex builds one feature and opens its own PR (write mode)
Switch Codex to a mode that can edit files and run commands, then paste:

```text
Build this feature on a new branch codex/print-and-text-size, following every rule in AGENTS.md.

Feature: "Appointment-ready printing + adjustable text size"
1. Print layout for the Questions page (#/questions), for a caregiver bringing it to a visit:
   - A header with "Questions for my appointment", today's date, and blank lines for
     "Patient", "Doctor/clinic" and "Date of visit" (to fill in by pen, not typed, for privacy).
   - The medicine list as a compact row; each included question with an empty checkbox square
     and two ruled lines under it for writing the answer.
   - Excluded (unchecked) questions don't print. No nav, buttons or tags. Page breaks never split
     a question from its answer lines. Black-and-white friendly; 13–14pt text.
   - A one-line footer with the "not medical advice" disclaimer and the app URL.
2. Text-size control (A / A+ / A++) available on every page (in the top bar on desktop and a
   compact control on mobile), scaling the whole UI via a CSS custom property. Persist the
   choice in localStorage wrapped in try/catch; respect it on reload. Accessible name and
   pressed state on each option. Must not break the layout at 375px width at the largest size.
3. Tests: unit-test any pure helpers you add. Keep npm run build, lint (0 warnings) and test green.
4. Update AGENTS.md (structure section and anything else that changed) and README.md if needed.
5. Commit with Conventional Commits and include "(Codex)" in each commit subject,
   e.g. "feat: printable appointment sheet (Codex)". The app's build log uses this to credit you.
6. Push the branch and open a PR to main with gh:
   gh pr create --base main --head codex/print-and-text-size --title "feat: appointment-ready printing and text size (Codex)" --body-file <file>
   The PR body should have: Summary, Screenshots/notes on how you verified (desktop, 375px,
   print preview), Checklist from AGENTS.md with each item ticked or explained, and Risks.
Do not merge the PR.
```
**Look for:** it actually ran the checks, the PR body has the checklist, and the commit subjects include "(Codex)". Then in the browser, open the Pages preview or `npm run dev`, try print preview (⌘P) and the text sizes at phone width, and merge on GitHub if it's good.

---

## 6. (Optional) Ask Claude Code to review Codex's PR
A cross-review makes a good story: each agent reviewed the other's work.
```text
Review PR "feat: appointment-ready printing and text size (Codex)" against AGENTS.md.
Check it out, run build, lint and test, check print preview and 375px layout, and leave a
gh pr review comment with findings ranked by severity. Don't push changes to Codex's branch.
```

---

## How to talk about this project
- "I used two AI agents with a **shared instruction file** (AGENTS.md) so they followed the same product rules: privacy, no medical advice, cite sources."
- "Claude built, **Codex reviewed independently**, and I made the calls when they disagreed. Like a PM with two engineers, I owned the *what* and *why*, and they handled the *how*."
- "The review found [pick 1–2 real findings from REVIEW.md], which I would have missed."
- "Every AI-drafted summary is labeled, links to the FDA label, and has 'human review pending'. In a real product that becomes a pharmacist-review step."
