# design.md — PS241 Script Ideation Assistant

**This document is the authoritative engineering context for the project.** Per `CLAUDE.md`, it must be read before any work begins and updated before any response ends. Do not re-audit the repository if this document already answers the question.

---

## 1. Project Overview

PS241 — Script Ideation Assistant is a GenAI-powered tool that generates multiple logically-consistent plot variants from a single creative brief, under simultaneous, structured constraints (genre, audience, budget, runtime, region, language, censorship, production limits). Full requirements live in `PS241_Script_Ideation_Assistant_Project_Plan.md` (the source project plan — treat as read-only requirements input, not a living doc).

This project is being executed by a single developer + Claude Code, not the 7–9 person team the source plan assumes. Team-ownership columns in the source plan are informational only; all roles are performed by this pairing. Phase 0 (team kickoff, GPU procurement, multi-day PRD sign-off ritual) was explicitly skipped by user instruction — we started execution at Phase 1. Where Phase 1 tasks have a hard dependency on a Phase 0 deliverable, we produce a lean version of that deliverable inline and log the justification in the Development Log below, rather than skipping the dependency.

**Architecture redesign (post-Phase-1):** after Phase 1 wireframes were reviewed, the user commissioned a ground-up redesign — a production-grade design system and a real backend (Postgres as single source of truth, BFF architecture), rather than incrementally patching the Phase 1 wireframe. Full proposal, rationale, and approval record: `/home/samarth/.claude/plans/foamy-tinkering-wreath.md`. This superseded the source plan's original Phase 2 (Backend) / Phase 3 (Frontend) split with a unified **Phase 2 — Platform Foundation & Redesign** (see §12). The one constraint carried forward from the source plan: NIM/NeMo Guardrails/Triton/TensorRT-LLM remain graded deliverables, resolved via a **hybrid architecture** (Next.js BFF + a separate internal Python AI service) — see DD-007.

## 2. Current Architecture

