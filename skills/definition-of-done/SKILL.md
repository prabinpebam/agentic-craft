---
name: definition-of-done
description: Use when defining what success means for a product, a feature or a stage, writing success criteria, deciding what evidence would prove an outcome is valuable, or judging how far a product is from its promise. Defines project and stage Definitions of Done made from promises and user-can statements, with observable rows, the evidence each needs, and a "Try it".
---

# Definitions of Done: success criteria with evidence

"Done" is a table, not a feeling. A project has one Definition of Done made from its promises; each stage, a slice of the product a person can try, has its own, made from the user-can statements it delivers. Each row says what must be true and what evidence would prove it, so anyone (a person, an agent, an automated check) can tell whether it's met.

## The project Definition of Done

- One row per promise (from `ground`), plus the non-negotiables: what must never break (the live product, a public API), budgets kept, docs current.
- Each row: **# · promise · done when (measurable) · evidence (where the proof comes from)**.
- Include rows for value, not only function: the outcome a person gets (a task finished unaided, time saved, a return visit), and how it's observed.

| # | Promise | Done when | Evidence |
|---|---|---|---|
| PD1 | P1 … | A new person goes from X to Y in ≤ N minutes, unaided | A timed session with five first-time people |

## Stages

- Cut the product into stages that each deliver something **a person can try by hand** and judge. A stage that leaves nothing to try is too small or the wrong cut.
- Each stage has:
  - **Delivers:** the user-can statements (U…) a person gains;
  - **Try it:** what a person does to judge the outcome, in the product's terms (where they go, what they do), and what they should see; the exact commands for a given build are added by whoever builds it;
  - **Done when:** a table of rows, each with its evidence.
- Order stages by value and risk: what proves the promise soonest, and what settles the riskiest assumption (`assumptions`) before more is built on it. Say what each stage leaves a person able to do. This order is the product's priority; how the work on each stage is sequenced and checked is decided where it's carried out, citing these stage and row IDs rather than redefining them.

| # | Done when | Evidence |
|---|---|---|
| 3.1 | A person can … (U4) | Unit `x.test`; end-to-end "group" |

### Good rows

- **Observable:** a test, a command and its output, a measurement, an observation of a person, a screenshot reviewed in both themes. Never "works".
- **Traced:** names the user-can statement or promise it proves.
- **Negative cases too:** what must not happen (no leak, no silent failure, nothing written outside the store).
- **Budgets:** performance, size and accessibility rows have numbers.
- **Evidence named in advance:** the evidence column says what would prove the row before work starts. The result (which test, how many passed, which run, what was observed) is recorded beside it once it's known, by whoever does the work.

### Rows that depend on others

A row that needs something outside the product (an account, a credential, a person's decision, a third party) names that dependency and who can resolve it, so it's never faked, quietly weakened or dropped.

## Against the promise

The Definitions of Done end with an honest assessment, "against the promise": how far a real person is from what was promised, with the gaps in the order they block it. Revisit it whenever evidence changes the picture: a stage proven, an assumption refuted, a row that can't be met.

A template is in `templates/definition-of-done.md` of this harness.
