# MedClear

**What's this pill for, and when do I take it?** MedClear is a free, private web app for managing medicines at home, for yourself, a parent, or a pet. Add a profile for each person or animal, type in their medications, and get:

- a plain-language card for each medicine: what it's for, what to watch for, FDA boxed warnings, active recalls, and links to the official label;
- a printable **question sheet** for the next appointment, addressed to the doctor, or to the vet for pets;
- dose times and **how-to-take** instructions (with food, empty stomach…) that you enter from the label;
- a **Today** checklist of every dose, across everyone you care for.

It installs on a phone like an app and works offline for lists you've already looked up.

**Live app:** https://cameronross-hub.github.io/medclear/ · **Case study:** https://cameronross-hub.github.io/medclear/#/about

> Not medical advice. MedClear explains public FDA and NIH information and suggests questions. It never tells anyone to start, stop, or change a medicine.

## Install it on your phone
- **iPhone (Safari):** open the live link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, then tap **Install app** (or ⋮, then **Add to Home screen**).

## Why it exists
Adults coordinating a parent's care often face a bag of prescriptions from several doctors, jargon-heavy labels, and a 15-minute appointment in which they forget half their questions. MedClear does one translation job well: turning a list of drug names into understanding and good questions. It's a small version of what a patient advocate does.

## How it works
| Step | Source (all free, no API key) |
|---|---|
| Normalize any spelling or brand to an ingredient | NIH RxNorm (RxNav) |
| Uses, boxed warnings, label interaction text | openFDA drug labels |
| Active recalls (last 2 years) | openFDA enforcement reports |
| Patient-education links | NIH MedlinePlus Connect |
| Plain-language summaries for 60 common Medicare drugs | Drafted with AI at build time from FDA labeling, stored as static JSON, human review pending |

Everything runs in the browser. There's no backend, no accounts, and no analytics. The only data sent anywhere is drug names, which go to the public APIs above.

## Built by two AI agents and one PM
- **Claude Code** planned and built the app and its tests.
- **Codex** independently reviewed the code and shipped a feature through its own pull request.
- **Cameron Ross** made the product decisions, reviewed, and merged.

Both agents share one instruction file, [`AGENTS.md`](AGENTS.md). [`CLAUDE.md`](CLAUDE.md) simply points to it. The prompts given to Codex are in [`docs/CODEX_PROMPTS.md`](docs/CODEX_PROMPTS.md).

## Develop
```bash
npm install
npm run dev      # http://localhost:5173/medclear/
npm test
npm run lint
npm run build
```
Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
