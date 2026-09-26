# AGENTS.md — MedClear

Single source of truth for every coding agent on this repo (Codex reads this file directly; Claude Code reads it via `CLAUDE.md`). Keep it current: when a command, convention, or decision changes, update this file in the same commit.

## What this is
MedClear is a free, privacy-first web app that helps **Medicare-age patients and their caregivers understand a medication list**. A caregiver types in a parent's medications and gets plain-language cards (what it's for, key warnings, recall status, where to learn more) plus a printable "Questions for your advocate or doctor" sheet.

It is a healthcare product portfolio project by Cameron Ross (GitHub: `cameronross-hub`). It has to work as a product and also show product thinking. The `/case-study` page is part of the deliverable.

**Persona:** Linda, 48, coordinating care for her father (74, eight daily medications, Medicare Advantage). She is not clinical. She needs to understand what each drug is for and what to ask at the next appointment.

## Hard rules
1. **$0 to run.** No paid APIs, no API keys, no runtime LLM calls. AI-written content is generated at build time, reviewed, and committed as static JSON.
2. **Privacy.**
   - Everything runs client-side.
   - No personal data in URLs or query strings, no analytics trackers, no server-side storage.
   - `localStorage` is optional convenience only: wrap it in try/catch and offer a "Clear my list" control.
3. **Not medical advice.**
   - Every results view shows a clear disclaimer.
   - Never tell the user to start, stop or change a dose.
   - Frame everything as "questions to ask your doctor, pharmacist, or advocate."
4. **No fabricated data.**
   - Never invent usage metrics, testimonials or outcomes.
   - Illustrative numbers in the case study must be labeled "illustrative."
   - The build log uses real GitHub API data.
5. **Cite sources.** Every drug card links to the source it came from (openFDA label set ID, MedlinePlus page).
6. **Accessibility is a feature.** Users skew older.
   - Base font ≥ 18px, WCAG AA contrast, full keyboard support, visible focus, `prefers-reduced-motion` respected.
   - The print view must be legible in black and white.

## Stack and commands
- Vite + React 19 + TypeScript (strict). Plain CSS with custom properties in `src/index.css` (light + dark via `prefers-color-scheme`, print styles at the bottom); no UI framework.
- **Installable PWA** via `vite-plugin-pwa` (config in `vite.config.ts`): manifest, icons in `public/`, service worker precaches the app shell and NetworkFirst-caches RxNav/openFDA/MedlinePlus responses so lists already looked up work offline.
- Routing is hash-based (`#/`, `#/questions`, `#/about`) so GitHub Pages needs no 404 fallback.
- Deployed to GitHub Pages by GitHub Actions on push to `main` (`.github/workflows/deploy.yml`). Vite `base` is `/medclear/`.
- Node ≥ 20.

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build (must pass before any PR)
npm run lint       # oxlint (config: .oxlintrc.json) — must report 0 warnings
npm test           # vitest unit tests (src/lib/lib.test.ts: API parsers, lookup, question sheet)
npx pwa-assets-generator   # regenerate app icons from public/favicon.svg
```
*(Update this block if scripts change.)*

## Data sources (all free, no key)
| Need | Source | Notes |
|---|---|---|
| Normalize a drug name / autocomplete | RxNav `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=` and `/drugs.json?name=` | Handle misspellings; map to RxCUI + ingredient |
| Label content (indications, boxed warning, warnings, interactions text) | openFDA `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"X"&limit=1` | Rate limit ~240 req/min without key; cache per session |
| Recalls | openFDA `https://api.fda.gov/drug/enforcement.json?search=openfda.generic_name:"X"` | Show only recent/ongoing; 404 means none found |
| Patient education links | MedlinePlus Connect `https://connect.medlineplus.gov/service?mainSearchCriteria.v.cs=2.16.840.1.113883.6.88&mainSearchCriteria.v.c=<RxCUI>&knowledgeResponseType=application/json` | |
| Plain-language summaries | `src/data/plain-language.json` (build-time, ~100 common Medicare Part D drugs) | Each entry has `generic`, `whatItsFor`, `commonSideEffects`, `askAbout[]`, `sources[]`, `reviewedAt` |
| Data freshness | openFDA `meta.last_updated` | Shown on `/case-study` |

