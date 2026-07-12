# LLM Baseline Evaluation Report v1

**Generated:** 2026-07-12 14:56 UTC
**Method:** Full curated test set (see ai/eval/test_prompts.py) run against one selected model

**Scoring caveat:** coherence and constraint-adherence scores are produced by an LLM judge (see `ai/eval/judge.py`), not a human review panel — the source plan calls for internal human reviewers, which a solo/no-team execution cannot provide. This is a documented substitute, not equivalent evidence; treat scores as directional, not certified.

**Diversity caveat:** diversity is measured via lexical (Jaccard) similarity over logline/conflict text, not semantic embeddings — a lightweight proxy appropriate for a Phase 1 baseline, not a precision instrument.

---

## minimaxai/minimax-m3

- Cases run: 42 (36 errored)
- Variants scored: 15
- **Overall constraint adherence:** 80.1%
- **Mean pairwise diversity similarity:** 0.06 (target: < 0.6)
- **Coherence pass rate (score ≥ 80):** 86.7%

**Per-dimension adherence (mean score, 0-100):**

| Dimension | Score |
|---|---|
| Genre | 71.5 |
| Audience | 75.1 |
| Budget/Production | 81.7 |
| Runtime | 70.9 |
| Region | 86.6 |
| Censorship Rating | 79.9 |
| Language | 95.3 |
| Coherence | 82.7 |

**Against Phase 1 success criteria:**
- Constraint adherence ≥ 70.0%: PASS
- Diversity similarity < 0.6: PASS
- Coherence pass rate ≥ 80.0%: PASS

**Weakest-scoring cases (for prompt architecture attention):**

- `TP-05` (mean 71.0): Budget adherence is the weakest dimension: the variant self-describes as 'high' production complexity with choreographed full-arcade musical numbers, a viral video arc, and a record deal payoff, which is incompatible with a micro-budget (<$250K) single-location, minimal-cast, no-VFX constraint.
- `TP-07` (mean 74.3): Runtime plausibility is the weakest dimension: a 15-minute runtime is extremely tight for a three-act romance with a sci-fi conceit, multiple locations, and a medium cast; the outline reads more like a 90+ minute feature, making the 15-minute constraint implausible.
- `TP-07` (mean 74.3): Runtime plausibility is the weakest dimension: a 15-minute runtime is extremely tight for a three-act structure with a Mars launch, AI subplot, and emotional reconciliation arc — the scope feels more like a 90–110 minute feature than a short film.
- `TP-05` (mean 74.7): Budget adherence is weakest: the variant self-describes production_complexity as 'medium' and estimates 5 principal cast plus a live-band production, which strains a micro-budget (<$250K) single-location minimal-cast constraint; also, a 120-minute runtime with a full musical revue plus rehearsal/performance arcs is ambitious for the budget tier.
- `TP-07` (mean 75.3): Runtime plausibility is the weakest dimension: a 15-minute film with 8 locations, a road trip across France, and a three-act emotional arc involving sealed eco-bubble VFX is extremely ambitious for that length, and the mature 18+ CNC rating is only loosely implied rather than clearly built into the content.

**Errored cases:**

- `TP-03`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-04`: APITimeoutError: Request timed out.
- `TP-06`: APITimeoutError: Request timed out.
- `TP-10`: IndexError: list index out of range
- `TP-11`: IndexError: list index out of range
- `TP-12`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-13`: InternalServerError: Error code: 500 - {'message': 'Failed to generate completions', 'type': 'Internal Server Error', 'code': 500}
- `TP-14`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-15`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-16`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-17`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-18`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-19`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-20`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-21`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-22`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-23`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-24`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-25`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-26`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-27`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-28`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-29`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `TP-30`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `STRESS-01`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `STRESS-02`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `STRESS-03`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `STRESS-04`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-HI-01`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `ML-HI-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-ES-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-ES-02`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `ML-JA-01`: RateLimitError: Error code: 429 - {'status': 429, 'title': 'Too Many Requests'}
- `ML-JA-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-FR-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-FR-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
