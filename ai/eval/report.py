"""Renders the raw runner output into the markdown deliverables.

Why this exists: the milestone's actual deliverable is a human-readable
report (docs/reports/llm-baseline-evaluation-v1.md or
model-triage-v1.md), not JSON. Keeping rendering separate from
orchestration (runner.py) means the aggregation/formatting logic can be
tested and re-run against saved raw JSON without re-calling the API.
"""

from __future__ import annotations

from datetime import datetime, timezone

_DIMENSION_LABELS = {
    "genre_adherence": "Genre",
    "audience_adherence": "Audience",
    "budget_production_adherence": "Budget/Production",
    "runtime_plausibility": "Runtime",
    "region_cultural_fit": "Region",
    "censorship_rating_adherence": "Censorship Rating",
    "language_correctness": "Language",
    "narrative_coherence": "Coherence",
}

# Per source plan §1.3 / §11: baseline target for constraint adherence.
ADHERENCE_TARGET_PCT = 70.0
# Per source plan §11: diversity target, pairwise similarity below this.
DIVERSITY_SIMILARITY_TARGET = 0.60
# Per source plan §1.3: coherence rated "coherent" (>= this score) by >= 80% of samples.
COHERENCE_PASS_SCORE = 80
COHERENCE_PASS_RATE_TARGET_PCT = 80.0


def _flatten_scores(results: list[dict]) -> list[dict]:
    scores = []
    for case in results:
        for js in case.get("judge_scores", []):
            if "error" not in js:
                scores.append(js | {"case_id": case["case_id"], "language": case["brief"]["output_language"]})
    return scores


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _aggregate(results: list[dict]) -> dict:
    scores = _flatten_scores(results)
    errors = [r for r in results if r.get("error")]
    diversities = [r["diversity"] for r in results if r.get("diversity") is not None]

    per_dimension = {
        key: _mean([s[key] for s in scores]) for key in _DIMENSION_LABELS
    }
    overall_adherence = _mean([s["mean"] for s in scores])
    coherence_scores = [s["narrative_coherence"] for s in scores]
    coherence_pass_rate = (
        100.0 * sum(1 for c in coherence_scores if c >= COHERENCE_PASS_SCORE) / len(coherence_scores)
        if coherence_scores else 0.0
    )
    non_english = [s for s in scores if s["language"] != "English"]

    return {
        "case_count": len(results),
        "error_count": len(errors),
        "errors": errors,
        "variant_count": len(scores),
        "per_dimension": per_dimension,
        "overall_adherence_pct": overall_adherence,
        "mean_diversity_similarity": _mean(diversities),
        "coherence_pass_rate_pct": coherence_pass_rate,
        "non_english_language_correctness": _mean([s["language_correctness"] for s in non_english]) if non_english else None,
        "worst_cases": sorted(scores, key=lambda s: s["mean"])[:5],
    }


def _render_model_section(model: str, results: list[dict], *, include_verdict: bool) -> str:
    agg = _aggregate(results)
    lines = [f"## {model}", ""]
    lines.append(f"- Cases run: {agg['case_count']} ({agg['error_count']} errored)")
    lines.append(f"- Variants scored: {agg['variant_count']}")
    lines.append(f"- **Overall constraint adherence:** {agg['overall_adherence_pct']:.1f}%")
    lines.append(f"- **Mean pairwise diversity similarity:** {agg['mean_diversity_similarity']:.2f} (target: < {DIVERSITY_SIMILARITY_TARGET})")
    lines.append(f"- **Coherence pass rate (score ≥ {COHERENCE_PASS_SCORE}):** {agg['coherence_pass_rate_pct']:.1f}%")
    if agg["non_english_language_correctness"] is not None:
        lines.append(f"- Non-English language correctness: {agg['non_english_language_correctness']:.1f}%")
    lines.append("")
    lines.append("**Per-dimension adherence (mean score, 0-100):**")
    lines.append("")
    lines.append("| Dimension | Score |")
    lines.append("|---|---|")
    for key, label in _DIMENSION_LABELS.items():
        lines.append(f"| {label} | {agg['per_dimension'][key]:.1f} |")
    lines.append("")

    if include_verdict:
        adherence_pass = agg["overall_adherence_pct"] >= ADHERENCE_TARGET_PCT
        diversity_pass = agg["mean_diversity_similarity"] < DIVERSITY_SIMILARITY_TARGET
        coherence_pass = agg["coherence_pass_rate_pct"] >= COHERENCE_PASS_RATE_TARGET_PCT
        lines.append("**Against Phase 1 success criteria:**")
        lines.append(f"- Constraint adherence ≥ {ADHERENCE_TARGET_PCT}%: {'PASS' if adherence_pass else 'FAIL'}")
        lines.append(f"- Diversity similarity < {DIVERSITY_SIMILARITY_TARGET}: {'PASS' if diversity_pass else 'FAIL'}")
        lines.append(f"- Coherence pass rate ≥ {COHERENCE_PASS_RATE_TARGET_PCT}%: {'PASS' if coherence_pass else 'FAIL'}")
        lines.append("")

    if agg["worst_cases"]:
        lines.append("**Weakest-scoring cases (for prompt architecture attention):**")
        lines.append("")
        for wc in agg["worst_cases"]:
            lines.append(f"- `{wc['case_id']}` (mean {wc['mean']:.1f}): {wc.get('notes', '')}")
        lines.append("")

    if agg["errors"]:
        lines.append("**Errored cases:**")
        lines.append("")
        for err in agg["errors"]:
            lines.append(f"- `{err['case_id']}`: {err['error']}")
        lines.append("")

    return "\n".join(lines)


def render_report(all_results: dict[str, list[dict]], *, mode: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    header = [
        f"# {'Model Triage Report' if mode == 'triage' else 'LLM Baseline Evaluation Report'} v1",
        "",
        f"**Generated:** {timestamp}",
        f"**Method:** {'Small sample (' + str(len(next(iter(all_results.values())))) + ' cases) run against each candidate model' if mode == 'triage' else 'Full curated test set (see ai/eval/test_prompts.py) run against one selected model'}",
        "",
        (
            "**Scoring caveat:** coherence and constraint-adherence scores are "
            "produced by an LLM judge (see `ai/eval/judge.py`), not a human "
            "review panel — the source plan calls for internal human "
            "reviewers, which a solo/no-team execution cannot provide. This "
            "is a documented substitute, not equivalent evidence; treat "
            "scores as directional, not certified."
        ),
        "",
        (
            "**Diversity caveat:** diversity is measured via lexical "
            "(Jaccard) similarity over logline/conflict text, not semantic "
            "embeddings — a lightweight proxy appropriate for a Phase 1 "
            "baseline, not a precision instrument."
        ),
        "",
        "---",
        "",
    ]

    sections = [
        _render_model_section(model, results, include_verdict=(mode == "full"))
        for model, results in all_results.items()
    ]

    footer = []
    if mode == "triage":
        footer = [
            "---",
            "",
            "## Recommendation",
            "",
            "_Fill in after reviewing the per-model sections above: which "
            "candidate had the strongest overall adherence + coherence + "
            "diversity balance, and why. This becomes the model recorded in "
            "`design.md` §9 and used for the full evaluation run._",
            "",
        ]

    return "\n".join(header + sections + footer)
