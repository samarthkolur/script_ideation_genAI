# CLAUDE.md

# Project Operating Instructions

This repository follows a documentation-first development workflow.

The primary source of truth for the project is:

> design.md

`design.md` is the authoritative engineering context document and must always reflect the current state of the project.

Never rely on repository inspection when the information already exists inside `design.md`.

---

# Primary Rules

Before responding to **any** request:

1. Read `design.md` completely.
2. Treat it as the current state of the project.
3. Assume it accurately reflects the repository.
4. Use it as memory for all technical decisions.
5. Do **not** re-audit the repository unless explicitly instructed.

---

# Development Workflow

## Before Starting Any Work

Before implementing a feature or making changes:

- Read `design.md`
- Identify the current phase
- Identify the current milestone
- Identify unfinished tasks
- Identify dependencies
- Determine whether the requested work belongs in the current phase

If work belongs to a future phase, explain why before proceeding.

---

## Beginning a New Phase

Immediately update `design.md` with:

- Current Phase
- Current Milestone
- Current Objectives
- Planned Deliverables
- Expected Files
- Dependencies
- Risks

Do this **before** writing any code.

---

## During Development

Immediately update `design.md` whenever you:

- Create a file
- Delete a file
- Rename a file
- Move a file
- Refactor a file
- Modify project structure
- Add or remove dependencies
- Add a library
- Add an environment variable
- Introduce a new service
- Change architecture
- Make an important engineering decision
- Complete a milestone

Documentation must always evolve alongside the code.

Never postpone documentation until later.

---

# Development Log

After every completed task append a new Development Log entry containing:

- Timestamp (logical project time)
- Task completed
- Files created
- Files modified
- Files deleted
- Reason for change
- Architectural decisions
- Remaining work
- Known issues
- Next recommended task

Do not overwrite previous entries.

Always append.

---

# design.md Required Sections

Ensure `design.md` always contains the following sections.

1. Project Overview

2. Current Architecture

3. Repository Structure

4. Technology Stack

5. Design Decisions (DD-001, DD-002...)

6. Dependencies

7. Environment Variables

8. External Services

9. AI Models

10. NVIDIA Technologies

11. Prompt Strategy

12. Current Phase

13. Current Milestone

14. Completed Milestones

15. Pending Tasks

16. Known Issues

17. Technical Debt

18. Future Improvements

19. Development Log

20. Current Repository State

---

# Updating Existing Information

Never recreate information already present.

Instead:

- Update it
- Extend it
- Revise it

Preserve historical context whenever possible.

Treat `design.md` as an engineering wiki rather than a generated report.

---

# End of Every Response

Before finishing every response:

1. Update `design.md`.
2. List which sections were updated.
3. Confirm that `design.md` reflects the latest repository state.

---

# Engineering Standards

Always prefer:

- Production-quality implementations
- Modular architecture
- SOLID principles
- Clean code
- Low coupling
- High cohesion
- Reusable components
- Scalable folder structures
- Explicit documentation
- Maintainable abstractions

Avoid:

- Duplicate code
- Temporary hacks
- Magic numbers
- Hidden dependencies
- Large monolithic files
- Premature optimization
- Unnecessary complexity

---

# Repository Audits

Repository-wide audits are expensive.

Only perform one when:

- Explicitly requested.
- `design.md` is missing.
- `design.md` is clearly inconsistent with the repository.
- A major refactor requires validation.

Otherwise, trust `design.md`.

---

# Goal

A new engineer should be able to understand:

- what the project is,
- where development currently stands,
- why every major decision was made,
- what remains to be built,

by reading only `design.md`, without inspecting the entire repository.
