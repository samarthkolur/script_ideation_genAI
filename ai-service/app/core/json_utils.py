"""Defensive JSON extraction — see ai/eval/json_utils.py for the original
diagnosis (NIM-hosted models occasionally leak a few characters of
reasoning around an otherwise-valid JSON object even with json_mode set).
Duplicated here rather than imported cross-package since ai-service is
meant to be independently deployable without a dependency on ai/eval/.
"""

from __future__ import annotations

import json


def parse_json_object(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        return json.loads(text)
    return json.loads(text[start : end + 1])
