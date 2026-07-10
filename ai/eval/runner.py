"""CLI orchestrator for the LLM baseline evaluation (Milestone 1.1).

Why this exists: ties together test briefs, generation, judging, and
diversity scoring into the two workflows the milestone actually needs:

  triage  - run a small subset across all candidate models, cheaply, to
            pick which model gets the full evaluation.
  full    - run the complete curated test set against the chosen model
            and produce the LLM Baseline Evaluation Report.

Usage (from project root, with .env populated):
  ai/.venv/bin/python -m ai.eval.runner triage
  ai/.venv/bin/python -m ai.eval.runner full --model meta/llama-3.3-70b-instruct
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

from .constraints import FRAMEWORK_RATINGS  # noqa: F401  (imported for side-effect: fail fast if constraints module is broken)
from .diversity import pairwise_similarity
from .judge import judge_variant
from .nim_client import NimClient
from .prompt_template import SYSTEM_PROMPT, build_user_prompt
from .report import render_report
from .test_prompts import build_test_set

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "docs" / "reports" / "raw"
REPORT_PATH = REPO_ROOT / "docs" / "reports" / "llm-baseline-evaluation-v1.md"
TRIAGE_REPORT_PATH = REPO_ROOT / "docs" / "reports" / "model-triage-v1.md"

CANDIDATE_MODELS = [
    "meta/llama-3.3-70b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "mistralai/mixtral-8x22b-instruct-v0.1",
]
DEFAULT_JUDGE_MODEL = "meta/llama-3.3-70b-instruct"
TRIAGE_SAMPLE_SIZE = 6
CONCURRENCY = 5


async def _run_one_case(
    client: NimClient,
    semaphore: asyncio.Semaphore,
    *,
    gen_model: str,
    judge_model: str,
    brief,
) -> dict:
    brief_dict = brief.as_prompt_dict()
    async with semaphore:
        try:
            gen_result = await client.chat(
                model=gen_model,
                system_prompt=SYSTEM_PROMPT,
                user_prompt=build_user_prompt(brief_dict, variant_count=3),
                temperature=0.9,
                json_mode=True,
            )
            parsed = json.loads(gen_result.content)
            variants = parsed.get("variants", [])
        except Exception as exc:  # noqa: BLE001 - a single case failure must not kill the run
            return {
                "case_id": brief.id, "model": gen_model, "error": f"{type(exc).__name__}: {exc}",
                "brief": brief_dict, "variants": [], "judge_scores": [], "diversity": None,
            }

        judge_scores = []
        for variant in variants:
            try:
                score = await judge_variant(
                    client, judge_model=judge_model, brief=brief_dict, variant=variant
                )
                judge_scores.append(score.__dict__ | {"mean": score.constraint_adherence_mean})
            except Exception as exc:  # noqa: BLE001
                judge_scores.append({"error": f"{type(exc).__name__}: {exc}"})

        diversity = pairwise_similarity(variants) if len(variants) > 1 else None

        return {
            "case_id": brief.id, "model": gen_model, "error": None,
            "brief": brief_dict, "variants": variants,
            "judge_scores": judge_scores, "diversity": diversity,
        }


async def _run_suite(gen_model: str, judge_model: str, briefs: list) -> list[dict]:
    client = NimClient()
    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = [
        _run_one_case(client, semaphore, gen_model=gen_model, judge_model=judge_model, brief=b)
        for b in briefs
    ]
    return await asyncio.gather(*tasks)


def _save_raw(results: list[dict], label: str) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"{label}-{int(time.time())}.json"
    path.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    return path


def cmd_triage(args: argparse.Namespace) -> None:
    briefs = build_test_set()[:TRIAGE_SAMPLE_SIZE]
    all_results: dict[str, list[dict]] = {}
    for model in CANDIDATE_MODELS:
        print(f"[triage] running {len(briefs)} cases against {model}...", file=sys.stderr)
        results = asyncio.run(_run_suite(model, DEFAULT_JUDGE_MODEL, briefs))
        _save_raw(results, label=f"triage-{model.replace('/', '_')}")
        all_results[model] = results

    TRIAGE_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    TRIAGE_REPORT_PATH.write_text(render_report(all_results, mode="triage"))
    print(f"Triage report written to {TRIAGE_REPORT_PATH}", file=sys.stderr)


def cmd_full(args: argparse.Namespace) -> None:
    model = args.model
    briefs = build_test_set()
    print(f"[full] running {len(briefs)} cases against {model}...", file=sys.stderr)
    results = asyncio.run(_run_suite(model, args.judge_model, briefs))
    _save_raw(results, label=f"full-{model.replace('/', '_')}")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(render_report({model: results}, mode="full"))
    print(f"Baseline evaluation report written to {REPORT_PATH}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    triage_parser = sub.add_parser("triage", help="Run a small sample across all candidate models")
    triage_parser.set_defaults(func=cmd_triage)

    full_parser = sub.add_parser("full", help="Run the full test set against one chosen model")
    full_parser.add_argument("--model", default=CANDIDATE_MODELS[0])
    full_parser.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    full_parser.set_defaults(func=cmd_full)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
