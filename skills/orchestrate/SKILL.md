---
name: orchestrate
description: Use for any multi-step work, and always when the owner is away or says "unattended". Decides attended versus unattended mode, time-boxes, which checks to run (validation tiers), how to merge exactly what was tested, the progress log, handoffs, delegation to sub-agents, and the periodic throughput review.
---

# Orchestrate: attended and unattended work

Work is measured by **validated progress per hour**, not completeness per task. The owner's time and attention are the constraint: never make them wait on checks a change doesn't need, and never make them micromanage basic quality.

## Which mode

- **Attended:** the owner has written in the last 30 minutes, or is testing and giving feedback.
- **Unattended:** they said they're away, asked for "unattended", or haven't written for 30 minutes.

### Attended: one fix at a time

- About **15 minutes from report to a fix they can see.** Run only the fast checks for what changed (5 minutes or less): the unit tests it touches and the one end-to-end test that covers it.
- Merge, ship where they'll see it, and say exactly what to reopen or reload.
- Queue new feedback rather than widening the running fix. Never run a full suite or a benchmark here.
- Ask only what can't be decided; offer choices with a recommended first.

### Unattended: the critical path in time-boxes

- Deeper work on the plan's critical path in **45-minute time-boxes**, each ending in a merge of what works.
- **Decide, don't ask.** Resolve ambiguity with the most reasonable assumption, write the assumption down (in the plan's decisions, as a working default), and keep going. Stop only when truly blocked, and then work on everything that isn't.
- Run the broad checks (tier 3) before merging risky changes.
- End with a **handoff**: what's done with evidence, what's in progress, what's waiting on the owner (decisions, accounts, credentials) with the choices laid out, and what to try first.

## Validation tiers: run what the change needs

Pick the lowest tier that covers the change; escalate only for the reasons in tier 3. (This is test impact analysis: run what a change can affect, keep the full suite for milestones.)

| Tier | When | What |
|---|---|---|
| 0 | Docs, comments, copy-only, renames a tool made | Nothing. Proof-read the diff |
| 1 | Any code change | The unit tests related to the changed files (follow the import graph), plus the type check if types or signatures changed. Write or update the unit test for the logic touched |
| 2 | A change a unit test can't see: rendering, input, styles, timing, integration | Only the affected end-to-end test(s), by title or group. For visual changes, one screenshot of the affected view, looked at |
| 3 | Only on a trigger below | The full unit suite, type check, production build with its budgets, full end-to-end suite |

Tier 3 triggers: several features since the last full run, or before a release or milestone; a behavioural change to shared infrastructure the import graph can't bound; dependency or build changes (always the production build with budgets); the production or security path; a targeted run failed for a reason you don't understand.

Rules: run long suites in the background while doing other work; never run two heavy suites at once; re-run a single timeout before investigating; say in the summary what you ran and what you skipped, and why.

## Branches, merges, deploys

- Work in a separate branch (or worktree) so the owner's working copy is never disturbed. Keep branches short: an hour at most.
- **Merge exactly what was tested** (fast-forward), push, and watch the deploy and its checks until they pass. What's live must never break; if it does, fix forward or revert at once.
- Before merging something risky, get an independent review of the diff (a reviewer sub-agent) against the hard requirements; fix what it finds, with tests.

## The progress log

One timestamped line per meaningful step, in a file outside the repository (its path is a project fact in `AGENTS.md`), so the owner can watch without asking: `2026-01-31 14:05 [unattended] stage 3: setup flow builds; unit 42 pass; merging`.

## Delegation

- Delegate only work that needs its own context: a broad exploration, an independent review, a long command whose output only matters if it fails, research with sources.
- Give a sub-agent a bounded objective, the context it needs, and what to return; don't re-do its work. Run independent ones in parallel; continue your own work meanwhile.
- Never delegate a single continuous trace you can follow with a few searches.

## The throughput review

Every 30 minutes of running work, challenge the approach with the `throughput-reviewer` agent (in this harness's `agents/`), and act on its top finding. It asks: what's the constraint now, is anything past its time-box or unmerged, are checks right for the mode, did the owner have to point out something basic, what has waited longest, and what was waste.

## Basics right the first time

Before showing the owner anything visual: the whole anatomy of the component in light and dark, at rest, hover, active, focus and disabled (plus error, empty and loading where they exist), on a small screen and with the keyboard, with one enlarged capture looked at. Put a test on the anatomy so the same flaw can't come back.

## Never take their focus

Test and script launches of an app run in the background (no focus-stealing windows); never restart the owner's running app or server without asking; never touch their real data, accounts or remotes from tests (use fixtures and fakes).
