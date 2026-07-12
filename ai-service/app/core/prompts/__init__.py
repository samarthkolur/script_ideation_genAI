"""Prompt-engineering pipeline for script ideation.

Separated into distinct, reusable template modules (system persona,
developer/technical rules, constraint rendering, output schema, diversity
seeding) composed by `templates.py` into the two messages any OpenAI-
compatible chat API actually accepts (`system`, `user`). See design.md for
the rationale — this replaced a single inline f-string that produced
generic, short "chatbot summary" output instead of professional screenplay
development documents.
"""
