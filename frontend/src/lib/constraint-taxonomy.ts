/**
 * TypeScript mirror of docs/constraint-taxonomy-v1.md (CT-01..CT-08).
 *
 * Why this exists: the constraint input form needs real, coded option
 * lists — not placeholder text — so the wireframe is reviewable against
 * the actual taxonomy, not a guess at it. Codes match ai/eval/constraints.py
 * exactly (both mirror the same source-of-truth doc) so a future shared
 * schema (Milestone 1.2, schemas/) can supersede both without a values
 * rewrite, only a wiring change.
 */

export interface Option {
  code: string;
  label: string;
}

export const GENRES: Option[] = [
  { code: "drama", label: "Drama" },
  { code: "comedy", label: "Comedy" },
  { code: "thriller", label: "Thriller" },
  { code: "horror", label: "Horror" },
  { code: "action", label: "Action" },
  { code: "romance", label: "Romance" },
  { code: "scifi", label: "Science Fiction" },
  { code: "fantasy", label: "Fantasy" },
  { code: "crime_mystery", label: "Crime / Mystery" },
  { code: "coming_of_age", label: "Coming-of-Age" },
  { code: "family", label: "Family" },
  { code: "historical", label: "Historical / Period" },
  { code: "war", label: "War" },
  { code: "satire", label: "Satire / Dark Comedy" },
  { code: "musical", label: "Musical" },
];

export const AUDIENCES: Option[] = [
  { code: "children", label: "Children (0-8)" },
  { code: "family_all_ages", label: "Family (All Ages)" },
  { code: "tween", label: "Tween (9-12)" },
  { code: "teen", label: "Teen (13-17)" },
  { code: "young_adult", label: "Young Adult (18-24)" },
  { code: "adult", label: "Adult (18+)" },
  { code: "mature", label: "Mature (21+)" },
];

export const BUDGET_TIERS: Option[] = [
  { code: "micro", label: "Micro-Budget (<$250K)" },
  { code: "low", label: "Low-Budget ($250K-$2M)" },
  { code: "mid", label: "Mid-Budget ($2M-$20M)" },
  { code: "high", label: "High-Budget (>$20M)" },
];

export const REGIONS: Option[] = [
  { code: "us", label: "United States" },
  { code: "uk", label: "United Kingdom" },
  { code: "india", label: "India" },
  { code: "canada", label: "Canada" },
  { code: "australia", label: "Australia" },
  { code: "germany", label: "Germany" },
  { code: "france", label: "France" },
  { code: "japan", label: "Japan" },
  { code: "south_korea", label: "South Korea" },
  { code: "nigeria", label: "Nigeria" },
  { code: "global", label: "Global / Unspecified" },
];

export const REGION_DEFAULT_FRAMEWORK: Record<string, string> = {
  us: "mpaa", uk: "bbfc", india: "cbfc", canada: "mpaa",
  australia: "classification_au", germany: "fsk", france: "cnc",
  japan: "eirin", south_korea: "kmrb", nigeria: "nfvcb", global: "generic",
};

export const LANGUAGES: Option[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "ta", label: "Tamil" },
  { code: "zh", label: "Mandarin Chinese" },
];

export const CENSORSHIP_FRAMEWORKS: Record<string, { label: string; ratings: string[] }> = {
  mpaa: { label: "MPAA (USA)", ratings: ["G", "PG", "PG13", "R", "NC17"] },
  bbfc: { label: "BBFC (UK)", ratings: ["U", "PG", "12A", "15", "18"] },
  cbfc: { label: "CBFC (India)", ratings: ["U", "UA7", "UA13", "UA16", "A"] },
  fsk: { label: "FSK (Germany)", ratings: ["FSK0", "FSK6", "FSK12", "FSK16", "FSK18"] },
  cnc: { label: "CNC (France)", ratings: ["TP", "10", "12", "16", "18"] },
  eirin: { label: "Eirin (Japan)", ratings: ["G", "PG12", "R15", "R18"] },
  kmrb: { label: "KMRB (South Korea)", ratings: ["ALL", "12", "15", "18"] },
  classification_au: { label: "Classification Board (Australia)", ratings: ["G", "PG", "M", "MA15", "R18"] },
  nfvcb: { label: "NFVCB (Nigeria)", ratings: ["G", "PG", "12", "15", "18"] },
  generic: { label: "Generic / Unspecified", ratings: ["mild", "moderate", "mature"] },
};

export const LOCATION_TYPES: Option[] = [
  { code: "single_location", label: "Single Location" },
  { code: "limited_locations", label: "Limited Locations (2-3)" },
  { code: "multiple_locations", label: "Multiple Locations" },
  { code: "international", label: "International / Exotic Locations" },
];

export const CAST_SIZES: Option[] = [
  { code: "minimal", label: "Minimal (1-3 principal)" },
  { code: "small", label: "Small (4-8)" },
  { code: "medium", label: "Medium (9-15)" },
  { code: "large_ensemble", label: "Large Ensemble (16+)" },
];

export const VFX_LEVELS: Option[] = [
  { code: "none", label: "None / Practical Only" },
  { code: "light", label: "Light VFX" },
  { code: "moderate", label: "Moderate VFX" },
  { code: "heavy", label: "Heavy VFX / CGI-Driven" },
];

export const RUNTIME_PRESETS: Option[] = [
  { code: "short", label: "Short Film (5-20 min)" },
  { code: "mid_short", label: "Mid-Length (21-59 min)" },
  { code: "feature", label: "Standard Feature (60-120 min)" },
  { code: "extended", label: "Extended Feature (121-240 min)" },
];
