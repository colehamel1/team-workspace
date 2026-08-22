---
name: red-team
description: Spawn an adversarial agent whose only job is to refute a plan, design, or recommendation before committing to it. AUTO-TRIGGERS before finalizing any new system design, any recommendation to spend money, or any "we should restructure X" conclusion. Also manual via /red-team <claim or plan>. Skip for trivial tasks and routine ops.
---

# Red Team

One agent argues the strongest case AGAINST, so plausible-but-wrong plans die before they
cost anything.

## Procedure

1. Frame the handoff CLEAN: the claim/plan/design plus the user's real operating context
   (small team, limited budget, their actual tools). Never include the session's enthusiasm
   or momentum — a refuter inheriting the framing puts up a stage fight.
2. Spawn one fresh agent instructed to REFUTE, defaulting to skepticism, and required to
   return: (a) strongest honest case against, (b) what breaks if the plan is wrong,
   (c) the cheaper/safer alternative, (d) a verdict — ADOPT / ADOPT-MODIFIED / DEFER /
   REJECT.
3. Weigh it. Report BOTH sides to the user, then your final position. Disagreeing with the
   red team is allowed but must be argued, not waved off.
4. Fold whatever it won into the plan before presenting for approval.

## Scale

- Default: one refuter.
- Expensive or irreversible decisions: escalate to 3 parallel refuter agents (one message,
  independent contexts — distinct lenses beat identical refuters), majority refute kills.
- Never red-team trivial tasks.

## The standing meta-finding (keep honoring it)

Ideas fail when they let an agent judge scope, escalation, or truth per-instance; they
survive when a human-authored static rule (a tier table, a category list, an approval gate)
does that judging and agents do everything else.
