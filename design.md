# design.md — PS241 Script Ideation Assistant

**This document is the authoritative engineering context for the project.** Per `CLAUDE.md`, it must be read before any work begins and updated before any response ends. Do not re-audit the repository if this document already answers the question.

---

## 1. Project Overview

PS241 — Script Ideation Assistant is a GenAI-powered tool that generates multiple logically-consistent plot variants from a single creative brief, under simultaneous, structured constraints (genre, audience, budget, runtime, region, language, censorship, production limits). Full requirements live in `PS241_Script_Ideation_Assistant_Project_Plan.md` (the source project plan — treat as read-only requirements input, not a living doc).

This project is being executed by a single developer + Claude Code, not the 7–9 person team the source plan assumes. Team-ownership columns in the source plan are informational only; all roles are performed by this pairing. Phase 0 (team kickoff, GPU procurement, multi-day PRD sign-off ritual) was explicitly skipped by user instruction — we started execution at Phase 1. Where Phase 1 tasks have a hard dependency on a Phase 0 deliverable, we produce a lean version of that deliverable inline and log the justification in the Development Log below, rather than skipping the dependency.

**Architecture redesign (post-Phase-1):** after Phase 1 wireframes were reviewed, the user commissioned a ground-up redesign — a production-grade design system and a real backend (Postgres as single source of truth, BFF architecture), rather than incrementally patching the Phase 1 wireframe. Full proposal, rationale, and approval record: `/home/samarth/.claude/plans/foamy-tinkering-wreath.md`. This superseded the source plan's original Phase 2 (Backend) / Phase 3 (Frontend) split with a unified **Phase 2 — Platform Foundation & Redesign** (see §12). The one constraint carried forward from the source plan: NIM/NeMo Guardrails/Triton/TensorRT-LLM remain graded deliverables, resolved via a **hybrid architecture** (Next.js BFF + a separate internal Python AI service) — see DD-007.

## 2. Current Architecture

**The full hybrid architecture is built, migrated, seeded, and verified end-to-end against the real database.** Signup → org auto-provisioning → constraint taxonomy (served from Postgres) → project creation → real generation (mock provider) → variant persistence → refinement → PDF/text export were all exercised via real HTTP requests against the running dev server and passed. This is no longer "built but unverified" — it works.

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│   Browser (Next.js   │  HTTP  │  Next.js BFF               │  HTTP  │  AI Service       │
│   client components) │───────▶│  (Route Handlers)          │───────▶│  (FastAPI, Python)│
│                       │◀───────│  - Better Auth              │◀───────│  - ModelProvider    │
│  TanStack Query,      │        │  - Prisma → Postgres        │        │    interface        │
│  shadcn/ui, RHF+Zod   │        │  - Zod validation            │        │  - MockProvider     │
└─────────────────────┘        │  - business logic             │        │  - NimProvider      │
                                 └──────────────────────────┘        │  - (later) Triton /  │
                                                                       │    TensorRT-LLM      │
                                                                       └─────────────────┘
