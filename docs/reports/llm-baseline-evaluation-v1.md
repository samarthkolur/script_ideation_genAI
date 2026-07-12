# LLM Baseline Evaluation Report v1

**Generated:** 2026-07-12 15:08 UTC
**Method:** Full curated test set (see ai/eval/test_prompts.py) run against one selected model

**Scoring caveat:** coherence and constraint-adherence scores are produced by an LLM judge (see `ai/eval/judge.py`), not a human review panel — the source plan calls for internal human reviewers, which a solo/no-team execution cannot provide. This is a documented substitute, not equivalent evidence; treat scores as directional, not certified.

**Diversity caveat:** diversity is measured via lexical (Jaccard) similarity over logline/conflict text, not semantic embeddings — a lightweight proxy appropriate for a Phase 1 baseline, not a precision instrument.

---

## minimaxai/minimax-m3

- Cases run: 42 (42 errored)
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

**Against Phase 1 success criteria:**
- Constraint adherence ≥ 70.0%: FAIL
- Diversity similarity < 0.6: PASS
- Coherence pass rate ≥ 80.0%: FAIL

**Errored cases:**

- `TP-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-03`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-04`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-05`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-06`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-07`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-08`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-09`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-10`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-11`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-12`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-13`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-14`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-15`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-16`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-17`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-18`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-19`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-20`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-21`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-22`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-23`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-24`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-25`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-26`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-27`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-28`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-29`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `TP-30`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `STRESS-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `STRESS-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `STRESS-03`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `STRESS-04`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-HI-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-HI-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-ES-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-ES-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-JA-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-JA-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-FR-01`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
- `ML-FR-02`: BadRequestError: Error code: 400 - {'status': 400, 'title': 'Bad Request', 'detail': "Function id '87ea0ddc-cff1-4bca-bf8b-3bd98a35ddd0': DEGRADED function cannot be invoked"}
