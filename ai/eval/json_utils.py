"""Defensive JSON extraction for NIM chat completion responses.

Why this exists: even with `response_format: json_object` set, several
NIM-hosted models (confirmed: deepseek-ai/deepseek-v4-flash) leak a few
characters of reasoning/commentary immediately before or after the actual
JSON object (e.g. content starting `We{"logline": ...}` instead of
`{"logline": ...}`). Stripping to the outermost `{...}` before parsing
recovers these cases without weakening validation — if there's no `{` at
all, this raises the same JSONDecodeError `json.loads` would have.
"""

from __future__ import annotations

import json


def parse_json_object(text: str) -> dict:
    """Parse `text` as a JSON object, tolerating minor prefix/suffix leakage."""
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        return json.loads(text)  # let this raise the natural JSONDecodeError
    return json.loads(text[start : end + 1])