```

**Boundary rules (enforced in code, not just documented):** the browser only ever talks to Next.js Route Handlers (`frontend/src/app/api/*`) — never Postgres, the AI service, or NIM directly; verified by grep, nothing in `frontend/src/components` or client-marked files imports `ai-service-client.ts` or `db.ts` (both guarded with `import "server-only"`). The BFF never calls NIM directly either — only the AI service does, via `ai-service/app/core/providers/nim_provider.py`, server-to-server over a shared-secret header (`X-Internal-Secret`).

**The pluggable model provider (DD-016)** is the direct answer to Milestone 1.1's NIM reliability problems (queue congestion, a model deployment going fully "DEGRADED" mid-run — see §16). `ai-service/app/core/providers/base.py` defines the `ModelProvider` interface (`generate`/`refine`/`validate`); `MockProvider` (deterministic, instant, zero external dependency) and `NimProvider` (real NIM, with every lesson from Milestone 1.1 baked in — 180s timeout, defensive JSON parsing, 8192-token budget for reasoning models) both implement it. Switching is one env var (`MODEL_PROVIDER=mock|nim` in `ai-service/.env`) — nothing else in the AI service, the BFF, or the frontend changes. Verified end-to-end against the mock provider via direct curl calls to all four endpoints (`/health`, `/internal/generate`, `/internal/refine`, `/internal/validate`).

**Verified this session, via real HTTP requests against a running dev server (not just build/lint/typecheck):** signup (`POST /api/auth/sign-up/email`) → org auto-provisioning fired correctly → `GET /api/constraint-taxonomy` returned 70 seeded options across 9 dimensions → `POST /api/projects` created a real Project+Brief+GenerationRun and got 3 real, distinct variants back from the AI service (mock provider) → `GET /api/variants/[id]` returned the full nested detail → `POST /api/variants/[id]/refine` created a linked new Variant preserving structure → `POST /api/variants/[id]/export` produced both a well-formatted `.txt` and a genuinely valid PDF (confirmed via `file`) → `POST /api/projects/[id]/briefs` (regenerate) created brief version 2 with 3 more variants → unauthenticated requests correctly redirect to `/login` → Zod validation correctly rejects malformed input (400). Test data was created and then cleaned up from the real database afterward.

Backend framework for the AI service is **FastAPI** (Python) — chosen for consistency with the existing `ai/eval/` code and native fit with NeMo Guardrails (Python library, still not integrated — tracked in Pending Tasks). Built.

## 3. Repository Structure

```
project/
├── CLAUDE.md                          # Operating instructions for AI-assisted development (this workflow)
├── design.md                          # This file — authoritative engineering context
├── PS241_Script_Ideation_Assistant_Project_Plan.md   # Source requirements/plan (read-only input)
├── .gitignore
├── .env.example                       # Root secrets template (NVIDIA_API_KEY — for ai/eval/) — placeholders only, see DD-013
├── .pre-commit-config.yaml            # Git hooks: gitleaks, detect-private-key, frontend eslint/tsc, ai + ai-service ruff — DD-014
├── .github/workflows/ci.yml           # CI backstop, 3 jobs (pre-commit, frontend-build, ai-service-build) — DD-015
├── docs/
│   ├── constraint-taxonomy-v1.md      # CT-01..CT-08 — human-readable source of truth, now seeded into Postgres (prisma/seed.ts)
│   ├── adr/                           # Architecture Decision Records (not yet used)
│   └── reports/                       # LLM baseline evaluation reports (Milestone 1.1)
├── schemas/                           # Empty — superseded by frontend/prisma/schema.prisma + ai-service/app/schemas.py (the two ends of the real contract)
├── ai/                                # Milestone 1.1 LLM evaluation harness — kept as-is, not deleted (regression-test value)
│   ├── eval/
│   └── prompts/                       # Still empty — superseded by ai-service/app/core/nim_provider.py's prompt templates
├── ai-service/                        # NEW — internal AI orchestration service (FastAPI), never called by the browser
│   ├── .env.example                   # MODEL_PROVIDER, NIM_API_KEY, NIM_BASE_URL, NIM_MODEL_NAME, AI_SERVICE_SHARED_SECRET
│   ├── requirements.txt
│   └── app/
│       ├── main.py                    # Mounts routers
│       ├── config.py                  # Settings (pydantic-settings) — MODEL_PROVIDER is the "plug and go" switch
│       ├── dependencies.py            # Shared-secret auth check for /internal/* routes
│       ├── schemas.py                 # BriefInput/VariantOutput/... — the BFF<->AI-service contract
│       ├── routers/                   # health.py, generate.py, refine.py, validate.py
│       └── core/
│           ├── json_utils.py          # Defensive JSON extraction (NIM models leak reasoning text around valid JSON)
│           └── providers/
│               ├── base.py            # ModelProvider abstract interface — the pluggable seam
│               ├── mock_provider.py   # Deterministic, instant, zero external dependency (default)
│               └── nim_provider.py    # Real NIM — timeout/retry/token-budget lessons from Milestone 1.1
└── frontend/                          # Next.js 16 BFF + UI — fully rewired to real data, no mock data remaining
    ├── .env.example                   # DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, AI_SERVICE_URL, AI_SERVICE_SHARED_SECRET
    ├── prisma/
    │   ├── schema.prisma               # Postgres schema — Better Auth tables + product domain (Org/Project/Brief/GenerationRun/Variant/Refinement/Export/ConstraintOption)
    │   └── seed.ts                     # Seeds ConstraintOption from docs/constraint-taxonomy-v1.md
    ├── prisma.config.ts                # Prisma 7 migration config (DD-009); wires seed.ts via `tsx`
    └── src/
        ├── proxy.ts                    # Auth-gating (Next.js 16 renamed "middleware" to "proxy" — DD-017)
        ├── app/
        │   ├── page.tsx                 # Dashboard — real useProjects()
        │   ├── create/page.tsx          # Brief wizard — real useConstraintTaxonomy() + useCreateProject()
        │   ├── projects/[id]/page.tsx    # NEW — project's variants (cards/compare), replaces Phase 1's generic /variants
        │   ├── variants/[id]/page.tsx    # Variant detail + refine + export — real useVariant()
        │   ├── login/page.tsx, signup/page.tsx
        │   └── api/                      # projects, projects/[id], projects/[id]/briefs, variants/[id], variants/[id]/refine,
        │                                  # variants/[id]/export, constraint-taxonomy, generation-runs/[id], auth/[...all]
        ├── components/                  # app-shell (now client, session-aware), constraint-form (real taxonomy+submit),
        │                                  # variant-card, variant-compare-table, export-dialog, refinement-panel (all real data now),
        │                                  # theme-provider, theme-toggle, query-provider, ui/ (shadcn primitives)
        ├── hooks/                        # NEW — use-projects.ts, use-variants.ts, use-constraint-taxonomy.ts (TanStack Query)
        ├── lib/
        │   ├── db.ts, auth.ts, auth-client.ts, session.ts (NEW), ai-service-client.ts (NEW), mappers.ts (NEW),
        │   │   api-client.ts (NEW), api-helpers.ts (NEW), variants.ts (NEW), export.ts (NEW — pdf-lib rendering)
        │   ├── validations/brief.ts (NEW), auth.ts
        │   └── types.ts                  # Real API response types — Phase 1's provisional shape fully replaced
        └── generated/prisma/             # Prisma Client output — generated, gitignored, do not hand-edit
```

**Deleted this session** (superseded, no longer referenced anywhere): `frontend/src/lib/mock-data.ts`, `frontend/src/lib/constraint-taxonomy.ts` (the hardcoded Phase 1 version), `frontend/src/app/variants/page.tsx` (the generic mock-data list, replaced by `projects/[id]/page.tsx`).

## 4. Technology Stack

| Layer | Choice | Status |
|---|---|---|
| Frontend framework | Next.js 16 (App Router, TypeScript) | Built |
| UI component library | shadcn/ui (Base UI) + Tailwind CSS v4 | Built (DD-002, DD-006, DD-011) |
| **BFF / backend-for-frontend** | **Next.js Route Handlers** | **Built (DD-007) — 8 route groups, all typecheck/lint/build clean; unverified against real DB** |
| Database | PostgreSQL (user-hosted, Supabase) | Schema written, migration blocked (DD-019 — IPv6 direct-connection issue) |
| ORM | Prisma 7 (driver-adapter model, `@prisma/adapter-pg`) | Built (DD-009) |
| Auth | Better Auth (email/password v1) | Built (DD-008), incl. `proxy.ts` route gating; unverified against real DB |
| Server state | TanStack Query | Built — 3 hook modules (projects, variants, constraint-taxonomy) |
| Forms | React Hook Form + Zod | Built — login/signup/brief-wizard |
| PDF generation | pdf-lib | Built (DD-020) — export renders PDF/text on-demand, not persisted (no blob storage yet) |
| Animation | Motion (Framer Motion) | Installed, not yet used (deferred — see Pending Tasks) |
| Analytics | PostHog | Not yet installed (deferred) |
| Logging | Pino | Not yet installed (deferred) |
| **AI orchestration language** | **Python 3.12, in a separate internal AI service (`ai-service/`)** | **Built (DD-003, DD-007, DD-016)** |
| Model provider abstraction | Custom `ModelProvider` interface (`MockProvider` + `NimProvider`) | Built (DD-016) — verified end-to-end against mock |
| LLM provider | NVIDIA NIM (hosted, OpenAI-compatible API), via `NimProvider` | Built (DD-003) |
| LLM client library | `openai` Python SDK, `base_url` pointed at NIM | Built (DD-003) |
| AI service framework | FastAPI (Python) | Built — 4 endpoints, all verified against mock provider |
| Content policy layer | NeMo Guardrails | Not yet integrated — tracked in Pending Tasks |
| Inference scaling | Triton Inference Server | Planned, later (needs persistent GPU infra, addable without touching the BFF or the AI service's public interface — DD-007, DD-016) |
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

**DD-015 — GitHub Actions CI (`.github/workflows/ci.yml`) runs the *same* `.pre-commit-config.yaml` via the official `pre-commit/action`, plus a separate `frontend-build` job, rather than duplicating hook logic in workflow YAML or trying to run `prek` itself in CI.**
Rationale: local hooks (DD-014) only protect commits made on a machine that has `prek install` run — skippable via `--no-verify`, and simply absent after a fresh clone until someone remembers to reinstall. CI is the backstop that runs unconditionally on every push/PR regardless of local setup; this is the actual reason for the request (do not rely on hooks alone for something as consequential as secret scanning after a real leak). Used `pre-commit/action` (official, Python-based) instead of installing `prek` in the runner — `prek` is newer with a less-established CI story, and since both tools read the identical `.pre-commit-config.yaml` and drive the same underlying tools (gitleaks binary, eslint, tsc, ruff), the choice of orchestrator doesn't change what gets checked, only which one is more provable to work correctly in an environment this session can't actually execute a GitHub Actions run in to verify. The `frontend-build` job is separate from the lint/typecheck job so a `next build`-specific failure (e.g. a route conflict that only surfaces at build time, not from `tsc` alone) reports independently. Both jobs set dummy `DATABASE_URL`/`BETTER_AUTH_SECRET` env vars — required because `next build` touches `src/lib/db.ts`/`auth.ts` at the module level (see DD-009), not because any route is actually invoked at build time; clearly commented in the workflow as placeholders, never real secrets. Validated locally: YAML parses correctly (with `"on"` explicitly quoted — bare `on:` parses as boolean `true` under PyYAML/YAML 1.1, a well-known quirk GitHub's own parser doesn't share, but quoting removes the ambiguity for other tooling reading the file, including our own `check-yaml` hook) and `prek run --all-files` (which includes gitleaks) passes clean against the new workflow file itself. **Not verified against a real GitHub Actions run** — no repo to push to right now (see §16); first real push should be treated as this workflow's actual first test. (Since this DD was written, the CI workflow gained a third job, `ai-service-build` — same "unverified against a real run" caveat applies to it too.)

**DD-016 — Pluggable `ModelProvider` interface (`ai-service/app/core/providers/base.py`), with a first-class `MockProvider` alongside `NimProvider`, rather than a single hardcoded NIM integration.**
Rationale: direct response to Milestone 1.1's real-world NIM reliability findings — shared-tier queue congestion (441 requests queued, 60s+ for trivial calls) and, on the actual full evaluation attempt, a model deployment going entirely "DEGRADED" mid-run (42/42 cases failed). The user's explicit ask — "leave the model part as a separate module... so even on changing model, it should be adaptable... plug and go" — is satisfied structurally: every router depends only on `get_provider()` (registry.py), never on a concrete class; adding a provider is one new file + one registry line, zero changes elsewhere. `MockProvider` is not a toy — it reads real brief fields into varied, plausible output (fixed a real bug during testing: two variants got the identical logline because independent per-variant random draws collided; switched to a shuffled-pool-cycled-by-index approach that guarantees no repeats) — and its existence means the entire frontend-to-BFF-to-AI-service pipeline is independently verifiable without depending on any external LLM's uptime. Default `MODEL_PROVIDER=mock`; real generation is `MODEL_PROVIDER=nim`, one line in `ai-service/.env`.

**DD-017 — Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism, `export function proxy` instead of `export function middleware`) — not a choice, a breaking change caught by the build.**
Rationale: `frontend/AGENTS.md` explicitly warns this Next.js version diverges from training data; confirmed directly (`next build` emitted a deprecation warning naming the exact rename) and checked `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` before renaming, rather than guessing at the new convention. The auth-gating logic itself (check for a Better Auth session cookie via `getSessionCookie`, redirect to `/login?redirect=<path>` if absent) is unchanged — this is a file-rename-and-export-rename fix, not a behavior change.

**DD-018 — Prisma's `Json` field inputs (`Variant.threeActOutline`) require a double cast (`as unknown as Prisma.InputJsonValue`) from a plain TS interface, not a direct cast.**
Rationale: Prisma's generated `InputJsonObject` type requires a string index signature; `ThreeActOutline` (a plain `{act1, act2, act3}` interface, matching both the AI service's Pydantic schema and the frontend's display components) doesn't structurally have one even though every field is JSON-compatible at runtime. TypeScript refuses the direct cast ("neither type sufficiently overlaps") and requires routing through `unknown` first. Fixed once in `frontend/src/lib/mappers.ts` (`fromVariantPayload`), not re-solved at each of the three call sites (project creation, brief regeneration, refinement) that create `Variant` rows.

**DD-019 — Prisma migration is blocked on Supabase's direct-connection endpoint being IPv6-only, unreachable from this environment (IPv4-only outbound).**
Rationale: not a code issue — confirmed directly. `db.<project-ref>.supabase.co:5432` resolves only to an IPv6 address (`getent hosts` confirmed); `/dev/tcp` connection attempt returned "Network is unreachable." This is a documented Supabase characteristic (direct connections are IPv6; their connection pooler, Supavisor, is the IPv4-compatible option, typically `aws-0-<region>.pooler.supabase.com:6543`). User needs to swap `DATABASE_URL` in `frontend/.env` to the pooler connection string from their Supabase dashboard (Project Settings → Database → Connection String → "Transaction pooler"). Tracked in Known Issues — this is the single blocker preventing real end-to-end verification of everything else built this session.

**DD-020 — FR-08 export (PDF/text) generates on-demand and streams directly to the browser (`Content-Disposition: attachment`) rather than persisting to blob storage.**
Rationale: the Prisma schema has an `Export` model (audit trail, per the original plan), but no object storage (S3/R2/Supabase Storage/etc.) is provisioned, and standing that up is a distinct, deferred task — not something to half-implement by writing `Export` rows with a `fileUrl` that points nowhere real. PDF rendering uses `pdf-lib` directly (no headless-browser/React-PDF dependency) — simple enough for the current export content (structured text sections) that a heavier renderer isn't justified yet. When object storage exists, this becomes: render once, upload, persist the `Export` row with a real URL, serve via redirect — a clean extension point, not a rewrite.

**DD-021 — `DATABASE_URL` uses Supabase's session-mode pooler (port 5432), not transaction-mode (port 6543), despite transaction mode being the connection string Supabase's UI suggests by default.**
Rationale: with the correct pooler *host* (fixing DD-019's IPv6 issue) but transaction-mode port 6543, `prisma migrate dev` connected successfully but then hung indefinitely with zero progress — reproduced, not assumed. Root cause: transaction-mode pooling (Supavisor/PgBouncer transaction mode) multiplexes connections per-transaction and doesn't support session-persistent features like the advisory locks `prisma migrate` uses to coordinate schema changes safely. Session mode (same host, port 5432) gives each client a dedicated backend connection for the session's duration, which supports advisory locks and prepared statements — migration succeeded immediately after switching only the port. Prisma's usual recommendation for this exact problem is a separate `directUrl` (migrations) vs. pooled `url` (runtime) pair in the datasource block, but Prisma 7's config (`@prisma/config`'s `Datasource` type) only exposes `url`/`shadowDatabaseUrl` — no `directUrl` field — so `DATABASE_URL` alone does double duty here. Trade-off accepted: session mode holds a backend connection per active session (less efficient multiplexing than transaction mode) rather than per-transaction, which is a non-issue at this project's current scale and revisitable later if connection-pool exhaustion ever becomes real.

## 6. Dependencies

**Installed** (`ai/.venv`, Python 3.12): `openai` 2.45.0, `python-dotenv` 1.2.2, `pydantic` 2.13.4, `ruff` 0.15.21 (lint, run via the `ai-lint` git hook — DD-014) — installed for the Milestone 1.1 evaluation harness. `pydantic` is installed but not yet used by harness code (v1's `ConstraintBrief` is a plain dataclass); it's pulled in ahead of Milestone 1.2, where the formal Variant Output Schema will use it. If Milestone 1.2 ends up schema-first via JSON Schema files instead, revisit whether `pydantic` earns its place.

**Installed** (`frontend/`, Node — see `frontend/package.json` for exact versions): Next.js 16.2.10 (App Router, Turbopack), React 19.2.4, Tailwind CSS v4, `@base-ui/react` 1.6.0 (shadcn's underlying primitive library in this environment — see DD-006, not Radix), `lucide-react` (icons), `sonner` (toasts), `class-variance-authority` + `tailwind-merge` (shadcn styling utilities), `next-themes` (dark/light theming, now wired — DD-011). shadcn components installed: button, card, input, select, textarea, badge, tabs, checkbox, slider, separator, label, radio-group, scroll-area, tooltip, sheet, dialog, table, skeleton, sonner, progress. (`form` was attempted but is an empty stub in this registry — see DD-012.)

**Installed** (`frontend/`, Node): `prisma` + `@prisma/client` 7.8.0, `@prisma/adapter-pg` + `pg` + `@types/pg` (driver adapter, DD-009), `better-auth` 1.6.23 + `@better-auth/prisma-adapter` (auth, DD-008), `zod` 4.4.3, `@tanstack/react-query` (server state, now with real query hooks), `react-hook-form` 7.81.0 + `@hookform/resolvers` 5.4.0 (forms), `server-only` (guards `db.ts`/`ai-service-client.ts` from client-side import), `pdf-lib` (PDF export, DD-020), `tsx` (dev dep, runs `prisma/seed.ts`), `motion` (animation, still not yet used), `cmdk` (command palette, still not yet used).

**Installed** (`ai-service/.venv`, Python 3.12 — new this session): `fastapi` 0.139.0, `uvicorn[standard]` 0.51.0, `pydantic` 2.13.4, `pydantic-settings` 2.14.2, `openai` 2.45.0, `python-dotenv`, `httpx`, `ruff` (lint). Full list in `ai-service/requirements.txt` (`pip freeze` output).

## 7. Environment Variables

**Three separate `.env` files now** — Next.js/Prisma only read `frontend/.env`; `ai/eval/` only reads the project-root `.env`; the AI service only reads `ai-service/.env`. All gitignored; templates committed.

Root `.env` (from `.env.example`):
| Variable | Purpose | Required for |
|---|---|---|
| `NVIDIA_API_KEY` | Auth for NVIDIA NIM hosted inference (from build.nvidia.com) | Milestone 1.1 (baseline eval) — set, rotated after the DD-013 incident |
| `NVIDIA_NIM_BASE_URL` | NIM OpenAI-compatible endpoint base URL | Milestone 1.1 |

`frontend/.env` (from `frontend/.env.example`) — **all set except `DATABASE_URL` needs the pooler variant (DD-019)**:
| Variable | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Set, but points at Supabase's IPv6-only direct connection — **blocking**, needs the pooler string (DD-019) |
| `BETTER_AUTH_SECRET` | Session signing secret | Set |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | Set |
| `AI_SERVICE_URL` | Internal AI service base URL | Set (defaults to `http://localhost:8000`) |
| `AI_SERVICE_SHARED_SECRET` | Server-to-server auth between BFF and AI service | Empty — fine for local dev (both sides treat an unset secret as "skip the check"), must be set before any real deployment |

`ai-service/.env` (from `ai-service/.env.example`) — **not yet created**:
| Variable | Purpose | Required for |
|---|---|---|
| `MODEL_PROVIDER` | `mock` (default) or `nim` | Everything — this is the DD-016 plug-and-go switch |
| `NIM_API_KEY`, `NIM_BASE_URL`, `NIM_MODEL_NAME` | Only needed when `MODEL_PROVIDER=nim` | Real generation |
| `AI_SERVICE_SHARED_SECRET` | Must match `frontend/.env`'s value | Production deployment |

**Action required from user:** update `frontend/.env`'s `DATABASE_URL` to the Supabase connection-pooler string (Project Settings → Database → Connection String → "Transaction pooler") — the single remaining blocker (DD-019). Everything else is either set or has a working default (`MODEL_PROVIDER=mock` means `ai-service/.env` doesn't even need to exist for the mock-provider path).

## 8. External Services

| Service | Purpose | Status |
|---|---|---|
| NVIDIA NIM (build.nvidia.com) | Hosted LLM inference (OpenAI-compatible API) | Key set (rotated post-DD-013), reachable — but see §16 for real reliability findings from actual use |
| PostgreSQL (Supabase, user-hosted) | Single source of truth for all product data (DD-007) | Instance exists; connection string set but unusable as-is (DD-019, IPv6) — blocking |
| AI Service (`ai-service/`, internal) | AI orchestration, called only by the BFF | Built, running locally, verified against mock provider |

## 9. AI Models

Milestone 1.1's original 3 candidates (`meta/llama-3.3-70b-instruct`, `nvidia/llama-3.1-nemotron-70b-instruct`, `mistralai/mixtral-8x22b-instruct-v0.1`) were **not usable** as evaluated: 2 of 3 aren't entitled on this NIM account at all (fast 404), and the Meta Llama models hung indefinitely under shared-tier queue congestion (441 requests queued, confirmed via NVIDIA's own UI). Switched to a second candidate set, all confirmed both entitled and fast in direct testing:
- `nvidia/nemotron-3-nano-30b-a3b` — fast (0.6s), but **unreliable at the actual task**: reproduced directly, it spends its token budget on chain-of-thought reasoning and, even with an 8192-token budget removing truncation as a factor, produces meta-commentary about the JSON format instead of the actual content. Not used.
- `deepseek-ai/deepseek-v4-flash` — mostly failed JSON parsing in initial testing due to a few characters of reasoning-text leakage before the JSON object (fixed harness-side via defensive JSON extraction, `parse_json_object` — see `ai/eval/json_utils.py` and `ai-service/app/core/json_utils.py`); not fully re-validated after the fix.
- `minimaxai/minimax-m3` — **current default** (`ai-service/.env.example`'s `NIM_MODEL_NAME`). Confirmed reliable and high-quality in direct testing (valid JSON, coherent on-brief creative output) once given an adequate token budget. **However:** the one full 42-case Milestone 1.1 evaluation attempt against this model failed 42/42 with `DEGRADED function cannot be invoked` — NVIDIA's own hosted deployment of this model went down entirely mid-attempt. This is a real, observed reliability event, not a config problem; the AI service's `NimProvider` has the timeout/retry infrastructure to fail fast and cleanly when this happens, but cannot make a genuinely-down upstream model work.

**Net conclusion:** NVIDIA's shared/free-tier hosted endpoint has shown three distinct failure modes in real testing this project (queue congestion, token-budget/reasoning-model confusion, full model outage) across every model tried. This is exactly why DD-016 (pluggable provider, `MockProvider` default) exists — the rest of the system does not depend on NIM's uptime to be built, verified, or demoed. Milestone 1.1's formal baseline evaluation report is still not completed (see Pending Tasks) — the harness works, but a stable enough window against real NIM hasn't occurred yet to generate real numbers.

## 10. NVIDIA Technologies

| Technology | Role | Status |
|---|---|---|
| NIM | Core LLM serving for plot generation | Integrated (`ai-service/app/core/providers/nim_provider.py`); real-world reliability has been poor so far — see §9 |
| NeMo Guardrails | Censorship/content policy enforcement | Not yet integrated — tracked in Pending Tasks |
| Triton Inference Server | Concurrent request handling | Planned, later — addable behind `ModelProvider` (DD-016) without touching the BFF or AI service's public API |
| TensorRT-LLM | Inference latency optimization | Planned, later (same note) |
| CUDA | Underpins GPU inference | N/A directly — using hosted NIM endpoint, not self-managed GPU infra |
| NVIDIA AI Enterprise | Support/licensing wrapper | Out of scope — hackathon-scale, hosted API only |

## 11. Prompt Strategy

Implemented directly in `ai-service/app/core/providers/nim_provider.py` (generate/refine/validate prompt templates, evolved from `ai/eval/prompt_template.py` + `judge.py`) rather than as a separate standalone document — Milestone 1.2's originally-planned "Prompt Architecture Document" is superseded by this real, working implementation. Key learned constraints baked in: reasoning models need an 8192-token generation budget (not the original 2048) to leave room for chain-of-thought before the actual JSON answer; `response_format: json_object` is necessary but not sufficient — defensive extraction (`parse_json_object`, strips to the outermost `{...}`) is still needed for models that leak a few characters of reasoning around otherwise-valid JSON.

## 12. Current Phase

**Phase 2 — Platform Foundation & Redesign** (supersedes the source plan's original Phase 2/Phase 3 split — see §1 and the approved plan at `/home/samarth/.claude/plans/foamy-tinkering-wreath.md`)
Objective: replace the Phase 1 wireframe's mock-data/no-backend foundation with the real hybrid architecture (Next.js BFF + Postgres + Better Auth, internal Python AI service) and a production-grade design system, per user-approved plan.

Sub-milestones:
1. **Foundation** — Postgres/Prisma, Better Auth, design tokens — **built and verified against real DB**
2. **AI service evolution** — `ai-service/`, FastAPI, pluggable `ModelProvider`, `/internal/generate|refine|validate` — **built and verified end-to-end (mock provider)**; real-NIM path built but not reliably verified (§9)
3. **BFF API layer** — Route Handlers, Zod validation, TanStack Query hooks, constraint taxonomy served from DB — **built and verified against real DB**
4. **Core screens rebuilt** — dashboard, brief wizard, project view, variant detail on real data + new design system — **built**; screen logic verified via the API-level end-to-end pass (motion/animation polish, and an actual in-browser click-through, still outstanding — no browser automation tool in this environment)
5. **Polish** — command palette, PostHog, Pino, motion — **not started**

The user's mid-Phase-2 request ("complete the whole project... leave the model part as a separate module... plug and go") drove sub-milestones 2–4 to be built together in one push rather than strictly sequentially, since they're tightly coupled (BFF routes need the AI service to call, screens need the BFF routes to call) — see Development Log for the full sequence. This is a justified reordering, not a skipped step: every sub-milestone's actual deliverables exist in code and are now DB-verified (except sub-milestone 5, genuinely not started).

Phase 1's still-open item (Milestone 1.1 full evaluation) remains genuinely incomplete — not for lack of trying, but because real NIM usage this session surfaced three distinct reliability failures (queue congestion, a reasoning model unable to do the task, a full model outage mid-run). See §9 for the detailed trail.

## 13. Current Milestone

**Sub-milestones 2.1 through 2.4 — code-complete and verified end-to-end against the real database.**

`prisma migrate dev` succeeded (after DD-021's session-pooler fix) and `prisma db seed` populated 70 constraint options. A full real HTTP-request pass — signup, org auto-provisioning, taxonomy fetch, project creation with real generation, variant detail, refinement, PDF/text export, regeneration, auth-gating, validation rejection — was exercised end-to-end and passed (see §2 for the exact sequence). Test data was created and cleaned up afterward, not left in the database.

**What's still genuinely outstanding:** sub-milestone 2.5 (polish — command palette, motion, PostHog, Pino) hasn't been started. An actual in-browser click-through hasn't happened (no browser automation tool in this environment) — the API-level verification is thorough but isn't a substitute for seeing the UI render and interact correctly. A stable, complete Milestone 1.1 baseline evaluation against real NIM still doesn't exist (§9).

## 14. Completed Milestones

**Milestone 1.0 — Environment & Foundation Setup.** See Development Log Entry 1.

**Milestone 1.3 — UI Wireframes (source plan M3).** Superseded and replaced by Phase 2 sub-milestone 4's real-data screens this session — `mock-data.ts`, the old `constraint-taxonomy.ts`, and the generic `/variants` list page are all deleted, zero references remain.

**Phase 2, sub-milestones 2.1–2.4 — complete and DB-verified.** See Development Log for the full build sequence — AI service with pluggable provider (DD-016), full BFF API layer, all screens rewired to real data, auth-gated routing, real Postgres migration + seed (DD-021), full end-to-end verification pass.

## 15. Pending Tasks

**Phase 2, sub-milestone 2.5 (Polish) — not started:**
- [ ] Command palette (`cmdk`, installed, unused)
- [ ] Motion/animation pass (`motion`, installed, unused) — design.md's approved plan §7 (motion principles) not yet applied to any real screen
- [ ] PostHog analytics, Pino logging — not installed
- [ ] Accessibility pass
- [ ] Empty/loading/error states exist per-screen already (built pragmatically alongside each feature) but haven't had a dedicated consistency pass

**AI service / Milestone 1.1 follow-through:**
- [ ] NeMo Guardrails integration — not started, real dependency for the hackathon's graded deliverables (source plan §7.2)
- [ ] Get a real, complete Milestone 1.1 baseline evaluation run against NIM once the platform is stable enough to sustain one (§9) — the harness and AI service are both ready; NVIDIA's endpoint hasn't cooperated yet
- [ ] Re-validate `deepseek-ai/deepseek-v4-flash` with the defensive JSON parsing fix in place (was fixed but not re-tested at scale)
- [ ] Full censorship rule bodies per rating level (CT-07 gap) — needed once NeMo Guardrails work starts

**Carried over, lower priority:**
- [ ] `frontend/` and `ai-service/` have no automated test suite (no Jest/Vitest/pytest) — the verification done this session was build/lint/typecheck/manual-curl, not unit/integration tests
- [ ] Object storage for `Export` persistence (DD-020) — export works today via on-demand streaming, but there's no download history

**Recommended immediate next step (not blocking, just next):**
- [ ] A real human click-through in an actual browser (`cd frontend && npm run dev`, both dev servers are already running from this session) — the API-level verification is thorough but no visual/interaction check has happened, since this environment has no browser automation tool

Deferred (not needed yet):
- GPU cluster provisioning, Triton, TensorRT-LLM — addable behind the `ModelProvider` interface (DD-016) without touching the BFF or the AI service's public API, whenever real GPU infra exists

## 16. Known Issues

- **NVIDIA NIM's shared/free-tier hosted endpoint has shown three distinct real reliability failures during this project** (queue congestion — 441 requests queued; a reasoning model, nemotron-3-nano, unable to complete the actual task even with an adequate token budget; and a full model deployment outage — `minimax-m3` returned `DEGRADED function cannot be invoked` on 42/42 cases in the one full evaluation attempt). None of these are harness bugs — all reproduced with raw HTTP calls bypassing all project code. See §9 for the full trail. This is *why* DD-016's `MockProvider` exists as the default — the system doesn't depend on NIM's uptime to be built or demoed, but real generation quality/reliability numbers (Milestone 1.1's actual purpose) still don't exist yet.
- **Stray whole-drive git repo at `/media/samarth/DataFiles/.git`** — `core.worktree = D:/`, a broken leftover from a Windows dual-boot setup. All git commands against it fail. Left untouched; do not use. This project's repo is `project/.git` (see DD-004).
- **CT-07 rating-level content rules not yet encoded** — the taxonomy defines the *levels* (e.g. MPAA `PG-13`) but not the specific content rules per level. Required before NeMo Guardrails integration (still not started).
- **Multilingual coverage in Milestone 1.1's test set is a subset (4 of 11 languages in CT-06).**
- **No browser automation/screenshot tool available in this environment.** Every screen this session was verified at the API/data level (real HTTP requests, §2) and via `next build`/`tsc --noEmit`/`eslint` — not an actual visual/pixel or interaction check in a browser. See Pending Tasks — recommend a real click-through next.
- **No git remote configured.** Deliberate, since the last remote (added outside this conversation, no review step) leaked a secret to a public repo — see DD-013. Local history was wiped and reinitialized; this project currently has **zero commits and no remote**. Before adding a remote again: confirm `.gitignore` coverage and review `git status`/`git diff` before the first push, especially for any `.env*` file.
- **`.github/workflows/ci.yml`'s three jobs have never run on real GitHub Actions** — no remote to push to. Validated locally as much as possible (YAML parses, `prek run --all-files` passes clean including against the workflow file itself). Treat the first push as this workflow's actual first test.
- **AI service has no automated tests** — verification was manual (`curl` against all 4 endpoints, both standalone and through the full BFF path) and lint/typecheck, not a pytest suite.
- **`ai-service/.env` doesn't exist yet** — not needed for the default `MODEL_PROVIDER=mock` path (which is what's been verified end-to-end), but required before `MODEL_PROVIDER=nim` can be tested through the full BFF→AI-service path rather than direct `ai/eval/` scripts.

## 17. Technical Debt

- **No automated test suite anywhere** (`frontend/`, `ai/`, `ai-service/`) — every verification this session was build/lint/typecheck/manual-curl. Fine for a fast-moving build phase, but real tests (especially around the BFF↔AI-service contract and the constraint-taxonomy seed/serve round-trip) should land before this goes much further.
- **`Export` Prisma model is unused** (DD-020) — export works via on-demand streaming, but there's no download history, and the model sits in the schema unreferenced by any query. Either wire it up once object storage exists, or reconsider whether it belongs in the schema at all if on-demand-only turns out to be sufficient.
- **`ai-service`'s `NimProvider` and `ai/eval`'s `nim_client.py` duplicate similar timeout/retry/JSON-parsing logic** (by design — DD-016's rationale was independent deployability of the AI service — but worth a second look if the two ever drift in behavior instead of just in dependencies).

## 18. Future Improvements

- RAPIDS-accelerated constraint-failure analytics (source plan §7.7) — optional, only if core functionality is ahead of schedule by Phase 4.

## 19. Development Log

### Entry 9 — Public landing page added (IA gap fix)
**Logical time:** Immediately after Entry 8
**Task completed:** User noticed there was no public landing page — `/` was the authenticated dashboard itself, so unauthenticated visitors hit an instant redirect to `/login` with nothing public to see. This was a real gap against the originally-approved architecture plan (§1 references it: "/ marketing landing (unauthenticated)... /app dashboard"), silently cut during Entry 7's "build the whole thing" push without being flagged at the time. Fixed properly rather than patched around: moved the dashboard to `/dashboard`, built a real public landing page at `/` (hero, feature grid, session-aware CTA — "Get started" for logged-out visitors, "Go to dashboard" for logged-in ones), and updated every path that assumed `/` was the dashboard.
**Files created:** `frontend/src/app/page.tsx` (new — public landing), `frontend/src/app/dashboard/page.tsx` (moved from `frontend/src/app/page.tsx`, content unchanged)
**Files modified:** `frontend/src/proxy.ts` (switched `PUBLIC_PATHS` to an exact-match `Set` including `"/"` — prefix-matching `"/"` would have made every route public, a real bug avoided by design, not by luck), `frontend/src/components/app-shell.tsx` (same exact-match fix for `CHROME_LESS_PATHS`, nav links + logo now point at `/dashboard`), `frontend/src/app/login/page.tsx` + `signup/page.tsx` (post-auth redirect default changed from `/` to `/dashboard`), `frontend/src/app/projects/[id]/page.tsx` + `variants/[id]/page.tsx` ("Back to dashboard" links updated).
**Files deleted:** none
**Reason for change:** direct user observation of a real product gap.
**Architectural decisions:** none new — this restores the originally-approved IA (see the plan file referenced in §1) rather than introducing a new one.
**Verification:** `next build`/`eslint` clean; confirmed via curl against the running dev server: `GET /` → 200 with landing page content, `GET /dashboard` (no session) → 307 redirect to `/login?redirect=%2Fdashboard`. Grepped the whole `frontend/src` tree for any remaining `href="/"` or `push("/")` assuming the old routing — none found.
**Known issues:** none new.
**Next recommended task:** same as Entry 8 — a real browser click-through, sub-milestone 2.5 polish, or resuming Milestone 1.1's NIM evaluation.

### Entry 8 — Real database connected; full system verified end-to-end
**Logical time:** Immediately after Entry 7
**Task completed:** Fixed the Postgres connection (two distinct real issues, not one), ran the first real migration and seed, then exercised the complete signup→generate→refine→export flow with real HTTP requests against the running dev server.

**Connection issue #1 (DD-019, already known):** Supabase's direct connection (`db.<ref>.supabase.co:5432`) is IPv6-only; this sandbox has no IPv6 route. User initially re-provided the same direct-connection string twice before finding Supabase's dashboard had moved connection strings behind a "Connect" button rather than the Database Settings page. Guided them to the pooler-specific connection string instead.

**Connection issue #2 (new — DD-021):** with the correct pooler *host*, `prisma migrate dev` connected but then hung indefinitely with zero output for several minutes — not slow, actually stuck. Diagnosed rather than assumed: the connection string used transaction-mode pooling (port 6543), which doesn't support the session-persistent advisory locks `prisma migrate` needs. Verified port 5432 (session mode) was reachable on the same host before touching anything, then switched only the port number in `frontend/.env` (not a full credential rewrite) — migration succeeded immediately.

**First real migration + seed:** `prisma migrate dev --name init` created every table from `schema.prisma` in the live database. `prisma db seed` populated 70 `ConstraintOption` rows across 9 dimensions from `docs/constraint-taxonomy-v1.md`.

**End-to-end verification (real HTTP requests, cookie-jar session, against `localhost:3001` + the AI service at `localhost:8000`):** signed up a test user (`POST /api/auth/sign-up/email`) → confirmed org auto-provisioning fired (DD-008's database hook) → fetched the real seeded taxonomy → created a project with a full 8-dimension brief, which triggered real generation through the AI service and persisted 3 distinct variants → fetched variant detail with nested relations → refined a variant (created a linked child Variant, confirmed AC-04-style structural preservation) → exported both `.txt` (well-formatted) and `.pdf` (confirmed via `file`, genuinely valid PDF 1.7) → regenerated a new brief version (version 2, 3 more variants) → confirmed unauthenticated requests redirect to `/login` (proxy.ts working) → confirmed malformed input gets a clean 400 (Zod validation working). Every piece built in Entry 7 actually works, not just compiles.
**Files created:** none (verification only)
**Files modified:** `frontend/.env` (`DATABASE_URL` — pooler host, then pooler port; no other content changed), `design.md` (§2, §5 DD-021, §12–16, this entry)
**Files deleted:** temporary verification scripts (`/tmp/cleanup-e2e.ts`, curl response captures) — all cleaned up, not committed
**Reason for change:** this was the one remaining blocker on everything built in Entry 7; closing it converts "built" into "verified working."
**Architectural decisions:** DD-021 (session-pooler over transaction-pooler for `DATABASE_URL`, and why Prisma 7 can't split this into `directUrl`/`url` the old way).
**Verification:** see above — this entire entry *is* the verification record. Test data (one user, one org, two projects, six variants) was created in the real Supabase database and then explicitly cleaned up afterward via a one-off script, not left behind.
**Known issues:** no in-browser click-through yet (no browser automation tool); NIM reliability still unresolved (§9); no automated test suite (§16, §17).
**Next recommended task:** either a real browser click-through of the running dev servers, or sub-milestone 2.5 (polish — motion, command palette, PostHog/Pino), or returning to Milestone 1.1's real NIM evaluation if NVIDIA's platform has stabilized.

### Entry 7 — Full-stack build: AI service, BFF, frontend rewired end-to-end
**Logical time:** Immediately after Entry 6, spanning the rest of the session
**Task completed:** User asked to "complete the whole project frontend, backend, all the connections... leave the model part as a separate module... plug and go... build it end to end with all the phases." Built sub-milestones 2.2–2.4 together (AI service, BFF API layer, frontend rewrite) rather than strictly sequentially, since they're tightly coupled. Discovered and fixed several real bugs along the way rather than treating first-pass code as done.

**AI service (`ai-service/`, new):** FastAPI app; `ModelProvider` abstract interface (DD-016) with `MockProvider` (deterministic, instant) and `NimProvider` (real NIM, carrying forward every lesson from Milestone 1.1's debugging — timeout, retry, defensive JSON parsing, 8192-token budget); 4 endpoints (`/health`, `/internal/generate`, `/internal/refine`, `/internal/validate`), shared-secret auth dependency. Verified end-to-end via direct curl against all 4 endpoints with the mock provider. Found and fixed a real bug during that verification: two variants got an identical logline because independent per-variant random draws happened to collide — fixed by shuffling an option pool once per call and cycling through by index instead.

**BFF (`frontend/src/app/api/*`, `lib/*`, `hooks/*`, new):** `ai-service-client.ts` (server-only typed client), Zod validation (`lib/validations/brief.ts`), camelCase↔snake_case mappers (`lib/mappers.ts`), `session.ts` (org-scoped auth helper), 8 Route Handlers covering the full FR-01–FR-08 flow, PDF/text export via `pdf-lib` rendered on-demand (DD-020 — no object storage yet, so not persisted), a Prisma seed script transcribing `docs/constraint-taxonomy-v1.md` into `ConstraintOption`, and 3 TanStack Query hook modules.

**Frontend rewrite:** every Phase 1 screen rewired from `mock-data.ts` to real API calls — dashboard (`useProjects`), brief form (`useConstraintTaxonomy` + `useCreateProject`, plus a new required "project title" field), a new `projects/[id]` page (replaces the old generic `/variants` list — a project's variants, not a global pool), variant detail (`useVariant`, real refine via `useRefineVariant`, real export triggering a browser download). `app-shell.tsx` became a client component with a real session-aware sign-out button. Deleted `mock-data.ts`, the old hardcoded `constraint-taxonomy.ts`, and the generic `/variants/page.tsx` — confirmed via grep that nothing referenced them before deleting.

**Real bugs found and fixed while wiring this up (not just written once and left):**
- Prisma 7's `Json` field inputs need `as unknown as Prisma.InputJsonValue`, not a direct cast — TS correctly refuses a plain interface without an index signature.
- Next.js 16 renamed `middleware.ts` → `proxy.ts` (`export function proxy`, not `middleware`) — caught by the build's own deprecation warning, confirmed against the bundled docs before renaming (DD-017).
- `useSearchParams()` on `/login` needed a `Suspense` boundary or the build fails outright — extracted the form into a child component, wrapped it.
- Attempting `prisma migrate dev` against the real `DATABASE_URL` failed with `P1001: Can't reach database server` — root-caused to Supabase's direct connection being IPv6-only (`getent hosts` confirmed an IPv6-only A record; this sandbox has no IPv6 route) — DD-019. This is the one blocker left; everything else in this entry is code-complete and build/lint/typecheck-clean but DB-unverified.

**Files created:** `ai-service/` (entire new service — see §3), `frontend/src/app/api/**` (8 route files), `frontend/src/lib/{ai-service-client,mappers,session,api-client,api-helpers,variants,export}.ts`, `frontend/src/lib/validations/brief.ts`, `frontend/src/hooks/{use-projects,use-variants,use-constraint-taxonomy}.ts`, `frontend/prisma/seed.ts`, `frontend/src/app/projects/[id]/page.tsx`, `frontend/src/proxy.ts` (renamed from a since-deleted `middleware.ts`).
**Files modified:** `frontend/src/lib/types.ts` (real API types replacing the Phase 1 provisional shape), `frontend/src/components/{variant-card,variant-compare-table,export-dialog,refinement-panel,constraint-form,app-shell}.tsx`, `frontend/src/app/{page,login/page,variants/[id]/page}.tsx`, `frontend/prisma.config.ts` (seed wiring), `.pre-commit-config.yaml` + `.github/workflows/ci.yml` (ai-service coverage), `design.md` (this entry and nearly every section above).
**Files deleted:** `frontend/src/lib/mock-data.ts`, `frontend/src/lib/constraint-taxonomy.ts` (Phase 1 hardcoded version), `frontend/src/app/variants/page.tsx`.
**Reason for change:** direct user request to complete the full stack, explicitly asking for the model-provider abstraction that DD-016 delivers.
**Architectural decisions:** DD-016 (pluggable `ModelProvider`), DD-017 (Next.js 16 proxy rename), DD-018 (Prisma Json cast), DD-019 (Supabase IPv6 blocker), DD-020 (on-demand export, no blob storage yet).
**Verification:** `next build`, `tsc --noEmit`, `eslint` (frontend) and `ruff check` (both Python services) all clean; `prek run --all-files` 12/12 clean; AI service's 4 endpoints manually verified via curl against the mock provider. **Not verified:** anything requiring a live Postgres connection — see DD-019, this is the honest, primary gap.
**Known issues:** see §16 — DATABASE_URL/IPv6, no automated test suite, NIM reliability findings, Export model unused pending object storage.
**Next recommended task:** user fixes `DATABASE_URL` to the Supabase pooler string → run `prisma migrate dev` → smoke-test the full flow (signup → create project → generate against mock provider → refine → export) → only then consider sub-milestone 2.5 (polish) or revisiting real NIM generation.

### Entry 6 — GitHub Actions CI added (backstop for the local git hooks)
**Logical time:** Immediately after Entry 5
**Task completed:** Added `.github/workflows/ci.yml` — two jobs (`pre-commit`, running the identical `.pre-commit-config.yaml` via the official `pre-commit/action`; `frontend-build`, a plain `npm run build`), triggered on every push and PR to `main`.
**Files created:** `.github/workflows/ci.yml`
**Files modified:** `design.md` (§3, §5 DD-015, §16, this entry)
**Files deleted:** none
**Reason for change:** user explicitly asked for CI-level checks in addition to local hooks — the correct instinct, since local hooks are skippable/optional in a way CI isn't.
**Architectural decisions:** DD-015 (§5) — reuse the same `.pre-commit-config.yaml` in CI via the official `pre-commit/action` rather than hand-duplicating hook logic in YAML or trying to wire up `prek` itself in a runner this session can't test against.
**Verification:** YAML syntax validated locally (with `"on"` explicitly quoted to sidestep the YAML-1.1-boolean-coercion quirk); `prek run --all-files` passes clean including against the new workflow file itself (gitleaks correctly does not flag the workflow's clearly-fake placeholder `DATABASE_URL`). **Not** verified against an actual GitHub Actions run — no remote exists right now (see Known Issues).
**Remaining work:** none for this task itself; real verification happens on the first push to a new remote.
**Known issues:** see §16 — workflow execution itself is unverified.
**Next recommended task:** when a new GitHub remote is created, the first push is the real test of this workflow — check the Actions tab after pushing.

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

Full tree is documented in §3 (kept in one place rather than duplicated — §3 is now accurate as of this session's end, not a stale Phase 1 snapshot). Summary of what changed structurally this entry:

- **New top-level directory:** `ai-service/` — the internal AI orchestration service (see §3).
- **`frontend/`**: gained `src/hooks/`, `src/lib/{ai-service-client,mappers,session,api-client,api-helpers,variants,export}.ts`, `src/lib/validations/brief.ts`, `src/app/api/{projects,variants,constraint-taxonomy,generation-runs}/**`, `src/app/projects/[id]/`, `prisma/seed.ts`, `src/proxy.ts` (renamed from `middleware.ts`, DD-017). Lost `src/lib/mock-data.ts`, `src/lib/constraint-taxonomy.ts` (Phase 1 hardcoded version), `src/app/variants/page.tsx` — all deleted, confirmed unreferenced first.
- **`ai/`**: unchanged this entry — kept as the Milestone 1.1 evaluation harness, not merged into `ai-service/` (deliberate — see DD-016's rationale for keeping them as separate, independently-deployable units).

**Git:** repository at `project/`, branch `main`, still zero commits and no remote (deliberate, post-incident — see §16). Everything in this entry exists only in the working tree; nothing has been committed. `frontend/prisma/migrations/20260712101713_init/` now exists on disk too — the first real migration, applied to the live Supabase database.

**What actually runs right now — both are live, from this session, and fully functional (verified §2, Entry 8):**
- AI service at `http://localhost:8000` (`MODEL_PROVIDER=mock`, no `.env` needed for this path).
- Frontend dev server at `http://localhost:3001` (port 3000 was occupied), connected to the real Supabase database via the session-pooler `DATABASE_URL` (DD-021).
