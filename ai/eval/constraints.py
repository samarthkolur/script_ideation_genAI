"""Machine-readable mirror of docs/constraint-taxonomy-v1.md (CT-01..CT-08).

Why this exists: the eval harness needs to build prompts and check outputs
against real constraint values, not prose. `docs/constraint-taxonomy-v1.md`
is the human-readable source of truth; this module is its code counterpart
for Phase 1. In Milestone 1.2 this gets promoted into `schemas/` as a
formal JSON Schema shared with the frontend — kept as a plain Python module
here to avoid building schema tooling before Milestone 1.2 needs it.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ConstraintBrief:
    """One fully-specified creative brief — the input to a generation call."""

    id: str
    genres: list[str]
    audience: str
    budget_tier: str
    runtime_minutes: int
    region: str
    language: str
    censorship_framework: str
    censorship_rating: str
    location_type: str
    cast_size: str
    vfx_dependency: str

    def as_prompt_dict(self) -> dict:
        return {
            "genres": self.genres,
            "target_audience": AUDIENCE_LABELS[self.audience],
            "budget_tier": BUDGET_LABELS[self.budget_tier],
            "runtime_minutes": self.runtime_minutes,
            "region": REGION_LABELS[self.region],
            "output_language": LANGUAGE_LABELS[self.language],
            "censorship_framework": self.censorship_framework.upper(),
            "censorship_rating": self.censorship_rating,
            "production_constraints": {
                "location_type": self.location_type.replace("_", " "),
                "cast_size": self.cast_size.replace("_", " "),
                "vfx_dependency": self.vfx_dependency.replace("_", " "),
            },
        }


GENRES = [
    "drama", "comedy", "thriller", "horror", "action", "romance", "scifi",
    "fantasy", "crime_mystery", "coming_of_age", "family", "historical",
    "war", "satire", "musical",
]

AUDIENCE_LABELS = {
    "children": "Children (0-8)",
    "family_all_ages": "Family (All Ages)",
    "tween": "Tween (9-12)",
    "teen": "Teen (13-17)",
    "young_adult": "Young Adult (18-24)",
    "adult": "Adult (18+)",
    "mature": "Mature (21+)",
}

# code -> (label, production ceiling description used for adherence checks)
BUDGET_TIERS = {
    "micro": ("Micro-Budget (<$250K)", {"max_locations": 2, "max_cast": 5, "max_vfx": "none"}),
    "low": ("Low-Budget ($250K-$2M)", {"max_locations": 4, "max_cast": 10, "max_vfx": "light"}),
    "mid": ("Mid-Budget ($2M-$20M)", {"max_locations": 99, "max_cast": 20, "max_vfx": "moderate"}),
    "high": ("High-Budget (>$20M)", {"max_locations": 99, "max_cast": 999, "max_vfx": "heavy"}),
}
BUDGET_LABELS = {k: v[0] for k, v in BUDGET_TIERS.items()}

REGION_LABELS = {
    "us": "United States", "uk": "United Kingdom", "india": "India",
    "canada": "Canada", "australia": "Australia", "germany": "Germany",
    "france": "France", "japan": "Japan", "south_korea": "South Korea",
    "nigeria": "Nigeria", "global": "Global / Unspecified",
}
REGION_DEFAULT_FRAMEWORK = {
    "us": "mpaa", "uk": "bbfc", "india": "cbfc", "canada": "mpaa",
    "australia": "classification_au", "germany": "fsk", "france": "cnc",
    "japan": "eirin", "south_korea": "kmrb", "nigeria": "nfvcb",
    "global": "generic",
}

LANGUAGE_LABELS = {
    "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
    "de": "German", "ja": "Japanese", "ko": "Korean", "pt": "Portuguese",
    "ar": "Arabic", "ta": "Tamil", "zh": "Mandarin Chinese",
}

VFX_ORDER = ["none", "light", "moderate", "heavy"]  # mild -> strict, for ceiling checks
CAST_SIZE_MAX = {"minimal": 3, "small": 8, "medium": 15, "large_ensemble": 999}
LOCATION_TYPE_MAX = {"single_location": 1, "limited_locations": 3, "multiple_locations": 99, "international": 99}

# Rating levels per CT-07 framework, mildest -> strictest.
FRAMEWORK_RATINGS = {
    "mpaa": ["G", "PG", "PG13", "R", "NC17"],
    "bbfc": ["U", "PG", "12A", "15", "18"],
    "cbfc": ["U", "UA7", "UA13", "UA16", "A"],
    "fsk": ["FSK0", "FSK6", "FSK12", "FSK16", "FSK18"],
    "cnc": ["TP", "10", "12", "16", "18"],
    "eirin": ["G", "PG12", "R15", "R18"],
    "kmrb": ["ALL", "12", "15", "18"],
    "classification_au": ["G", "PG", "M", "MA15", "R18"],
    "nfvcb": ["G", "PG", "12", "15", "18"],
    "generic": ["mild", "moderate", "mature"],
}

# Audience -> approximate severity index into a framework's rating list.
_AUDIENCE_SEVERITY = {
    "children": 0, "family_all_ages": 0, "tween": 1, "teen": 2,
    "young_adult": 3, "adult": 3, "mature": 4,
}


def pick_rating(framework: str, audience: str) -> str:
    """Pick the rating level matching an audience's severity for a framework."""
    levels = FRAMEWORK_RATINGS[framework]
    index = min(_AUDIENCE_SEVERITY[audience], len(levels) - 1)
    return levels[index]
