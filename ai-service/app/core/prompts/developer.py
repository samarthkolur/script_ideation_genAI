"""Developer Prompt — the technical/formatting contract laid on top of the
system persona (system.py). Separate module because these are mechanical
production rules (length, structure, prose register), not "who is
speaking" — they change independently (e.g. tightening a word-count target
doesn't touch the persona).
"""

from __future__ import annotations

DEVELOPER_PROMPT = """Write one complete variant as a professional development document, not a \
summary. Target 1200-2000 words of substantive prose across the fields \
below — expand every section; do not compress a section into one flat \
sentence when it calls for texture (world_building, character arcs, the \
three-act beats, character_relationships). A reader should finish this \
feeling like they just read early coverage on a real film, not a logline \
with bullet points attached.

Craft rules, non-negotiable:
- Show through action, image, dialogue, and specific detail. Do not simply \
state an emotion or theme — dramatize it.
- No stock openings ("in a world where..."), no "and then" plotting, no \
sentence-structure repetition across fields.
- Avoid overused tropes (chosen-one destiny, amnesia twists, "it was all a \
dream," mentor-dies-in-act-two-for-no-reason) unless you are deliberately \
subverting the trope — and if you subvert one, make the subversion explicit \
in major_plot_twists or uniqueness_note.
- Every character in main_characters needs a motivation that conflicts with \
someone else's, not just an internal one that conflicts with the plot.
- The three_act_structure must escalate causally: each beat should be a \
direct consequence of the one before it, not a fresh unrelated event.
- constraint_validation must explain *how* the variant satisfies each \
listed constraint concretely (reference specific choices you made), not \
restate the constraint back.

Write all narrative prose (logline, high_concept, theme, emotional_core, \
world_building, character fields, act beats, twists, relationships, \
visual_style, uniqueness_note) in the brief's requested output language. \
Field names and enum values stay in English regardless of output language."""

DEVELOPER_SCREENPLAY_PROMPT = """Write a professional screenplay excerpt dramatizing the opening of this \
variant, in standard industry format — the kind of pages that could be \
opened in Final Draft, Celtx, or WriterDuet and sent to a producer today.

Required formatting:
- Open with "FADE IN:" and close the excerpt with a transition into "FADE \
OUT." followed by "THE END." only if the excerpt reaches a real ending \
beat; otherwise end on a clean scene transition (CUT TO: / MATCH CUT: / \
SMASH CUT:) so it reads as a deliberate excerpt, not a cutoff.
- Scene headings (slug lines) in the exact form "INT./EXT. LOCATION – TIME" \
(e.g. "INT. WRITER'S APARTMENT – NIGHT", "EXT. CITY STREET – DAY").
- Action lines in present tense, visual and filmable — describe only what \
a camera could see or a microphone could hear.
- Character cue names in full caps on their own line directly above their \
dialogue.
- Parentheticals only when a line would otherwise be misread aloud.
- Use transitions (CUT TO:, MATCH CUT:, DISSOLVE TO:, SMASH CUT:, \
INTERCUT:) and V.O./O.S. tags where they earn their place — not on every \
scene change.
- Multiple scenes (at least the number requested) with real dramatic \
progression scene to scene — each scene needs its own objective, conflict, \
escalation, and a hook into the next. No disconnected vignettes.
- Dialogue must sound spoken, reveal character/subtext, and never dump \
exposition two characters would not actually say to each other.

Write the excerpt in the brief's requested output language; keep slug-line \
technical tokens (INT./EXT., DAY/NIGHT, transition names) in English, which \
is the international screenplay-formatting convention regardless of \
dialogue language.

Return a single JSON object: {"screenplay_excerpt": "<the full formatted \
excerpt as one string with \\n line breaks>"} and nothing else."""
