"""Pairwise diversity scoring for variants within a single generation run.

Why this exists: AR-01 in the plan's risk register flags that variants may
"converge" (lack diversity). The validation target is pairwise structural
similarity < 60% between variants from the same run.

This uses lexical Jaccard similarity over significant words (loglines +
central conflict), not embeddings — no embedding model/dependency is
justified for a Phase 1 baseline check. It's a proxy, not a semantic
similarity measure; flagged as such in the report. If Phase 2/4 quality
evaluation needs finer-grained semantic diversity, an embedding-based
metric can replace this without changing the harness's call sites.
"""

from __future__ import annotations

import re
from itertools import combinations

_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "with",
    "for", "is", "are", "was", "were", "his", "her", "their", "he", "she",
    "they", "it", "who", "when", "as", "at", "by", "from", "that", "this",
}


def _significant_words(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return {w for w in words if w not in _STOPWORDS}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def pairwise_similarity(variants: list[dict]) -> float:
    """Mean pairwise Jaccard similarity across all variant pairs (0.0-1.0)."""
    texts = [
        f"{v.get('logline', '')} {v.get('central_conflict', '')}"
        for v in variants
    ]
    word_sets = [_significant_words(t) for t in texts]
    if len(word_sets) < 2:
        return 0.0
    pairs = list(combinations(word_sets, 2))
    return sum(_jaccard(a, b) for a, b in pairs) / len(pairs)
