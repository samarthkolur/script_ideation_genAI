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
from .json_utils import parse_json_object
from .nim_client import ChatResult, NimClient
from .prompt_template import SYSTEM_PROMPT, build_user_prompt
from .report import render_report
from .test_prompts import build_test_set

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "docs" / "reports" / "raw"
REPORT_PATH = REPO_ROOT / "docs" / "reports" / "llm-baseline-evaluation-v1.md"
TRIAGE_REPORT_PATH = REPO_ROOT / "docs" / "reports" / "model-triage-v1.md"

# Original candidate list (design.md §9) included nvidia/llama-3.1-nemotron-70b-instruct,
# mistralai/mixtral-8x22b-instruct-v0.1, and the Meta Llama models — all
# either unavailable on this account (404 / not in catalog) or severely
# queue-congested on NVIDIA's shared hosted endpoint (~67s+ per trivial
# call, confirmed via direct API testing — see design.md §16).
#
# nvidia/nemotron-3-nano-30b-a3b was tried next (fast, entitled) but
# dropped after direct reproduction: even with a generous token budget
# (ruling out truncation), it reliably produces meta-commentary about how
# it *would* format the JSON rather than the actual content — a capability
# issue, not a config issue. Not used for generation or judging.
CANDIDATE_MODELS = [
    "minimaxai/minimax-m3",
    "deepseek-ai/deepseek-v4-flash",
]
# minimax-m3 confirmed reliable (valid JSON, high-quality on-brief output)
# in direct testing once given an adequate token budget for its reasoning
# overhead — see design.md §9/§16 for the full diagnostic trail. Used as
# judge too (not nemotron — dropped for the same reliability reason above)
# despite judge calls being more numerous than generation calls (up to 3
# per case), since a fast-but-wrong judge is worse than a correct one.
DEFAULT_JUDGE_MODEL = "minimaxai/minimax-m3"
TRIAGE_SAMPLE_SIZE = 6
CONCURRENCY = 2


async def _run_one_case(
    client: NimClient,
    semaphore: asyncio.Semaphore,
    *,
    gen_model: str,
    judge_model: str,
    brief,
) -> dict:
    brief_dict = brief.as_prompt_dict()
    gen_result: ChatResult | None = None
    async with semaphore:
        print(f"  [{brief.id}] generating...", file=sys.stderr)
        try:
            gen_result = await client.chat(
                model=gen_model,
                system_prompt=SYSTEM_PROMPT,
                user_prompt=build_user_prompt(brief_dict, variant_count=3),
                temperature=0.9,
                json_mode=True,
                # Several candidate models on NIM (nemotron-3-nano, deepseek-v4,
                # minimax-m3) are reasoning models that spend a large token
                # budget on chain-of-thought before the actual JSON answer —
                # confirmed via direct reproduction: 2048 tokens was consumed
                # entirely by reasoning (finish_reason "length"), never
                # reaching the JSON. Generous budget needed for reasoning +
                # 3 full variants.
                max_tokens=8192,
            )
            parsed = parse_json_object(gen_result.content)
            variants = parsed.get("variants", [])
        except Exception as exc:  # noqa: BLE001 - a single case failure must not kill the run
            print(f"  [{brief.id}] FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
            # Save the raw (unparseable) content so a JSON failure is
            # diagnosable from the raw report without needing to reproduce
            # it manually — a real gap found while diagnosing the first
            # triage run (see design.md).
            return {
                "case_id": brief.id, "model": gen_model, "error": f"{type(exc).__name__}: {exc}",
                "brief": brief_dict, "variants": [], "judge_scores": [], "diversity": None,
                "raw_content_on_error": gen_result.content if gen_result else None,
            }
        print(f"  [{brief.id}] generated {len(variants)} variants, judging...", file=sys.stderr)

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
        print(f"  [{brief.id}] done", file=sys.stderr)

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
