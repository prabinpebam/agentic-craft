---
name: assumptions
description: Use when a spec, plan or request rests on beliefs that haven't been proven, or when asked what's risky, what to validate first, or what could make the product fail. Lists assumptions and risks (desirability, usability, feasibility, viability), ranks them by impact and evidence, and turns the riskiest into questions with a criterion, the cheapest check, and the decision each result changes.
---

# Assumptions: what the plan takes on faith

Every spec rests on beliefs: that people have the problem, that they'll understand the solution, that it can be built, that it's worth what it costs. Naming them turns hidden risk into questions that can be answered before too much is built on them.

## Find them

Walk the chain (`ground`) and ask at each link: what must be true for this to hold?

| Kind | The belief is about | Examples |
|---|---|---|
| **Desirability** | Whether people want it | The job is frequent and painful enough to switch for; this promise matters more than that one |
| **Usability** | Whether people can use it | A person finds the setup without help; the default is what most people want |
| **Feasibility** | Whether it can be built and run | The service allows this; 10,000 items import in under 3 seconds; it works offline |
| **Viability** | Whether it's worth it | The cost per person fits; it's allowed (licences, privacy, policy); someone can maintain it |

Also list **risks** that aren't beliefs but could still break a promise (a dependency shutting down, a policy changing), and **open questions** that need a decision rather than a test. Those go in the spec's decisions, with options and a working default.

## Rank them

For each, note the **impact** if it's wrong (the promise or stage it would break: high, medium or low) and the **evidence** today (none, anecdote, data or proven). The riskiest assumptions have high impact and little evidence; they come first. Rank only what would change the plan.

## Make each one testable

For each assumption worth testing, write these down before anything is checked:

- **The criterion:** the observable result that would confirm or refute it ("8 of 10 first-time people finish setup unaided"; "10,000 items import in 3 seconds or less on the reference machine").
- **The cheapest check that could give that result:** a conversation, a prototype someone tries, a spike, a benchmark, a call to the real service, or existing data.
- **What changes:** the decision each outcome changes (keep the promise, change the flow, drop the stage). If no result would change anything, it isn't worth testing; note it and move on.

## The register

The spec keeps the register as a table:

| # | Assumption or risk | Kind | Impact if wrong | Evidence today | Criterion | Cheapest check | Changes | Status |
|---|---|---|---|---|---|---|---|---|
| A1 | … | Feasibility | High (P2, stage 3) | None | … | … | … | Open |

Status is open, confirmed, refuted or accepted (a risk knowingly taken, with the reason). When a result arrives, update the row and every link it touches in the same edit: a refuted assumption changes a promise, a flow, a stage or a Definition of Done row.

## In a critique

A spec is incomplete when a high-impact belief is missing from the register, or the riskiest assumption has no criterion. Report it with the row to add.
