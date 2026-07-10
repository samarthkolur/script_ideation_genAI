# LLM Baseline Evaluation Harness

Milestone 1.1 deliverable. Measures raw NIM model capability against the 8-dimension constraint taxonomy (`docs/constraint-taxonomy-v1.md`) before any prompt optimization, chaining, or validation engine exists. Results directly inform the Prompt Architecture Document (Milestone 1.2).

## Setup

```bash
# from project root
cp .env.example .env        # then set NVIDIA_API_KEY in .env
python3 -m venv ai/.venv
ai/.venv/bin/pip install openai python-dotenv pydantic
```

## Running

```bash
# Step 1: cheap triage — 6 cases against all 3 candidate models
ai/.venv/bin/python -m ai.eval.runner triage
# -> docs/reports/model-triage-v1.md

# Step 2: after picking a winner from the triage report, run the full suite
ai/.venv/bin/python -m ai.eval.runner full --model meta/llama-3.3-70b-instruct
# -> docs/reports/llm-baseline-evaluation-v1.md
```

Raw per-case JSON (prompts, generations, judge scores) is written to `docs/reports/raw/` — gitignored, since it's large and fully regeneratable from a re-run.

## Module map

| File | Responsibility |
|---|---|
| `nim_client.py` | Thin async client for NIM's OpenAI-compatible endpoint; retry on transient errors |
| `constraints.py` | Machine-readable mirror of the constraint taxonomy, used to build briefs |
| `test_prompts.py` | Curated 42-case test brief set (30 core + 4 stress + 8 multilingual) |
| `prompt_template.py` | The baseline (deliberately un-optimized) generation prompt |
| `judge.py` | LLM-as-judge scoring against a fixed rubric |
| `diversity.py` | Lexical pairwise diversity proxy |
| `runner.py` | CLI orchestration (`triage` / `full`) |
| `report.py` | Aggregates raw results into the markdown report |

## Known limitations (see `design.md` §16)

- Judge is an LLM, not a human review panel — the source plan assumes internal human reviewers.
- Diversity is lexical (Jaccard), not embedding-based semantic similarity.
- Multilingual coverage tests 4 of 11 taxonomy languages (hi, es, ja, fr) with simple constraint combos, not the full matrix.
