# <Product or feature>: plan and Definitions of Done

How the [spec](spec.md) is built: stages that each end in something the owner can try by hand, each held to its own Definition of Done, all held to the project's.

> **TL;DR.**
> - **How:** every stage is built in loops against its Definition of Done: build, check, fix, record the evidence here, merge.
> - **Stages:** 1 <…>; 2 <…>; 3 <…>.
> - **Status:** see §5.

## 1. How each stage is built

1. **Build** the stage's parts, smallest first, pure logic in modules with unit tests.
2. **Check** against the stage's rows, with the narrowest command that covers each change.
3. **Loop:** fix and check again until every row passes. A row that can't pass for a reason outside the code is **blocked**: why, and what unblocks it.
4. **Review** risky changes independently before merging.
5. **Record** the evidence in §5 and the spec's "As built", then merge.
6. **Hand over** with the stage's **Try it**.

## 2. Project Definition of Done

| # | Promise | Done when | Evidence |
|---|---|---|---|
| PD1 | P1 | | |
| PDn | Nothing live breaks | <what stays working, and its budgets> | <the checks> |
| PDn | Docs | The spec's "As built" and this plan record what was built | Review |

## 3. Stages

### Stage 1: <name>

<What it leaves the owner with, in one sentence.>

- **Builds:** <…>
- **Try it:** <exact steps or commands, and what you should see>

| # | Done when | Evidence |
|---|---|---|
| 1.1 | A person can … (U1) | |
| 1.2 | <a negative case: what must not happen> | |

## 4. Order and critical path

<Which stages block which; what runs in parallel.>

## 5. Status

| Stage | State | Evidence |
|---|---|---|
| 1 | Not started | |

## 6. Against the promise

<Honestly: how far is a real person from what was promised? The gaps, in the order they block it, and who each waits on.>
