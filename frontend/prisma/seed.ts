/**
 * Seeds ConstraintOption from docs/constraint-taxonomy-v1.md (CT-01..CT-08).
 * That markdown file stays the human-readable source of truth; this is its
 * one-time transcription into the DB, which is the actual source of truth
 * at runtime (design.md DD-007, NFR-08). Idempotent — safe to re-run
 * (upserts on the [dimension, code] unique constraint).
 *
 * Run with: npx prisma db seed  (or automatically after `prisma migrate dev`)
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

type Row = { dimension: string; code: string; label: string; metadata?: object };

const GENRES: Row[] = [
  ["drama", "Drama"], ["comedy", "Comedy"], ["thriller", "Thriller"], ["horror", "Horror"],
  ["action", "Action"], ["romance", "Romance"], ["scifi", "Science Fiction"], ["fantasy", "Fantasy"],
  ["crime_mystery", "Crime / Mystery"], ["coming_of_age", "Coming-of-Age"], ["family", "Family"],
  ["historical", "Historical / Period"], ["war", "War"], ["satire", "Satire / Dark Comedy"],
  ["musical", "Musical"],
].map(([code, label]) => ({ dimension: "genre", code, label }));

const AUDIENCES: Row[] = [
  ["children", "Children (0-8)"], ["family_all_ages", "Family (All Ages)"], ["tween", "Tween (9-12)"],
  ["teen", "Teen (13-17)"], ["young_adult", "Young Adult (18-24)"], ["adult", "Adult (18+)"],
  ["mature", "Mature (21+)"],
].map(([code, label]) => ({ dimension: "audience", code, label }));

const BUDGET_TIERS: Row[] = [
  { dimension: "budget_tier", code: "micro", label: "Micro-Budget (<$250K)", metadata: { maxLocations: 2, maxCast: 5, maxVfx: "none" } },
  { dimension: "budget_tier", code: "low", label: "Low-Budget ($250K-$2M)", metadata: { maxLocations: 4, maxCast: 10, maxVfx: "light" } },
  { dimension: "budget_tier", code: "mid", label: "Mid-Budget ($2M-$20M)", metadata: { maxLocations: 99, maxCast: 20, maxVfx: "moderate" } },
  { dimension: "budget_tier", code: "high", label: "High-Budget (>$20M)", metadata: { maxLocations: 99, maxCast: 999, maxVfx: "heavy" } },
];

const REGION_DEFAULT_FRAMEWORK: Record<string, string> = {
  us: "mpaa", uk: "bbfc", india: "cbfc", canada: "mpaa", australia: "classification_au",
  germany: "fsk", france: "cnc", japan: "eirin", south_korea: "kmrb", nigeria: "nfvcb", global: "generic",
};
const REGIONS: Row[] = [
  ["us", "United States"], ["uk", "United Kingdom"], ["india", "India"], ["canada", "Canada"],
  ["australia", "Australia"], ["germany", "Germany"], ["france", "France"], ["japan", "Japan"],
  ["south_korea", "South Korea"], ["nigeria", "Nigeria"], ["global", "Global / Unspecified"],
].map(([code, label]) => ({
  dimension: "region",
  code,
  label,
  metadata: { defaultCensorshipFramework: REGION_DEFAULT_FRAMEWORK[code] },
}));

const LANGUAGES: Row[] = [
  ["en", "English"], ["hi", "Hindi"], ["es", "Spanish"], ["fr", "French"], ["de", "German"],
  ["ja", "Japanese"], ["ko", "Korean"], ["pt", "Portuguese"], ["ar", "Arabic"], ["ta", "Tamil"],
  ["zh", "Mandarin Chinese"],
].map(([code, label]) => ({ dimension: "language", code, label }));

const CENSORSHIP_FRAMEWORKS: Row[] = [
  { dimension: "censorship_framework", code: "mpaa", label: "MPAA (USA)", metadata: { ratings: ["G", "PG", "PG13", "R", "NC17"] } },
  { dimension: "censorship_framework", code: "bbfc", label: "BBFC (UK)", metadata: { ratings: ["U", "PG", "12A", "15", "18"] } },
  { dimension: "censorship_framework", code: "cbfc", label: "CBFC (India)", metadata: { ratings: ["U", "UA7", "UA13", "UA16", "A"] } },
  { dimension: "censorship_framework", code: "fsk", label: "FSK (Germany)", metadata: { ratings: ["FSK0", "FSK6", "FSK12", "FSK16", "FSK18"] } },
  { dimension: "censorship_framework", code: "cnc", label: "CNC (France)", metadata: { ratings: ["TP", "10", "12", "16", "18"] } },
  { dimension: "censorship_framework", code: "eirin", label: "Eirin (Japan)", metadata: { ratings: ["G", "PG12", "R15", "R18"] } },
  { dimension: "censorship_framework", code: "kmrb", label: "KMRB (South Korea)", metadata: { ratings: ["ALL", "12", "15", "18"] } },
  { dimension: "censorship_framework", code: "classification_au", label: "Classification Board (Australia)", metadata: { ratings: ["G", "PG", "M", "MA15", "R18"] } },
  { dimension: "censorship_framework", code: "nfvcb", label: "NFVCB (Nigeria)", metadata: { ratings: ["G", "PG", "12", "15", "18"] } },
  { dimension: "censorship_framework", code: "generic", label: "Generic / Unspecified", metadata: { ratings: ["mild", "moderate", "mature"] } },
];

const LOCATION_TYPES: Row[] = [
  ["single_location", "Single Location"], ["limited_locations", "Limited Locations (2-3)"],
  ["multiple_locations", "Multiple Locations"], ["international", "International / Exotic Locations"],
].map(([code, label]) => ({ dimension: "location_type", code, label }));

const CAST_SIZES: Row[] = [
  ["minimal", "Minimal (1-3 principal)"], ["small", "Small (4-8)"], ["medium", "Medium (9-15)"],
  ["large_ensemble", "Large Ensemble (16+)"],
].map(([code, label]) => ({ dimension: "cast_size", code, label }));

const VFX_LEVELS: Row[] = [
  ["none", "None / Practical Only"], ["light", "Light VFX"], ["moderate", "Moderate VFX"],
  ["heavy", "Heavy VFX / CGI-Driven"],
].map(([code, label]) => ({ dimension: "vfx_dependency", code, label }));

const ALL_ROWS = [
  ...GENRES, ...AUDIENCES, ...BUDGET_TIERS, ...REGIONS, ...LANGUAGES,
  ...CENSORSHIP_FRAMEWORKS, ...LOCATION_TYPES, ...CAST_SIZES, ...VFX_LEVELS,
];

async function main() {
  const byDimension = new Map<string, number>();
  for (const row of ALL_ROWS) {
    const sortOrder = byDimension.get(row.dimension) ?? 0;
    byDimension.set(row.dimension, sortOrder + 1);
    await db.constraintOption.upsert({
      where: { dimension_code: { dimension: row.dimension, code: row.code } },
      update: { label: row.label, metadata: row.metadata, sortOrder },
      create: { dimension: row.dimension, code: row.code, label: row.label, metadata: row.metadata, sortOrder },
    });
  }
  console.log(`Seeded ${ALL_ROWS.length} constraint options across ${byDimension.size} dimensions.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
