# Model Triage Report v1

**Generated:** 2026-07-10 17:55 UTC
**Method:** Small sample (6 cases) run against each candidate model

**Scoring caveat:** coherence and constraint-adherence scores are produced by an LLM judge (see `ai/eval/judge.py`), not a human review panel — the source plan calls for internal human reviewers, which a solo/no-team execution cannot provide. This is a documented substitute, not equivalent evidence; treat scores as directional, not certified.

**Diversity caveat:** diversity is measured via lexical (Jaccard) similarity over logline/conflict text, not semantic embeddings — a lightweight proxy appropriate for a Phase 1 baseline, not a precision instrument.

---

## nvidia/nemotron-3-nano-30b-a3b

- Cases run: 6 (3 errored)
- Variants scored: 0
- **Overall constraint adherence:** 0.0%
- **Mean pairwise diversity similarity:** 0.00 (target: < 0.6)
- **Coherence pass rate (score ≥ 80):** 0.0%

**Per-dimension adherence (mean score, 0-100):**

| Dimension | Score |
|---|---|
| Genre | 0.0 |
| Audience | 0.0 |
| Budget/Production | 0.0 |
| Runtime | 0.0 |
| Region | 0.0 |
| Censorship Rating | 0.0 |
| Language | 0.0 |
| Coherence | 0.0 |

**Errored cases:**

- `TP-01`: JSONDecodeError: Unterminated string starting at: line 1 column 2 (char 1)
- `TP-03`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)
- `TP-06`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## deepseek-ai/deepseek-v4-flash

- Cases run: 6 (6 errored)
- Variants scored: 0
- **Overall constraint adherence:** 0.0%
- **Mean pairwise diversity similarity:** 0.00 (target: < 0.6)
- **Coherence pass rate (score ≥ 80):** 0.0%

**Per-dimension adherence (mean score, 0-100):**

| Dimension | Score |
|---|---|
| Genre | 0.0 |
| Audience | 0.0 |
| Budget/Production | 0.0 |
| Runtime | 0.0 |
| Region | 0.0 |
| Censorship Rating | 0.0 |
| Language | 0.0 |
| Coherence | 0.0 |

**Errored cases:**

- `TP-01`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)
- `TP-02`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)
- `TP-03`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)
- `TP-04`: InternalServerError: Error code: 503 - {'error': {'message': 'ResourceExhausted: All workers are busy, please retry later', 'type': 'Service Unavailable', 'code': 503}}
- `TP-05`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)
- `TP-06`: JSONDecodeError: Expecting value: line 1 column 1 (char 0)

## minimaxai/minimax-m3

- Cases run: 6 (4 errored)
- Variants scored: 2
- **Overall constraint adherence:** 95.4%
- **Mean pairwise diversity similarity:** 0.05 (target: < 0.6)
- **Coherence pass rate (score ≥ 80):** 100.0%

**Per-dimension adherence (mean score, 0-100):**

| Dimension | Score |
|---|---|
| Genre | 100.0 |
| Audience | 90.0 |
| Budget/Production | 97.5 |
| Runtime | 85.0 |
| Region | 97.5 |
| Censorship Rating | 97.5 |
| Language | 100.0 |
| Coherence | 95.0 |

**Weakest-scoring cases (for prompt architecture attention):**

- `TP-03` (mean 93.6): Audience adherence is the weakest; the thriller/cyber‑crime tone may be slightly mature for the 9‑12 tween target.
- `TP-04` (mean 97.1): Runtime is not explicitly matched to 105 minutes, making this the weakest dimension.

**Errored cases:**

- `TP-01`: APITimeoutError: Request timed out.
- `TP-02`: APITimeoutError: Request timed out.
- `TP-05`: APITimeoutError: Request timed out.
- `TP-06`: APITimeoutError: Request timed out.

---

## Recommendation

_Fill in after reviewing the per-model sections above: which candidate had the strongest overall adherence + coherence + diversity balance, and why. This becomes the model recorded in `design.md` §9 and used for the full evaluation run._
