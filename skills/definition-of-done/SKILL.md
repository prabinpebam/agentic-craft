---
name: definition-of-done
description: Use when turning a spec into a plan, deciding what "done" means for a project or a stage, running build-check-fix loops, or reporting progress. Defines project and stage Definitions of Done with evidence, reviewable stages with a "Try it", blocked rows, and status tables.
---

# Definitions of Done and agentic loops

"Done" is a table, not a feeling. A project has one Definition of Done made from its promises; each stage has its own, made from the user-can statements it delivers. Agents build in loops against those rows until every row has evidence.

## The project Definition of Done

- One row per promise (from `ground`), plus the non-negotiables: what must never break (the live product, a public API), budgets kept, docs current.
- Each row: **# · promise · done when (measurable) · evidence (where the proof comes from)**.

| # | Promise | Done when | Evidence |
|---|---|---|---|
| PD1 | P1 … | A new person goes from X to Y in ≤ N minutes, unaided | The timed check (stage n) |

## Stages

- Cut the work into stages that each end in something **the owner can try by hand** and judge. A stage that produces nothing reviewable is too small or the wrong cut.
- Each stage has:
  - **Builds:** what's made, smallest first, pure logic in tested modules;
  - **Try it:** the steps that show the outcome by hand, with exact commands or clicks;
  - **Done when:** a table of rows, each with its evidence.
- Order stages by the critical path to the promise, and say what each one leaves the owner with.

| # | Done when | Evidence |
|---|---|---|
| 3.1 | A person can … (U4) | Unit `x.test`; E2E "group" |

### Good rows

- **Observable:** a test, a command and its output, a measurement, a screenshot reviewed in both themes. Never "works".
- **Traced:** names the user-can statement or promise it proves.
- **Negative cases too:** what must not happen (no leak, no silent failure, nothing written outside the store).
- **Budgets:** performance, size and accessibility rows have numbers.

## The loop

For each stage:

1. **Build** the next smallest part.
2. **Check** it against its rows with the narrowest command that covers the change (`orchestrate`'s validation tiers).
3. **Fix** what fails, and check again. Repeat until the stage's rows pass.
4. **Review** independently before merging something risky: a reviewer agent reads the diff against the rows and the hard requirements; act on what it finds.
5. **Record** the evidence beside each row (which test, how many passed, which run) and in the spec's "As built".
6. **Merge** what's proven, and hand over with the stage's Try it.

### Blocked rows

A row that can't pass for a reason outside the code (an account, a credential, a person's decision, a third party) is marked **blocked**: why, and exactly what unblocks it, and who. Keep working on everything else; never fake evidence or weaken a check to get past it.

### Found on the way

Bugs and gaps found while building go in the stage's evidence under "Found on the way": fixed (with the test that holds it), or queued with a reason.

## Status

A status table at the end of the plan, one row per stage: state (not started, in progress, done, blocked), and the evidence in one paragraph: the commands run, the counts, the run IDs, what was deliberately skipped and why. A second table, "against the promise", says honestly how far the project is from what was promised, with the gaps in the order they block it.

## Reporting

When reporting progress: lead with what a person can do now that they couldn't before, then the evidence, then what's blocked on whom, then what's next. Say what wasn't checked.

A template plan is in `templates/plan.md` of this harness.
