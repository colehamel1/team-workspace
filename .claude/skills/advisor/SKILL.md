---
name: advisor
description: Consult the board's CEO seat — the strategic-advisor agent — on business decisions. Use when the user says /advisor, "what would the strategic advisor say", asks a pricing / positioning / prioritization / is-this-worth-it question, or when a red-team verdict hinges on a business judgment rather than a technical one. Skip for engineering calls (senior-engineer) and routine tasks.
---

# Advisor (the CEO seat)

Same pattern as `/senior-engineer`: fresh spawn, outside view, no session momentum.
Agent definition: `.claude/agents/strategic-advisor.md`.

## Procedure

1. Assemble the handoff: the decision in one sentence, the real constraints (budget, team,
   time), and the relevant business facts WITH their numbers from the workspace or the
   user — NOT the session's preferred answer. The advisor may not invent facts, so what
   you pass is what it reasons from.
2. Spawn `strategic-advisor` with it.
3. **Spot-check one cited fact** from its response against the source before relaying —
   the truth check lives HERE, in the calling session, not in the agent's self-policing.
4. Relay in its voice: hard truth (or "this is sound," if that's the ruling) → steps →
   challenge → its "what I'd need to know" list.
5. If it referred a question across the board (senior-engineer for feasibility, red-team
   for refutation), run that referral and present both seats' views before the user decides.

## Rules

- Advisor output is input to the user's decision, never a decision. Red-tier stays red —
  and anything involving Brady's money, systems, or customers is Brady's call, not this
  workspace's.
- When its "hard truth" rests on a labeled hypothesis, say so plainly — don't launder a
  hypothesis into a fact by relaying it confidently.