- **The RxNav drug-interaction API was retired in Jan 2024. Do not use it or claim interaction checking.** The app may show the label's "Drug interactions" section text verbatim, clearly attributed.
- **Verify CORS before depending on any new endpoint.** If one blocks browser requests, add a minimal serverless proxy and document it here.

## Structure
```
src/
  api/          http.ts (fetch + timeout, NotFoundError), rxnav.ts, openfda.ts, medlineplus.ts
  data/         plain-language.json   (60 curated drugs; meta.humanReview = "pending")
  lib/          plain.ts (lookup/normalize/suggest), resolve.ts (one med -> card data),
                questions.ts (question sheet), agents.ts (build-log attribution), types.ts, lib.test.ts
  components/   Icon, MedInput (combobox), MedCard (pharmacy-label card), QuestionSheet, BuildLog
  pages/        CaseStudy.tsx
  App.tsx       routes, list state, localStorage, example list, summary row, bottom tab bar (mobile)
```
- **CORS verified (2026-09-25):** RxNav, openFDA and MedlinePlus Connect all return `access-control-allow-origin: *`. No proxy needed.
- openFDA returns **404 for "no results"**, which is expected. Browser consoles will show these as errors for drugs with no recalls. `getJson` maps a 404 to `NotFoundError`.

## Product principles (guide every UI and copy decision)
- **Write from the caregiver's side.** Use plain words at a reading level of grade 8 or below, and explain any jargon inline ("boxed warning: the FDA's strongest safety warning").
- **Show the summary before the detail.** Put the one-line "what it's for" first, then warnings, then source text in a disclosure.
- **Label every state.** Loading, "we couldn't find that name, did you mean…", no recalls found, and API down each get explicit copy. There are no blank states.
- **Mind the order of the question sheet.** It is the North Star output ("caregivers who leave with a question sheet"), so optimize the path to it.

## `/case-study` page (the PM showcase)
- **Problem, persona and a one-page PRD:** goals, non-goals, requirements, risks.
- **Metrics framework:** a North Star plus input metrics and guardrails, labeled "planned instrumentation." There are no fake numbers.
- **Live build log:** commits and PRs from the public GitHub API (`/repos/cameronross-hub/medclear/commits`, `/pulls?state=all`). Tag each item by author (Claude Code or Codex).
- **Roadmap:** how this could plug into a care-navigation or patient-advocate workflow.

## Git and multi-agent workflow
- The repo is `cameronross-hub/medclear`, a personal account. **Never use a student account (`cameronross123`).** The git identity (`334021531+cameronross-hub@users.noreply.github.com`) and credential helper (`!gh auth git-credential`) are set repo-locally, so `git push` and `gh` both act as `cameronross-hub`. If a push is denied to another account, check `gh auth status` rather than changing global git config.
- **Claude Code builds.** It works on feature branches (`feat/...`), merges to `main` after `npm run build` passes, and uses Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- **Codex reviews:**
  - Review any branch or PR against the checklist below and report findings as PR review comments or `REVIEW.md` notes, ordered by severity.
  - Codex may also build one self-contained feature on its own branch (`codex/...`) and open a PR. Claude Code or Cameron merges it.
- Don't rewrite history on `main`. Don't commit secrets. `.env*` is gitignored and should never be needed.

### Review checklist (Codex and Claude)
- [ ] Any hard-rule violation: cost, privacy, medical advice, fabricated data, missing citation.
- [ ] API failure paths: network error, 404, empty results, misspelled input, rate limit.
- [ ] Types: no `any` in API parsers, and responses are validated before use.
- [ ] Accessibility: labels, focus order, contrast, screen-reader names on icon buttons.
- [ ] The print view works.
- [ ] Mobile layout at 375px.
- [ ] `npm run build`, `npm run lint` and `npm test` all pass.

## Definition of done (per feature)
The build, lint and tests pass. The feature has been checked manually in the browser at desktop and 375px. Error states are covered. This file is updated if anything it describes changed.
