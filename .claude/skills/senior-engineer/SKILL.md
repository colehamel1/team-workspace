---
name: senior-engineer
description: Refine a rough ask into one execution-ready plan via the fresh-context senior-engineer agent. Use when the user says /senior-engineer, "refine this", "run this past the senior engineer", or before executing any big/ambiguous ask. Also the entry point for phase reviews, yellow-light clearing, and plain-English translation of technical output.
---

# Senior Engineer (the department)

The refiner's value is the OUTSIDE VIEW, so it always runs as a fresh subagent — never
inline in the session that wants to proceed. Agent definition:
`.claude/agents/senior-engineer.md`.

## Procedure

1. Assemble the handoff: the rough ask (or the artifact to review), the relevant workspace
   facts (paths, constraints, CLAUDE.md rules that apply), and which of the agent's four
   jobs this is (refine / phase review / yellow-clear / translate). Do NOT include the
   session's own plan or preferences — the agent must not inherit momentum.
2. Spawn the `senior-engineer` agent with that handoff.
3. Relay its output in plain language: the refined plan (or ruling/translation) plus its
   questions with proposed defaults. The user can answer, edit, or say "defaults, go."
4. On go: execute the refined plan in THIS session.

## Rules

- The agent may spawn its own sub-agents for research if the review needs it.
- For phase reviews during big builds, invoke automatically at each phase boundary — the
  user should not have to ask.
- Complex refinements deserve the strongest model; don't downgrade this agent.
- If the ask is small and unambiguous (a one-file edit, a routine task), say so and skip
  the ceremony — the refiner is for asks where a better plan changes the outcome.