**Target architecture (approved, being built incrementally — see §12/§13 for what's actually live today):**

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│   Browser (Next.js   │  HTTP  │  Next.js BFF               │  HTTP  │  AI Service       │
│   client components) │───────▶│  (Route Handlers, Vercel)  │───────▶│  (FastAPI, Python)│
│                       │◀───────│  - Better Auth              │◀───────│  - NIM client      │
│  TanStack Query,      │        │  - Prisma → Postgres        │        │  - NeMo Guardrails │
│  React Hook Form,     │        │  - Zod validation            │        │  - constraint       │
│  Motion, shadcn/ui    │        │  - business logic             │        │    validation        │
└─────────────────────┘        │  - PostHog, Pino logging     │        │  - (later) Triton /  │
                                 └──────────────────────────┘        │    TensorRT-LLM      │
                                                                       └─────────────────┘
```

**Boundary rules:** the browser only ever talks to Next.js Route Handlers — never Postgres, the AI service, or NIM directly. The Next.js BFF never calls NIM directly either — only the AI service does, server-to-server, over a shared-secret-protected internal API. This keeps Triton/TensorRT-LLM addable later without touching the product layer (full rationale in the approved plan, §2).

**What's actually live right now (Foundation sub-milestone, in progress):** Prisma schema defined and validated against `prisma/schema.prisma` (not yet migrated to a real database — blocked on `frontend/.env` `DATABASE_URL`, see §7). Better Auth wired (email/password, org-per-user auto-provisioning via a database hook) but untested against a real DB for the same reason. Design tokens (color/typography/elevation) overhauled in `frontend/src/app/globals.css`. The AI service (`ai-service/`, evolved from `ai/eval/`) has not been started yet. The BFF API layer (Route Handlers for projects/briefs/variants) has not been started yet — `frontend/src/lib/mock-data.ts` is still the only data source the UI reads from.

Backend framework for the AI service is **FastAPI** (Python) — chosen for consistency with the existing `ai/eval/` code and native fit with NeMo Guardrails (Python library). Not yet built.

## 3. Repository Structure

```
project/
├── CLAUDE.md                          # Operating instructions for AI-assisted development (this workflow)
├── design.md                          # This file — authoritative engineering context
├── PS241_Script_Ideation_Assistant_Project_Plan.md   # Source requirements/plan (read-only input)
├── .gitignore
├── .env.example                       # Template for required secrets (NVIDIA_API_KEY, etc.) — placeholders only, see DD-013
├── .pre-commit-config.yaml            # Git hooks: gitleaks, detect-private-key, frontend eslint/tsc, ai ruff — DD-014
├── docs/
│   ├── constraint-taxonomy-v1.md      # CT-01..CT-08 — enumerated constraint values (Milestone 1.0)
│   ├── adr/                           # Architecture Decision Records (Phase 2+)
│   └── reports/                       # Generated evaluation/test reports (baseline eval, etc.)
├── schemas/                           # Shared data contracts (Variant Output Schema v1 — Milestone 1.2)
├── ai/                                # LLM baseline evaluation harness (Milestone 1.1) — will evolve into ai-service/ (see §12 Phase 2)
│   ├── eval/
│   └── prompts/                       # Prompt architecture / templates (Milestone 1.2)
└── frontend/                          # Next.js 16 BFF — Phase 1 wireframe screens still present, Phase 2 replaces them incrementally
    ├── .env.example                   # DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, AI_SERVICE_URL, AI_SERVICE_SHARED_SECRET
    ├── prisma/
    │   └── schema.prisma              # Postgres schema — User/Session/Account/Verification (Better Auth) + product domain (§ below)
    ├── prisma.config.ts               # Prisma 7 migration config (reads DATABASE_URL; schema.prisma has no `url` field — see DD-009)
    └── src/
        ├── app/                       # dashboard (/), /create, /variants, /variants/[id] (Phase 1, not yet rebuilt), /login, /signup (Phase 2), /api/auth/[...all]
        ├── components/                # app-shell, theme-provider, theme-toggle, query-provider, constraint-form, variant-card, variant-compare-table, export-dialog, refinement-panel, ui/ (shadcn primitives)
        ├── lib/                       # db.ts (Prisma singleton), auth.ts, auth-client.ts, validations/ (Zod), constraint-taxonomy.ts, types.ts, mock-data.ts (Phase 1 — being replaced by real API/DB in Phase 2)
        └── generated/prisma/          # Prisma Client output — generated, gitignored, do not hand-edit
```

## 4. Technology Stack

| Layer | Choice | Status |
|---|---|---|
| Frontend framework | Next.js (App Router, TypeScript) | Decided (DD-002) |
| UI component library | shadcn/ui (Base UI) + Tailwind CSS v4 | Decided (DD-002, DD-006) |
| **BFF / backend-for-frontend** | **Next.js Route Handlers, deployed on Vercel** | **Decided (DD-007), build not started** |
| Database | PostgreSQL (user-hosted instance) | Decided (DD-007), schema written, not migrated yet |
| ORM | Prisma 7 (driver-adapter model, `@prisma/adapter-pg`) | Decided (DD-007), wired (DD-009) |
| Auth | Better Auth (email/password v1) | Decided (DD-008), wired, not tested against real DB yet |
| Server state | TanStack Query | Decided (DD-007), provider wired, no queries yet |
| Forms | React Hook Form + Zod | Decided (DD-007), used in login/signup |
| Animation | Motion (Framer Motion) | Decided (DD-007), installed, not yet used |
| Analytics | PostHog | Decided (DD-007), not yet installed |
| Logging | Pino | Decided (DD-007), not yet installed |
| **AI orchestration language** | **Python 3.12, in a separate internal AI service** | Decided (DD-003, reaffirmed DD-007) |
| LLM provider | NVIDIA NIM (hosted, OpenAI-compatible API) | Decided (DD-003) |
| LLM client library | `openai` Python SDK, `base_url` pointed at NIM | Decided (DD-003) |
| AI service framework | FastAPI (Python) | Planned, Phase 2 sub-milestone "AI service evolution" — not started |
| Content policy layer | NeMo Guardrails | Planned, Phase 2 (AI service) |
| Inference scaling | Triton Inference Server | Planned, later (needs persistent GPU infra, addable without touching the BFF — DD-007) |
| Inference optimization | TensorRT-LLM | Planned, later (same note) |
| Version control | git, repo scoped to `project/` | Decided (DD-004) |

## 5. Design Decisions

**DD-001 — Monorepo layout (`frontend/`, `ai/`, `docs/`, `schemas/`) in a single repository.**
Rationale: at this project's scale (hackathon timeline, small team-of-two-in-practice), a monorepo keeps the shared `Variant Output Schema` (consumed by both the Python eval/backend code and the TypeScript frontend) in one place with one version history, avoiding cross-repo version-skew overhead that would slow iteration without adding real value at this scale.

**DD-002 — Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.**
Rationale: user-directed. shadcn/ui ships accessible, unstyled-by-default components that compose with Tailwind, letting a solo developer reach a polished, "aesthetic" UI without hand-building a design system — directly serves the Milestone 1.3 wireframe requirement for visual fidelity. Next.js App Router is chosen over Pages Router for its co-located layouts/loading states, which map cleanly onto the loading/error/empty states required by Phase 3 (US-05.4 style tasks in the source plan).

**DD-003 — AI orchestration in Python, using NIM's OpenAI-compatible API via the `openai` SDK rather than a NIM-specific or LangChain SDK.**
Rationale: NVIDIA NIM exposes an OpenAI-compatible `/v1/chat/completions` endpoint at `https://integrate.api.nvidia.com/v1`. Using the standard `openai` SDK with a `base_url` override keeps the Phase 1 evaluation harness dependency-light and provider-agnostic at the client level — swapping models (or even providers, for local dev without NIM) is a config change. Heavier integration (LangChain, NeMo microservices) can be layered in Phase 2 if orchestration complexity (retries, chaining) warrants it; introducing it now would be premature for a baseline eval script.

**DD-004 — New git repository initialized at `project/`, not reusing the pre-existing repo at the DataFiles drive root.**
Rationale: a `.git` directory was discovered at `/media/samarth/DataFiles/.git` (five levels above the project folder) with `core.worktree = D:/` — a stale artifact from when this drive was mounted as `D:\` under Windows (dual-boot environment). Every git command against it fails (`cannot chdir to 'D:/'`), and even if it worked, it scopes the *entire drive*, including unrelated files (e.g. `Digital_Cousin_IEEE_Paper.docx`), not just this project. It was left untouched; a fresh repo was initialized scoped to `project/` only. See Known Issues.

**DD-006 — shadcn/ui in this environment generates components on Base UI (`@base-ui/react`), not Radix, and Radix's `asChild` pattern does not exist here.**
Rationale: not a choice — a discovery. `npx shadcn@latest init` in this Next.js 16 / React 19 project scaffolded components backed by `@base-ui/react` (confirmed via `frontend/node_modules/@base-ui/react/docs/react/components/button.md`). Base UI replaces `asChild` with a `render` prop (`<Component render={<OtherTag />}>`), and its own docs explicitly say links should not be composed into `Button` via `render` — instead style the `<a>`/`Link` directly with the exported `buttonVariants()` helper. All "link that looks like a button" spots in the wireframes (`app-shell.tsx` links aside, `variant-card.tsx`, `variant-compare-table.tsx`, `variants/page.tsx`, `variants/[id]/page.tsx`, `app/page.tsx`) use `<Link className={buttonVariants({...})}>` accordingly. `DialogTrigger` uses the same `render` pattern (see `export-dialog.tsx`). Also note: Next.js 16's `AGENTS.md`/`CLAUDE.md` (auto-generated in `frontend/`) warns its own APIs diverge from older training data — `params` in dynamic routes are `Promise`-typed and must be `await`ed (used in `app/variants/[id]/page.tsx`), confirmed against the bundled docs at `frontend/node_modules/next/dist/docs/` before writing route code.

**DD-005 — Constraint Taxonomy v1 produced in Phase 1 Milestone 1.0 rather than Phase 0.**
Rationale: the source plan lists "Constraint taxonomy v1" as an explicit dependency for Phase 1's UI wireframe task, but it's nominally a Phase 0 deliverable. Since Phase 0 was explicitly skipped by user instruction, this is a genuine technical dependency gap, not a nice-to-have — wireframes and the output schema cannot be meaningfully designed without concrete constraint values. Produced a lean version (`docs/constraint-taxonomy-v1.md`) covering only what Phase 1 needs (enumerated values + codes), deferring the full Phase 0 ritual (team review, legal sign-off on censorship rules) as out of scope for a solo/hackathon execution.

**DD-007 — Hybrid architecture: Next.js BFF (Postgres/Prisma/Better Auth/TanStack Query/RHF/Motion/PostHog/Pino) + separate internal Python AI service, instead of either a pure Vercel-serverless stack or a pure Python backend.**
Rationale: the user requested a full architecture redesign toward a modern SaaS stack (full requested stack and reasoning captured in the approved plan). That stack's backend (Next.js Route Handlers on Vercel) is serverless and cannot host NVIDIA Triton Inference Server or run TensorRT-LLM optimization — both need persistent GPU infrastructure — and there is no JavaScript equivalent of NeMo Guardrails. But the source plan grades this project on exactly those four NVIDIA deliverables. Splitting the system into a product BFF (owns auth, DB, business logic, the whole requested TS-native stack) and a separate internal AI service (owns NIM, NeMo Guardrails now, Triton/TensorRT-LLM addable later without touching the BFF) satisfies both: the browser never talks to Postgres, the AI service, or NIM directly, only to the BFF (true BFF pattern, per the user's explicit requirement); and every hackathon-graded NVIDIA technology stays on the roadmap. Full proposal: `/home/samarth/.claude/plans/foamy-tinkering-wreath.md`. `ai/eval/` is not discarded — it's promoted into the new AI service's core + regression suite once that sub-milestone starts.

**DD-008 — Auth: Better Auth, email/password only for v1; org-per-user auto-provisioned via a `databaseHooks.user.create.after` hook, not a signup-page step.**
Rationale: user explicitly chose email/password-only for v1 (no OAuth app registration needed to get moving). The `Organization`/`OrganizationMember` schema exists from day one (see DD-007's plan, §4 Database Schema) so team collaboration is additive later, not a migration — but a real user still needs *some* org to own their projects immediately after signup. Doing this as a Better Auth database hook (`src/lib/auth.ts`) rather than a step inside the signup page guarantees it runs for every signup path (email/password now, OAuth later) with no chance of a future page forgetting to call it.

**DD-009 — Prisma 7's driver-adapter model: no `url` in `schema.prisma`'s `datasource` block; the runtime `PrismaClient` takes an explicit `adapter` (`@prisma/adapter-pg` + `pg`), and `prisma.config.ts` (not the schema file) supplies the connection string for `prisma migrate`.**
Rationale: not a choice — Prisma 7 (installed: 7.8.0) removed schema-level `datasource url` support (`prisma validate` fails with error code P1012 otherwise, confirmed directly). This is a genuine breaking change from Prisma 5/6 patterns likely present in training data — documented here so nobody "fixes" `src/lib/db.ts` back to the old pattern. `@prisma/adapter-pg` (node-postgres) works against any standard Postgres connection string (Neon, Supabase, RDS, etc.), so this doesn't lock us to a specific host.

**DD-010 — Better Auth's `User`/`Session`/`Account`/`Verification` Prisma models were generated via `npx @better-auth/cli generate` against our actual `src/lib/auth.ts` config, not hand-typed from memory.**
Rationale: guessing Better Auth's expected field set (e.g. whether `Account` needs `idToken`, whether `Verification` needs `updatedAt`, whether IDs use a Prisma `@default` or are supplied by Better Auth itself) risks a subtle runtime mismatch the adapter can't recover from. Ran the CLI against a dummy `DATABASE_URL` (schema generation doesn't need a live connection) and diffed its output against a hand-written first draft — three real differences were caught this way (`User.name` required not optional, `Account.idToken` missing, `Verification.updatedAt` missing) and fixed before ever running a migration.

**DD-011 — Design system: single vivid accent (violet/indigo `--primary`) plus one reserved warm accent (`--accent-warm`, amber) for "featured/best-fit" signals only; dark-first theming; explicit 7-level typography scale as Tailwind v4 `@utility` classes rather than ad hoc sizes.**
Rationale: per the approved plan's design-system section — a single confident accent (not several decorative ones) is what separates Linear/Raycast/Stripe-tier interfaces from a "colorful dashboard." `next-themes` was already a latent, unwired dependency (pulled in transitively by shadcn's `sonner` component, which calls `useTheme()`); this DD is also the fix for that gap — a real `ThemeProvider` (`src/components/theme-provider.tsx`) and toggle (`theme-toggle.tsx`) are now wired in `layout.tsx`, defaulting to dark per "dark-first, like Linear/Raycast/Cursor."

**DD-012 — The shadcn "form" registry component is an empty stub in this Base UI-based shadcn fork (confirmed: `npx shadcn add form` and `shadcn view form` both return no files/dependencies). React Hook Form is wired directly against existing `Input`/`Label` components instead.**
Rationale: rather than depend on a broken abstraction or build a full custom `FormField` wrapper before there's a second form to justify the abstraction (login + signup are simple enough for direct `register()` calls), used plain RHF + `zodResolver` + manual error rendering. Revisit building a shared form-field component when the Brief Wizard (Phase 2, "Core screens rebuilt" sub-milestone) needs a multi-step form with more complex field types.

**DD-013 — `.env.example` files must never contain real secret values; if one ever does, treat it as a live incident, not a cleanup task.**
Rationale: mid-Phase-2, real secrets (NVIDIA API key, Postgres connection string, an auth API key) were pasted directly into the tracked `.env.example` templates instead of the gitignored `.env` files. The root one was committed and pushed to a **public** GitHub repo before anyone caught it — a real credential leak, not a hypothetical one. Remediation taken: made the repo private immediately (`gh repo edit --visibility private`), user rotated/is rotating the NVIDIA key, user ultimately deleted the GitHub repo entirely, and all local git history was wiped and reinitialized (`rm -rf .git && git init`) so no trace of the leaked commit remains anywhere, local or remote. Full incident detail in Development Log. Going forward: `.env.example` files get **placeholder values only, always** — an agent-side safety classifier now also blocks writes that look like live credentials being placed in files, which is a useful backstop but not a substitute for never doing this in the first place.

**DD-014 — Git hooks via `prek` (`.pre-commit-config.yaml`, pre-commit-framework-compatible): gitleaks + detect-private-key run on every commit, plus frontend eslint/tsc and `ai/` ruff scoped to changed files.**
Rationale: direct response to the DD-013 incident — `gitleaks` is exactly the hook that would have caught the leaked key before it ever reached a commit. Bundled lint/typecheck in at the same time since the infrastructure (a hook that blocks bad commits) is the same either way, and it stops the "committed code that doesn't even build" failure mode too. Used `prek` (already present in this environment, `pre-commit`-config-compatible, faster) rather than installing the Python `pre-commit` package. Local hooks (`frontend-lint`, `frontend-typecheck`, `ai-lint`) call the project's own already-installed toolchains (`frontend/node_modules`, `ai/.venv`) via `language: system` instead of letting the framework manage a second isolated environment — avoids duplicating dependency installs and can't silently drift from what `npm run lint`/`npm run build` actually do. Verified end-to-end: `prek run --all-files` passes clean (11/11 hooks) against the current repo state; two real lint findings in `ai/eval/report.py` and `test_prompts.py` (genuine dead code from earlier work, not hook misconfiguration) were fixed as part of turning this on, not suppressed.

## 6. Dependencies

**Installed** (`ai/.venv`, Python 3.12): `openai` 2.45.0, `python-dotenv` 1.2.2, `pydantic` 2.13.4, `ruff` 0.15.21 (lint, run via the `ai-lint` git hook — DD-014) — installed for the Milestone 1.1 evaluation harness. `pydantic` is installed but not yet used by harness code (v1's `ConstraintBrief` is a plain dataclass); it's pulled in ahead of Milestone 1.2, where the formal Variant Output Schema will use it. If Milestone 1.2 ends up schema-first via JSON Schema files instead, revisit whether `pydantic` earns its place.

**Installed** (`frontend/`, Node — see `frontend/package.json` for exact versions): Next.js 16.2.10 (App Router, Turbopack), React 19.2.4, Tailwind CSS v4, `@base-ui/react` 1.6.0 (shadcn's underlying primitive library in this environment — see DD-006, not Radix), `lucide-react` (icons), `sonner` (toasts), `class-variance-authority` + `tailwind-merge` (shadcn styling utilities), `next-themes` (dark/light theming, now wired — DD-011). shadcn components installed: button, card, input, select, textarea, badge, tabs, checkbox, slider, separator, label, radio-group, scroll-area, tooltip, sheet, dialog, table, skeleton, sonner, progress. (`form` was attempted but is an empty stub in this registry — see DD-012.)

**Installed** (`frontend/`, Phase 2 architecture redesign): `prisma` + `@prisma/client` 7.8.0, `@prisma/adapter-pg` + `pg` + `@types/pg` (driver adapter, DD-009), `better-auth` 1.6.23 + `@better-auth/prisma-adapter` (auth, DD-008), `zod` 4.4.3, `@tanstack/react-query` (server state), `react-hook-form` 7.81.0 + `@hookform/resolvers` 5.4.0 (forms), `motion` (animation, not yet used), `cmdk` (command palette, not yet used).

## 7. Environment Variables

**Two separate `.env` files** — Next.js/Prisma only read `frontend/.env`, not the root one; `ai/eval/` only reads the project-root `.env`. Both are gitignored; templates are committed.

Root `.env` (from `.env.example`):
| Variable | Purpose | Required for |
|---|---|---|
| `NVIDIA_API_KEY` | Auth for NVIDIA NIM hosted inference (from build.nvidia.com) | Milestone 1.1 (baseline eval) onward |
| `NVIDIA_NIM_BASE_URL` | NIM OpenAI-compatible endpoint base URL (defaults to hosted endpoint) | Milestone 1.1 onward |

`frontend/.env` (from `frontend/.env.example`):
| Variable | Purpose | Required for |
|---|---|---|
| `DATABASE_URL` | Postgres connection string (user's hosted instance — Neon/Supabase/etc., user-confirmed they have one) | Prisma migrate + runtime client, blocking right now |
| `BETTER_AUTH_SECRET` | Session signing secret (user generates via `openssl rand -base64 32`) | Better Auth, blocking right now |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (defaults to `http://localhost:3000`) | Better Auth |
| `AI_SERVICE_URL` | Internal AI service base URL | AI service sub-milestone (not started) |
| `AI_SERVICE_SHARED_SECRET` | Server-to-server auth between BFF and AI service | AI service sub-milestone (not started) |

**Action required from user (both still outstanding):**
1. Root: copy `.env.example` to `.env`, set `NVIDIA_API_KEY` — blocks Milestone 1.1 execution.
2. `frontend/`: copy `.env.example` to `.env`, set `DATABASE_URL` (your hosted Postgres) and `BETTER_AUTH_SECRET` (generate yourself) — blocks `prisma migrate` and any real auth testing.

Neither requested via chat (secret hygiene) — set them directly in the files.

## 8. External Services

| Service | Purpose | Status |
|---|---|---|
| NVIDIA NIM (build.nvidia.com) | Hosted LLM inference (OpenAI-compatible API) | Key available (user-confirmed); not yet called — `.env` not created |
| PostgreSQL (user's hosted instance) | Single source of truth for all product data (DD-007) | User confirmed they have an instance; connection string not yet provided — `frontend/.env` not created, migration blocked |

## 9. AI Models

No model selected yet — this is the primary output of Milestone 1.1 (LLM Baseline Evaluation). Candidate models to evaluate on NIM (creative long-form generation + instruction following):
- `meta/llama-3.3-70b-instruct` (primary candidate)
- `nvidia/llama-3.1-nemotron-70b-instruct` (NVIDIA-tuned alternate)
- `mistralai/mixtral-8x22b-instruct-v0.1` (diversity/comparison baseline)

Final selection and rationale will be recorded here after Milestone 1.1 completes.

## 10. NVIDIA Technologies

| Technology | Role | Status |
|---|---|---|
| NIM | Core LLM serving for plot generation | In use starting Milestone 1.1 |
| NeMo Guardrails | Censorship/content policy enforcement | Planned, Phase 2 |
| Triton Inference Server | Concurrent request handling | Planned, Phase 2 |
| TensorRT-LLM | Inference latency optimization | Planned, Phase 4 |
| CUDA | Underpins GPU inference | N/A directly — using hosted NIM endpoint, not self-managed GPU infra |
| NVIDIA AI Enterprise | Support/licensing wrapper | Out of scope — hackathon-scale, hosted API only |

## 11. Prompt Strategy

Pending — to be authored in Milestone 1.2 (Prompt Architecture Document v1), informed by Milestone 1.1 baseline findings.

## 12. Current Phase

**Phase 2 — Platform Foundation & Redesign** (supersedes the source plan's original Phase 2/Phase 3 split — see §1 and the approved plan at `/home/samarth/.claude/plans/foamy-tinkering-wreath.md`)
Objective: replace the Phase 1 wireframe's mock-data/no-backend foundation with the real hybrid architecture (Next.js BFF + Postgres + Better Auth, internal Python AI service) and a production-grade design system, per user-approved plan.

Sub-milestones (execution order, one at a time, same discipline as Phase 1):
1. **Foundation** — Postgres/Prisma, Better Auth, design tokens ← **current**
2. AI service evolution — `ai/` → `ai-service/`, FastAPI, `/internal/generate|refine|validate`
3. BFF API layer — Route Handlers, Zod validation, TanStack Query hooks, constraint taxonomy served from DB
4. Core screens rebuilt — dashboard, brief wizard, project home, variant detail on real data + new design system + motion
5. Polish — command palette, empty/loading/error states, accessibility, PostHog + Pino

Phase 1 (Design & AI Foundation) is not abandoned — its still-open item (Milestone 1.1 execution, blocked on `NVIDIA_API_KEY`) remains outstanding and will resume once unblocked; its findings still feed the AI service's prompt design in Phase 2 sub-milestone 2. Milestone 1.2 (Prompt Architecture Doc + Variant Output Schema v1) is superseded by Phase 2 sub-milestone 2's `/internal/generate` contract and sub-milestone 3's Prisma schema — no separate standalone deliverable needed now that there's a real schema.

## 13. Current Milestone

**Sub-milestone 2.1 — Foundation**
Status: **in progress.** Done: Prisma schema written and validated (`frontend/prisma/schema.prisma`, verified against Better Auth's own CLI generator — DD-010), driver-adapter wiring (`src/lib/db.ts`, DD-009), Better Auth config with org-per-user auto-provisioning (`src/lib/auth.ts`, DD-008), auth route handler + client hooks, minimal working `/login` and `/signup` pages (React Hook Form + Zod), full design-token overhaul (color/typography/elevation, DD-011) plus dark-mode theming now actually wired (was a latent unwired dependency before this sub-milestone). `next build` and `eslint` both pass clean.

**Blocked:** cannot run `prisma migrate` or exercise auth end-to-end until `frontend/.env` has a real `DATABASE_URL` and `BETTER_AUTH_SECRET` (user action, see §7 — not yet done). Everything above has been validated by type-checking and building against a dummy `DATABASE_URL`, not against a live database — first real migration is the next action on unblock.

## 14. Completed Milestones

**Milestone 1.0 — Environment & Foundation Setup.** Delivered: project-scoped git repo, monorepo skeleton, `docs/constraint-taxonomy-v1.md`, this file. See Development Log Entry 1.

**Milestone 1.3 — UI Wireframes (source plan M3).** Delivered: Next.js 16 + shadcn/ui (Base UI-backed, see DD-006) app in `frontend/`, four screens (dashboard, constraint input, variant display/comparison, variant detail with refinement + export), mock data layer typed against the same shape validated in the Milestone 1.1 prompt template. Superseded incrementally by Phase 2 sub-milestone 4 (screens rebuilt on real data + new design system) — not deleted yet, still the only working UI for the app's core flow. See Development Log Entry 3.

## 15. Pending Tasks

**Phase 1 (still open, blocked on user action):**
- [ ] Milestone 1.1 execution — run `triage` then `full` against NIM once root `.env`'s `NVIDIA_API_KEY` is set; pick winning model; write findings into design.md §9

**Phase 2 (current):**
- [ ] Sub-milestone 2.1 (Foundation) — run `prisma migrate dev` once `frontend/.env` has `DATABASE_URL` + `BETTER_AUTH_SECRET`; smoke-test signup/login end-to-end
- [ ] Sub-milestone 2.2 — AI service evolution (`ai/` → `ai-service/`, FastAPI, internal API)
- [ ] Sub-milestone 2.3 — BFF API layer (Route Handlers, TanStack Query hooks, constraint taxonomy seeded from `docs/constraint-taxonomy-v1.md` into `ConstraintOption`)
- [ ] Sub-milestone 2.4 — Core screens rebuilt on real data + new design system (dashboard, brief wizard, project home, variant detail); delete `frontend/src/lib/mock-data.ts`, `types.ts`, `constraint-taxonomy.ts` once their real replacements exist
- [ ] Sub-milestone 2.5 — Command palette, empty/loading/error states, accessibility pass, PostHog + Pino

**Carried over from Phase 1, still relevant:**
- [ ] `frontend/` has no test setup (no Jest/Vitest/Playwright) — needed before Phase 2 sub-milestone 4 ships real screens
- [ ] Real human/team wireframe review of Phase 1 screens never happened (solo execution) — largely moot now since those screens are being rebuilt, not preserved

Deferred (not needed yet / not applicable to solo execution):
- GPU cluster provisioning — N/A, using hosted NIM endpoint; Triton/TensorRT-LLM addable later per DD-007
- Full censorship rule bodies per rating level (CT-07 gap) — AI service (sub-milestone 2.2) dependency, tracked in Known Issues

## 16. Known Issues

- **Stray whole-drive git repo at `/media/samarth/DataFiles/.git`** — `core.worktree = D:/`, a broken leftover from a Windows dual-boot setup. All git commands against it fail. Left untouched; do not use. This project's repo is `project/.git` (see DD-004).
- **CT-07 rating-level content rules not yet encoded** — the taxonomy defines the *levels* (e.g. MPAA `PG-13`) but not the specific content rules per level (violence detail, language, sexual content thresholds). Required before Phase 2 NeMo Guardrails integration; not a Phase 1 blocker.
- **Multilingual coverage in Milestone 1.1 is a subset (4 of 11 languages in CT-06).** Full-language sign-off deferred until real usage data suggests which additional languages are worth evaluating.
- **No browser automation/screenshot tool available in this environment.** Milestone 1.3's wireframes were verified via `next build` (type-check), `eslint`, and a running dev server checked with `curl` (HTTP status codes + presence of expected rendered text on every route, absence of error-overlay markers) — not an actual visual/pixel or interaction check. Recommend an actual human click-through in a real browser (`cd frontend && npm run dev`) before treating the layouts as final. Same caveat applies to the new design tokens/dark theme and the login/signup pages — verified by build/typecheck only, not visually.
- **`frontend/.env` and root `.env` now both exist on disk** (user created them directly, not via chat). `prisma migrate` still hasn't actually been run against a real database yet — Prisma schema and Better Auth config have only been validated by `next build`/`tsc` against a dummy `DATABASE_URL`. Next action on resuming sub-milestone 2.1: run the real migration and smoke-test signup/login.
- **No git remote configured.** A GitHub remote (`origin`) was added and pushed to outside this conversation at some point during Phase 2, without any commit review step — this is how a leaked secret reached a **public** repo undetected (see DD-013 and the Development Log incident entry). The repo has since been deleted by the user and local git history fully wiped (`rm -rf .git && git init`) — this project currently has **zero commits and no remote**. Before adding a remote again: confirm `.gitignore` coverage and do a `git status`/`git diff` review of anything about to be committed, especially any `.env*` file.

## 17. Technical Debt

None yet — project is freshly scaffolded.

## 18. Future Improvements

- RAPIDS-accelerated constraint-failure analytics (source plan §7.7) — optional, only if core functionality is ahead of schedule by Phase 4.

## 19. Development Log

### Entry 5 — Security incident: leaked NVIDIA API key on a public repo; full remediation; git hooks added
**Logical time:** Immediately after Entry 4, during sub-milestone 2.1
**Task completed:** Detected and fully remediated a credential leak, then added git hooks (`prek` + `.pre-commit-config.yaml`) to prevent recurrence.
**Incident:** The user pasted real secrets (NVIDIA API key, a Postgres connection string, a Better Auth API key) directly into the tracked `.env.example` template files, then — outside this conversation — added a GitHub remote and pushed a commit (`922eb9e`) to a **public** repository (`samarthkolur/script_ideation_genAI`), all without a review step. The root `.env.example`'s leaked `NVIDIA_API_KEY` was live on a public repo. Discovered when investigating an unexpected "working tree clean" / `origin/main` git status.
**Remediation, in order:**
1. Instructed the user to revoke/rotate the NVIDIA key immediately at build.nvidia.com (the only action that actually un-exposes a key that's already been public — nothing else below substitutes for this).
2. Made the GitHub repo private (`gh repo edit --visibility private`) to immediately stop further scraping.
3. Attempted to write the real secret into a proper gitignored `.env` and blank the tracked `.env.example` — both attempts were blocked by an agent-side safety classifier (correctly: writing API-key-shaped strings into files is a red flag it can't distinguish from credential fabrication in this case). Did not attempt to route around the block; explained the situation and asked the user to handle those specific writes themselves — which they did (both `.env` files now exist locally, correctly gitignored, `.env.example` back to placeholders).
4. Confirmed via `git ls-tree` that all real project work (Phase 1 + all of sub-milestone 2.1) was already safely committed in that same commit, so nothing of value would be lost by rewriting history.
5. User independently deleted the GitHub repository entirely (the cleanest possible fix — removes the leak at the source, not just from a future commit).
6. At user's explicit request, wiped all local git history and reinitialized (`rm -rf .git && git init`) — this repo currently has **zero commits and no remote** (see Known Issues).
**Files created:** none (incident response was git/GitHub operations, not file changes, aside from the .env.example restorations the user performed)
**Files modified:** `design.md` (this entry, §5 DD-013, §16)
**Files deleted:** `.git/` (fully, then reinitialized empty)
**Reason for change:** credential leak requiring immediate remediation; not a planned task.
**Architectural decisions:** DD-013 (§5) — `.env.example` files get placeholders only, always; treat any deviation as a live incident.
**Follow-up in the same session:** user asked for git hooks (lint/typecheck/secret-scanning) to prevent this class of issue going forward — see the next log entry region below (folded into this same work session): `.pre-commit-config.yaml` added, wired via `prek install`, verified clean via `prek run --all-files` (DD-014). Two genuine lint findings from earlier work (unused variable in `ai/eval/report.py`, unused import in `ai/eval/test_prompts.py`) were fixed as part of turning the hook on.
**Known issues:** no git remote configured at all right now (see §16) — a deliberate, temporary state after the repo deletion, not an oversight. Before adding a new remote: review `git status`/`git diff` for anything about to be committed, especially `.env*` files, even with hooks now in place (defense in depth, not a substitute for care).
**Next recommended task:** when ready to push again, create a fresh (ideally private, or at least reviewed-before-first-push) GitHub repo, add it as `origin`, and do a normal `git add`/`git commit` (hooks will run automatically) before the first push.

### Entry 4 — Phase 2 kickoff: architecture redesign approved + Sub-milestone 2.1 (Foundation) in progress
**Logical time:** After Phase 1 Milestone 1.3; Phase 1 Milestone 1.1 still open/blocked
**Task completed:** User commissioned a full architecture/design redesign (not an incremental UI patch). Presented a complete proposal via plan mode — architecture, IA, DB schema, API surface, design system, motion principles, folder structure, phased implementation order — resolved the one hard conflict (hackathon NVIDIA deliverables vs. a pure-serverless stack) via a clarifying question, got explicit approval, then began executing sub-milestone 2.1 (Foundation).
**Files created:** `frontend/prisma/schema.prisma`, `frontend/prisma.config.ts`, `frontend/.env.example`, `frontend/src/lib/db.ts`, `frontend/src/lib/auth.ts`, `frontend/src/lib/auth-client.ts`, `frontend/src/app/api/auth/[...all]/route.ts`, `frontend/src/lib/validations/auth.ts`, `frontend/src/app/login/page.tsx`, `frontend/src/app/signup/page.tsx`, `frontend/src/components/theme-provider.tsx`, `frontend/src/components/theme-toggle.tsx`, `frontend/src/components/query-provider.tsx`, `frontend/src/generated/prisma/` (generated, gitignored)
**Files modified:** `frontend/src/app/globals.css` (full design-token overhaul — DD-011), `frontend/src/app/layout.tsx` (wired ThemeProvider, QueryProvider), `frontend/src/components/app-shell.tsx` (added theme toggle), `frontend/package.json` (new deps), `design.md` (§1, §2, §3, §4, §5 DD-007..DD-012, §6, §7, §8, §12, §13, §14, §15, §16, this entry, §20)
**Files deleted:** none
**Reason for change:** see plan file for full context; summarized in §1 and §12.
**Architectural decisions:** DD-007 through DD-012 (§5) — hybrid BFF+AI-service split, Better Auth scope + org auto-provisioning, Prisma 7's driver-adapter breaking change, Better-Auth-CLI-verified schema, the design system's color/typography/elevation tokens, and the shadcn `form` registry gap.
**Verification:** `npm run build` and `npm run lint` both pass clean (against a dummy `DATABASE_URL`/`BETTER_AUTH_SECRET` for typecheck purposes only — see Known Issues). No live-database or visual verification possible yet.
**Remaining work:** sub-milestone 2.1 itself is blocked on `frontend/.env` (`DATABASE_URL`, `BETTER_AUTH_SECRET`) — see §7, §16. Sub-milestones 2.2–2.5 not started.
**Known issues:** see §16 — two separate outstanding `.env` files now block the two independent next steps (Milestone 1.1 execution vs. Prisma migration).
**Next recommended task:** once `frontend/.env` is populated, run `prisma migrate dev`, smoke-test signup/login, then proceed to sub-milestone 2.2 (AI service evolution) — which can also start in parallel once `ai/eval`'s own `.env` gap is resolved, same parallel-track logic used in Phase 1.

### Entry 3 — Phase 1, Milestone 1.3 (UI wireframes) completed
**Logical time:** Phase 1, in parallel with Milestone 1.1 being blocked on `.env`
**Task completed:** Built and verified the four Milestone 1.3 wireframe screens in Next.js + shadcn/ui
**Files created:** `frontend/` (full Next.js app — see §3 for the src/ tree); notably `src/lib/constraint-taxonomy.ts`, `src/lib/types.ts`, `src/lib/mock-data.ts`, `src/components/app-shell.tsx`, `src/components/constraint-form.tsx`, `src/components/variant-card.tsx`, `src/components/variant-compare-table.tsx`, `src/components/export-dialog.tsx`, `src/components/refinement-panel.tsx`, `src/app/page.tsx`, `src/app/create/page.tsx`, `src/app/variants/page.tsx`, `src/app/variants/[id]/page.tsx`, plus 19 shadcn `ui/` primitives
**Files modified:** `src/app/layout.tsx` (wired `AppShell`, `TooltipProvider`, `Toaster`), `design.md` (§3, §5 DD-006, §6, §13, §14, §15, §16, §20)
**Files deleted:** none (default `create-next-app` boilerplate in `app/page.tsx` was replaced, not left in place)
**Reason for change:** Source plan M3 — validate UX layout before Phase 3 commits real engineering to it. Pulled ahead of strict sequence because it was blocked on nothing (only needed Constraint Taxonomy v1, done in 1.0), while Milestone 1.1 was blocked on the user's `.env` setup — see justification in §13.
**Architectural decisions:** DD-006 (Base UI, not Radix, underlies this shadcn install — changes how "link styled as button" and dialog triggers must be written; documented so Phase 3 doesn't hit the same type errors from scratch). Mock data is typed against the same JSON shape already exercised in `ai/eval/prompt_template.py`, so Milestone 1.2's formal schema has two independent real usages to reconcile against, not zero.
**Self-review sign-off:** All 4 required screens present (constraint input, variant display + comparison via tabs, refinement flow, export/share via dialog) and use real Constraint Taxonomy v1 values throughout — no lorem ipsum. `npm run build` and `npm run lint` both pass clean. Every route verified via a running dev server: correct HTTP status per route (200 for real routes, 404 for an unknown variant id — confirms `notFound()` wiring), and expected on-page text present with no error-overlay markers in the HTML. This constitutes the "internal team review" the source plan calls for, scaled to a solo execution — see the caveat below.
**Remaining work:** none for Milestone 1.3 itself. Recommend a real human click-through (`cd frontend && npm run dev`) before Phase 3 treats these layouts as frozen, since no visual/screenshot verification was possible in this environment (see Known Issues).
**Known issues:** no browser automation tool available for actual visual/pixel verification — see §16. `frontend/` has no test harness yet (deferred to Phase 3 per source plan §11).
**Next recommended task:** resume Milestone 1.1 once `NVIDIA_API_KEY` is set; that's the only open item left in Phase 1.

### Entry 2 — Phase 1, Milestone 1.1 harness built
**Logical time:** Phase 1, after Milestone 1.0
**Task completed:** Built the full LLM baseline evaluation harness; validated end-to-end with synthetic data (no real API calls yet)
**Files created:** `ai/eval/nim_client.py`, `ai/eval/constraints.py`, `ai/eval/test_prompts.py`, `ai/eval/prompt_template.py`, `ai/eval/judge.py`, `ai/eval/diversity.py`, `ai/eval/runner.py`, `ai/eval/report.py`, `ai/eval/README.md`, `ai/.venv/` (Python virtualenv, gitignored)
**Files modified:** `design.md` (§6, §13, §14, §15)
**Files deleted:** none
**Reason for change:** Milestone 1.1 (source plan M2) requires measuring real NIM model behavior against the constraint taxonomy before any prompt optimization work begins.
**Architectural decisions:** LLM-as-judge substitutes for the human reviewer panel the source plan assumes (no team exists to review 40+ cases by hand) — documented as a caveat directly in the generated report, not silently. Diversity uses lexical Jaccard similarity, not embeddings, to avoid adding a dependency not yet justified at Phase 1 scale.
**Remaining work:** execute `triage` then `full` against real NIM once `.env` has `NVIDIA_API_KEY`.
**Known issues:** none new; harness has not yet been exercised against the real API, so undiscovered issues (model name typos, NIM-specific response quirks) are possible on first real run.
**Next recommended task:** run the evaluation once the API key is available; then Milestone 1.2.

### Entry 1 — Phase 1, Milestone 1.0 kickoff
**Logical time:** Phase 1 start
**Task completed:** Repository foundation setup (in progress)
**Files created:** `.gitignore`, `.env.example`, `docs/constraint-taxonomy-v1.md`, `design.md`
**Files modified:** none
**Files deleted:** none
**Reason for change:** Phase 1 tasks (wireframes, schema design) have a hard dependency on a concrete constraint taxonomy, which is nominally a Phase 0 deliverable that was explicitly skipped. Produced a lean version to unblock Phase 1 rather than skip the dependency (see DD-005).
**Architectural decisions:** DD-001 through DD-005 (see Section 5).
**Discovery:** Found a pre-existing, broken, whole-drive-scoped git repo at `/media/samarth/DataFiles/.git` (Windows dual-boot leftover, `worktree = D:/`). Left untouched; initialized a new repo scoped to `project/` instead (DD-004).
**Remaining work:** finish Milestone 1.0 (directory scaffolding — done; this log entry — done), then proceed to Milestone 1.1.
**Known issues:** see Section 16.
**Next recommended task:** Milestone 1.1 — LLM Baseline Evaluation harness, once `.env` is populated with `NVIDIA_API_KEY`.

## 20. Current Repository State

```
project/
├── .env.example
├── .gitignore
├── CLAUDE.md
├── design.md
├── PS241_Script_Ideation_Assistant_Project_Plan.md
├── ai/
│   ├── .venv/                  (gitignored — Python 3.12 virtualenv)
│   ├── eval/
│   │   ├── __init__.py
│   │   ├── README.md
│   │   ├── nim_client.py       (NIM OpenAI-compatible async client + retry)
│   │   ├── constraints.py      (machine-readable CT-01..CT-08 mirror)
│   │   ├── test_prompts.py     (42-case curated test brief set)
│   │   ├── prompt_template.py  (baseline/un-optimized generation prompt)
│   │   ├── judge.py            (LLM-as-judge scorer)
│   │   ├── diversity.py        (lexical pairwise diversity proxy)
│   │   ├── runner.py           (CLI: triage / full)
│   │   └── report.py           (markdown report renderer)
│   └── prompts/                (empty — Milestone 1.2)
├── docs/
│   ├── adr/                    (empty — Phase 2+)
│   ├── reports/                (empty until Milestone 1.1 executes; raw/ is gitignored)
│   └── constraint-taxonomy-v1.md
├── frontend/                    Next.js 16 BFF — Phase 1 screens still live, Phase 2 sub-milestone 2.1 (Foundation) in progress
│   ├── .env.example             (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, AI_SERVICE_URL, AI_SERVICE_SHARED_SECRET)
│   ├── prisma/schema.prisma     (User/Session/Account/Verification + Organization/Project/Brief/GenerationRun/Variant/Refinement/Export/ConstraintOption/Comment/UsageEvent)
│   ├── prisma.config.ts
│   └── src/
│       ├── app/
│       │   ├── page.tsx                 (dashboard: hero + recent sessions — Phase 1, mock data)
│       │   ├── layout.tsx                (root layout: ThemeProvider, QueryProvider, AppShell, TooltipProvider, Toaster)
│       │   ├── create/page.tsx           (constraint input form — FR-01, Phase 1, mock data)
│       │   ├── variants/page.tsx         (variant grid + comparison tabs — Phase 1, mock data)
│       │   ├── variants/[id]/page.tsx    (variant detail + refine + export — Phase 1, mock data)
│       │   ├── login/page.tsx, signup/page.tsx    (Phase 2, real Better Auth — NEW)
│       │   └── api/auth/[...all]/route.ts          (Better Auth handler — NEW)
│       ├── components/
│       │   ├── app-shell.tsx, constraint-form.tsx, variant-card.tsx,
│       │   │   variant-compare-table.tsx, export-dialog.tsx, refinement-panel.tsx   (Phase 1)
│       │   ├── theme-provider.tsx, theme-toggle.tsx, query-provider.tsx              (Phase 2 — NEW)
│       │   └── ui/                       (20 shadcn primitives; `form` is a registry stub, not used — DD-012)
│       ├── lib/
│       │   ├── constraint-taxonomy.ts, types.ts, mock-data.ts   (Phase 1 — to be deleted in sub-milestone 2.4)
│       │   ├── db.ts, auth.ts, auth-client.ts                    (Phase 2 — NEW)
│       │   └── validations/auth.ts                                (Phase 2 — NEW)
│       └── generated/prisma/            (Prisma Client output — generated, gitignored)
└── schemas/                    (empty — superseded by frontend/prisma/schema.prisma, see §12)
```

Git: repository initialized at `project/`, branch `main`, no commits yet (first commit pending user confirmation). **Two `.env` files still don't exist** — root `.env` (`NVIDIA_API_KEY`) and `frontend/.env` (`DATABASE_URL`, `BETTER_AUTH_SECRET`) — both block their respective next steps (§7, §16). `frontend/node_modules`, `frontend/.next`, `frontend/src/generated/prisma`, and `ai/.venv` are gitignored and not part of version control.
