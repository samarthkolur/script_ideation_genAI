# Constraint Taxonomy v1

**Status:** Approved for Phase 1 use
**Owner:** AI Engineering
**Produced in:** Phase 1, Milestone 1.0 (pulled forward from Phase 0 because Phase 1's wireframe and schema work directly depend on it — see `design.md` Development Log for the justification)

## Purpose

Defines the concrete, enumerable values for each of the 8 constraint dimensions from FR-01. This is the single source of truth for:
- The constraint input form (frontend)
- The `Variant Output Schema` enums (`schemas/`)
- The prompt architecture's constraint-injection templates (`ai/prompts/`)
- The Phase 2 constraint validation engine

Every dimension has a stable **code** (used in schemas/APIs) and a **label** (used in UI). Codes are versioned — do not silently rename a code; add a new one and deprecate the old.

---

## CT-01 — Genre

Multi-select, 1–2 values (blended genre = primary + secondary).

| Code | Label |
|---|---|
| `drama` | Drama |
| `comedy` | Comedy |
| `thriller` | Thriller |
| `horror` | Horror |
| `action` | Action |
| `romance` | Romance |
| `scifi` | Science Fiction |
| `fantasy` | Fantasy |
| `crime_mystery` | Crime / Mystery |
| `coming_of_age` | Coming-of-Age |
| `family` | Family |
| `historical` | Historical / Period |
| `war` | War |
| `satire` | Satire / Dark Comedy |
| `musical` | Musical |

## CT-02 — Target Audience

Single-select age band, plus optional free-text demographic descriptor (max 100 chars, not constraint-validated, used only as creative flavor).

| Code | Label | Notes |
|---|---|---|
| `children` | Children (0–8) | No violence, no romantic content |
| `family_all_ages` | Family (All Ages) | Mild peril only |
| `tween` | Tween (9–12) | Light thematic conflict allowed |
| `teen` | Teen (13–17) | Moderate thematic intensity |
| `young_adult` | Young Adult (18–24) | Full thematic range |
| `adult` | Adult (18+) | Full thematic range |
| `mature` | Mature (21+) | Graphic/intense content allowed within legal limits |

## CT-03 — Budget Tier

Drives production-complexity ceiling (cast size, VFX, locations) that the generation engine must respect.

| Code | Label | Indicative Range (USD) | Production Ceiling |
|---|---|---|---|
| `micro` | Micro-Budget | < $250K | 1–2 locations, cast ≤ 5, no VFX |
| `low` | Low-Budget | $250K – $2M | ≤ 4 locations, cast ≤ 10, light VFX |
| `mid` | Mid-Budget | $2M – $20M | Multiple locations, cast ≤ 20, moderate VFX |
| `high` | High-Budget | > $20M | Unrestricted locations/cast, heavy VFX allowed |

## CT-04 — Runtime

Numeric input, minutes. UI presents presets; underlying value is an integer 5–240.

| Code | Label | Range (min) |
|---|---|---|
| `short` | Short Film | 5–20 |
| `mid_short` | Mid-Length | 21–59 |
| `feature` | Standard Feature | 60–120 |
| `extended` | Extended Feature | 121–240 |

## CT-05 — Region (Target Market)

Determines default censorship framework suggestion and cultural context for generation.

| Code | Label | Default Censorship Framework |
|---|---|---|
| `us` | United States | `mpaa` |
| `uk` | United Kingdom | `bbfc` |
| `india` | India | `cbfc` |
| `canada` | Canada | `mpaa` |
| `australia` | Australia | `classification_au` |
| `germany` | Germany | `fsk` |
| `france` | France | `cnc` |
| `japan` | Japan | `eirin` |
| `south_korea` | South Korea | `kmrb` |
| `nigeria` | Nigeria | `nfvcb` |
| `global` | Global / Unspecified | `generic` |

## CT-06 — Language (Output Language)

Independent of region (a US-market film can be scripted in Spanish, for example).

| Code | Label |
|---|---|
| `en` | English |
| `hi` | Hindi |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `ja` | Japanese |
| `ko` | Korean |
| `pt` | Portuguese |
| `ar` | Arabic |
| `ta` | Tamil |
| `zh` | Mandarin Chinese |

**Phase 1 note:** the LLM Baseline Evaluation (Milestone 1.1) tests a subset of these (`en`, `hi`, `es`, `ja`) to establish which are production-ready vs. need a caveat. Full-language sign-off happens at end of Milestone 1.1.

## CT-07 — Censorship / Rating Framework

Each framework maps to an ordered list of rating levels, mildest to strictest. The generation engine must target the **selected level**, not just the framework.

| Framework Code | Label | Rating Levels (mild → strict) |
|---|---|---|
| `mpaa` | MPAA (USA) | `G`, `PG`, `PG13`, `R`, `NC17` |
| `bbfc` | BBFC (UK) | `U`, `PG`, `12A`, `15`, `18` |
| `cbfc` | CBFC (India) | `U`, `UA7`, `UA13`, `UA16`, `A` |
| `fsk` | FSK (Germany) | `FSK0`, `FSK6`, `FSK12`, `FSK16`, `FSK18` |
| `cnc` | CNC (France) | `TP`, `10`, `12`, `16`, `18` |
| `eirin` | Eirin (Japan) | `G`, `PG12`, `R15`, `R18` |
| `kmrb` | KMRB (South Korea) | `ALL`, `12`, `15`, `18` |
| `classification_au` | Classification Board (Australia) | `G`, `PG`, `M`, `MA15`, `R18` |
| `nfvcb` | NFVCB (Nigeria) | `G`, `PG`, `12`, `15`, `18` |
| `generic` | Generic / Unspecified | `mild`, `moderate`, `mature` |

**Known gap (documented per plan Risk DR-01):** rating-level content rules (what specifically is/isn't allowed at each level — violence detail, language, sexual content, substance use) are not yet encoded. This is a Phase 2 dependency for the NeMo Guardrails rule set and is tracked as a pending task, not a Phase 1 blocker (Phase 1 only needs the taxonomy of levels, not the rule bodies).

## CT-08 — Production Constraints

Three independent sub-dimensions, each single-select. Values must stay consistent with the CT-03 budget ceiling (UI/validation enforces this; see Phase 2 constraint validation engine).

**Location Type**
| Code | Label |
|---|---|
| `single_location` | Single Location |
| `limited_locations` | Limited Locations (2–3) |
| `multiple_locations` | Multiple Locations |
| `international` | International / Exotic Locations |

**Cast Size**
| Code | Label |
|---|---|
| `minimal` | Minimal (1–3 principal cast) |
| `small` | Small (4–8) |
| `medium` | Medium (9–15) |
| `large_ensemble` | Large Ensemble (16+) |

**VFX Dependency**
| Code | Label |
|---|---|
| `none` | None / Practical Only |
| `light` | Light VFX |
| `moderate` | Moderate VFX |
| `heavy` | Heavy VFX / CGI-Driven |

---

## Versioning

This is **v1**. Changes that add new enum values are backward-compatible (minor bump). Changes that remove or rename existing codes require a new taxonomy version and a migration note in `design.md`, since codes are persisted in session history (FR-07) and referenced in exported documents (FR-08).
