/**
 * Static mock content for the Milestone 1.3 wireframes.
 *
 * Why this exists: these screens are reviewed for layout/UX before any
 * backend exists (Phase 2). Content is hand-written to be representative
 * of real generation output — not lorem ipsum — so reviewers are judging
 * a realistic screen, not an abstract shell.
 */

import type { CreativeBrief, Session, Variant } from "./types";

export const MOCK_BRIEF: CreativeBrief = {
  genres: ["scifi", "drama"],
  audience: "young_adult",
  budgetTier: "low",
  runtimeMinutes: 105,
  region: "india",
  language: "en",
  censorshipFramework: "cbfc",
  censorshipRating: "UA13",
  locationType: "limited_locations",
  castSize: "small",
  vfxDependency: "light",
  freeformNotes: "Grounded, character-first sci-fi — think small-scale, not spectacle.",
};

export const MOCK_VARIANTS: Variant[] = [
  {
    id: "v1",
    logline:
      "When a city-wide network outage strips a young engineer of the neural implant that's kept her alive since childhood, she has 72 hours to find the black-market technician who can replace it — before the outage becomes permanent.",
    threeActOutline: {
      act1:
        "Mira, a implant-dependent engineer in near-future Bengaluru, loses connectivity during a citywide blackout. Her employer's official repair queue is backlogged for weeks she doesn't have.",
      act2:
        "She tracks down Kabir, a former implant surgeon now working off-grid after a scandal. He agrees to help, but only if she assists him expose the corporation whose faulty firmware caused the outage in the first place.",
      act3:
        "Mira must choose between a quiet, sanctioned repair that keeps her safe and complicit, or going public with Kabir's evidence — risking her life for a fix that could protect thousands of other implant users.",
    },
    characterArchetypes: ["The Dependent Innovator", "The Disgraced Mentor", "The Corporate Fixer"],
    centralConflict:
      "Personal survival versus collective responsibility — Mira's fastest path to safety requires staying silent about a danger that threatens everyone like her.",
    productionComplexity: "medium",
    estimatedLocations: 3,
    estimatedPrincipalCast: 6,
    vfxLevelUsed: "light",
  },
  {
    id: "v2",
    logline:
      "A grief-stricken data archivist discovers her late mother's consciousness was illegally backed up before death — and has 72 hours before the storage lapses and erases her a second time.",
    threeActOutline: {
      act1:
        "Ananya inherits her mother's personal effects and finds an unmarked drive containing a fragmentary, illegal neural backup — a technology banned after its ethical fallout a decade earlier.",
      act2:
        "She smuggles the drive to an underground restoration collective, only to learn that fully reviving the backup requires resources controlled by the same agency that banned the technology — and that her mother's backup was made without consent.",
      act3:
        "Ananya must decide whether completing the restoration honors her mother or violates the very autonomy her mother spent her life defending as a bioethics lawyer.",
    },
    characterArchetypes: ["The Reluctant Inheritor", "The Underground Technician", "The Institutional Gatekeeper"],
    centralConflict:
      "Love versus consent — reviving her mother may mean overriding the one principle her mother stood for.",
    productionComplexity: "low",
    estimatedLocations: 2,
    estimatedPrincipalCast: 5,
    vfxLevelUsed: "light",
  },
  {
    id: "v3",
    logline:
      "A veteran repair technician and the rookie she's training race to stabilize a failing orbital relay station before its collapse cuts off implant support for an entire district — with only each other to rely on.",
    threeActOutline: {
      act1:
        "Priya, a senior field technician, is paired with Devesh, a nervous first-week hire, on what should be a routine relay inspection — until sensors reveal the station is failing faster than protocol accounts for.",
      act2:
        "Cut off from ground support, they must improvise repairs with mismatched parts while confronting the reason Priya stopped training rookies after her last partner didn't make it home.",
      act3:
        "With minutes left before automatic shutdown, Devesh proposes an unauthorized fix Priya knows is dangerous — forcing her to trust a rookie's instinct over a decade of hard-earned caution.",
    },
    characterArchetypes: ["The Guarded Veteran", "The Earnest Rookie", "The Absent Institution"],
    centralConflict:
      "Trust versus trauma — Priya's caution, born from real loss, is the very thing that might get them both killed if she can't set it aside.",
    productionComplexity: "medium",
    estimatedLocations: 1,
    estimatedPrincipalCast: 3,
    vfxLevelUsed: "moderate",
  },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: "s1",
    title: "Neural implant thriller — India, low-budget",
    createdAt: "2026-07-08T10:12:00Z",
    brief: MOCK_BRIEF,
    variantCount: 3,
  },
  {
    id: "s2",
    title: "Family comedy — Nigeria, micro-budget",
    createdAt: "2026-07-06T15:40:00Z",
    brief: { ...MOCK_BRIEF, genres: ["comedy", "family"], region: "nigeria", budgetTier: "micro" },
    variantCount: 4,
  },
  {
    id: "s3",
    title: "Period drama — UK, mid-budget",
    createdAt: "2026-07-02T09:05:00Z",
    brief: { ...MOCK_BRIEF, genres: ["historical", "drama"], region: "uk", budgetTier: "mid" },
    variantCount: 5,
  },
];
