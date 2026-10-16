---
name: craft
description: Use at the start of any product or feature work, and whenever unsure which practice applies. The entry point to the agentic-craft harness - grounding (promise to UI), Definitions of Done and agentic loops, attended and unattended orchestration, performance and perceived performance, UI copy, and data-driven design systems. Routes to the right skill and sets the order they apply in.
---

# Craft: the harness

A way of building products with AI agents that keeps every change tied to what a person was promised, proves it with evidence, and spends the owner's attention only where it's needed. It's a set of skills; this one says which to use and when.

## The spine

Every piece of work hangs off one chain. Never start lower in the chain than the work justifies, and never let a lower link contradict a higher one.

```
Customer promise  →  Scenarios / jobs to be done  →  User-can statements  →  Task flows  →  UI and views
       (why)               (when and for whom)            (what's possible)        (in what order)    (what it looks like)
```

Each link is checked against the one above it (`ground`), built against a Definition of Done (`definition-of-done`), run in loops with the right amount of the owner's attention (`orchestrate`), and expressed through a design system (`design-system`) with copy that follows rules (`ui-copy`) and waits that feel honest (`perceived-performance`), measured (`performance`).

## Which skill, when

| You're about to… | Load |
|---|---|
| Start a product, a feature or a big change; write or critique a spec | `ground` |
| Turn a spec into stages, decide what "done" means, or check whether something is done | `definition-of-done` |
| Work on anything for more than a few minutes, especially with the owner away | `orchestrate` |
| Add or change UI, or define a design system | `design-system` |
| Write any words a person reads in the product | `ui-copy` |
| Add something that makes a person wait (a save, a load, a sync) | `perceived-performance` |
| Change loading, rendering, data access, or claim something is faster | `performance` |

Most changes need two or three of them: a new screen is `ground` (does it serve a promise?), `design-system` (made of what?), `ui-copy` (its words) and `perceived-performance` (its waits).

## Rules that hold everywhere

1. **Grounded or not built.** A screen, setting or behaviour traces to a user-can statement, which traces to a promise. If it doesn't, either the spec is missing something (fix the spec first) or the work isn't needed.
2. **Done means evidence.** "Done" is a row in a Definition of Done with its evidence beside it: a test, a command's output, a screenshot looked at, a measurement. Never "should work".
3. **The spec is the source of truth, updated in the same change as the code.** When what was built differs from the spec, the spec's "as built" section and the evidence say so.
4. **The owner's attention is the scarcest resource.** Validated progress per hour, not completeness per task. Ask only what can't be decided from context; when away, decide, say what was assumed, and keep going.
5. **Smallest check that covers the change.** Scope validation to the blast radius; escalate only for stated reasons.
6. **Basics right the first time.** Light and dark, every state (rest, hover, active, focus, disabled, error, empty, loading), keyboard and screen reader, small screens: checked before anyone is shown.
7. **Never a silent wait, never a lie.** Every wait has a sign where it happens; "Saved" means saved.
8. **Every value is a token; every component documents itself.** UI is assembled from a library, not hand-styled per page.
9. **Copy is part of the design.** Words follow written rules and a glossary.
10. **Measure before and after.** A performance claim without a baseline and a comparison isn't one.

## Setting it up in a project

The installer (`node tools/install.mjs <project>` from this repository) copies the skills and agents into the project and adds a short section to its `AGENTS.md` (or `CLAUDE.md`). The project then fills in its own facts in that section: where its spec lives, its commands for each validation tier, its progress log, its design system's folders. The skills read those facts from there and never assume a stack.

Project facts the skills expect to find in `AGENTS.md` (each optional; a skill asks or proposes one when it's missing):

- **Specs and plans:** where they live, and the plan with its Definitions of Done.
- **Commands:** the fast unit check, the type check, the targeted end-to-end command, the full suites, the production build with budgets, the benchmark.
- **Modes:** the progress log's path, the branch and worktree rules, how to merge and deploy, and what must never break (the live site, a public API).
- **Design system:** the token source and build command, the component folders by tier, the library's address, the copy glossary.
