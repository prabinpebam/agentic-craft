---
name: craft
description: Use at the start of any product or feature work, and whenever unsure which product practice applies. The entry point to agentic-craft's product reasoning - the chain from customer promise to UI, the assumptions and risks to validate, success criteria and Definitions of Done, and the UX practices (data-driven design systems, UI copy, perceived performance, performance targets). Routes to the right skill and sets the order they apply in.
---

# Craft: product reasoning

A way of deciding, with AI agents, what is worth building and what success means. It keeps every decision tied to what a person was promised, names what the plan takes on faith, and defines success as evidence. It writes all of that down as portable artifacts that people, other agents and other tools can use. It's a set of skills; this one says which to use and when.

## The spine

Every piece of work hangs off one chain. Never start lower in the chain than the work justifies, and never let a lower link contradict a higher one.

```
Customer promise  →  Scenarios / jobs to be done  →  User-can statements  →  Task flows  →  UI and views
       (why)               (when and for whom)            (what's possible)        (in what order)    (what it looks like)
```

Each link is checked against the one above it (`ground`). The beliefs the chain rests on are listed and ranked (`assumptions`). Success is defined as rows with their evidence (`definition-of-done`). The experience is expressed through a design system (`design-system`), with copy that follows rules (`ui-copy`), waits that feel honest (`perceived-performance`) and targets that are measured (`performance`).

## Which skill, when

| You're about to… | Load |
|---|---|
| Start a product, a feature or a big change; write or critique a spec | `ground` |
| Find what the plan takes on faith, rank the risks, or decide what to validate first | `assumptions` |
| Define what success means, what "done" must prove, or how far a product is from its promise | `definition-of-done` |
| Add or change UI, or define a design system | `design-system` |
| Write any words a person reads in the product | `ui-copy` |
| Add something that makes a person wait (a save, a load, a sync) | `perceived-performance` |
| Set performance targets or budgets, change loading or rendering, or judge a claim that something is faster | `performance` |

Most changes need two or three of them: a new screen is `ground` (does it serve a promise?), `design-system` (made of what?), `ui-copy` (its words) and `perceived-performance` (its waits).

## Rules that hold everywhere

1. **Grounded or not built.** A screen, setting or behaviour traces to a user-can statement, which traces to a promise. If it doesn't, either the spec is missing something (fix the spec first) or the work isn't needed.
2. **Name what you're taking on faith.** Every plan rests on beliefs about people, value and feasibility. List them, rank them by how badly the plan fails if they're wrong, and say what would confirm each.
3. **Success means evidence.** Success is a row in a Definition of Done with the evidence that would prove it: a test, a measurement, an observation of a person, a screenshot looked at. Never "should work".
4. **The spec is the source of truth.** When what was built differs from the spec, the spec's "As built" section says so, and a refuted assumption changes every link it touches.
5. **Complete by definition.** A UI requirement includes light and dark, every state (rest, hover, active, focus, disabled, error, empty, loading), keyboard and screen reader, and small screens. They're part of what's asked for, not polish.
6. **Never a silent wait, never a lie.** Every wait has a sign where it happens; "Saved" means saved.
7. **Every value is a token; every component documents itself.** UI is assembled from a library, not hand-styled per page.
8. **Copy is part of the design.** Words follow written rules and a glossary.
9. **Measure before and after.** A performance claim without a baseline and a comparison isn't one.
10. **Portable artifacts.** Plain Markdown and JSON with stable IDs (P1 promises, J1 jobs, U1 user-can statements, A1 assumptions, O1 decisions, PD1 and 1.1 Definition of Done rows), so people, other agents and other tools can cite them without rereading everything.

## Where this stops

These skills define product intent: what to build, for whom, why, and what proves it worked. They don't prescribe how the work is carried out (the order of tasks, check schedules, progress tracking or how agents run). Any working practice can consume the artifacts by their IDs. When its findings change the intent (an assumption refuted, a promise at risk, a build that differs from the spec), fold them back into the spec here.

## Setting it up in a project

The installer (`node tools/install.mjs <project>` from this repository) copies the skills and agents into the project and adds a short section to its `AGENTS.md` (or `CLAUDE.md`). The project then fills in its own facts in that section. The skills read those facts from there and never assume a stack.

Project facts the skills expect to find in `AGENTS.md` (each optional; a skill asks or proposes one when it's missing):

- **Product artifacts:** where the spec (with its assumptions register) and the Definitions of Done live.
- **Design system:** the token source and build command, the component folders by tier, the library's address, the copy glossary.
- **Performance:** the benchmark command, the baseline and the budgets.
