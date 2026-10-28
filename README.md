# agentic-craft

A project-agnostic harness for **product reasoning with AI agents**: deciding what is worth building and what success means. It keeps every decision tied to what a person was promised, names what the plan takes on faith, defines success as evidence, and writes it all down as portable artifacts that people, other agents and other tools can use.

It's a set of **skills** (instructions an agent loads when they apply), **agents** (reviewers with one job each), **templates** and small **tools** with no dependencies. It works with GitHub Copilot (CLI and VS Code), Claude Code, and any agent that reads `AGENTS.md` or skill folders.

It defines product intent; it doesn't prescribe how the work is carried out. For execution modes, progress reviews, logs and handoffs, pair it with [agent-orchestration](https://github.com/prabinpebam/agent-orchestration), or use your own working practice.

## What's in it

| Skill | Use it when | What it gives you |
|---|---|---|
| [`craft`](skills/craft/SKILL.md) | Starting any product or feature work; unsure which practice applies | the spine (promise → jobs → user-can → flows → UI) to plan with, the eleven rules, Nielsen's ten [usability heuristics](skills/craft/references/usability-heuristics.md) to design and check the UI, and which skill to load when |
| [`ground`](skills/ground/SKILL.md) | Writing or critiquing a spec; a request jumps to UI | Customer promise, scenarios and jobs to be done, user-can statements, task flows, then views; a critique method |
| [`assumptions`](skills/assumptions/SKILL.md) | A plan rests on unproven beliefs; deciding what to validate first | Desirability, usability, feasibility and viability assumptions and risks, ranked by impact and evidence, each with a criterion, the cheapest check and the decision it changes |
| [`definition-of-done`](skills/definition-of-done/SKILL.md) | Defining success; deciding what "done" must prove | Project and stage Definitions of Done made from promises and user-can statements, observable rows with the evidence each needs, a "Try it", and an honest "against the promise" |
| [`design-system`](skills/design-system/SKILL.md) | Any UI change; defining a design system | Strict W3C DTCG tokens with light, dark and contrast contexts; tokens → fundamentals → compounds → layouts; sealed, self-documenting components; a library built from the source; **views made entirely from data**; the tests that enforce it |
| [`ui-copy`](skills/ui-copy/SKILL.md) | Writing any words a person reads | Voice, rules by element (buttons, labels, errors, empty states, waits…), a glossary, patterns, and the mechanical rules as a linter |
| [`perceived-performance`](skills/perceived-performance/SKILL.md) | Adding anything a person waits on | Four classes of wait (instant, responsive, waiting, long), the feedback patterns, and the rules: never block or lose input, keep the old view, one honest status, never a silent wait |
| [`performance`](skills/performance/SKILL.md) | Setting targets or budgets; changing loading or rendering; claiming something is faster | One benchmark command, metrics from the person's point of view, server spans, a committed baseline, noise-aware regression checks, budgets and targets, field data |

| Agent | Job |
|---|---|
| [`grounding-critic`](agents/grounding-critic.agent.md) | Finds orphans, gaps, leaks, untestable lines and unexamined assumptions in a spec, its Definitions of Done or a change |
| [`design-system-auditor`](agents/design-system-auditor.agent.md) | Audits UI changes against tokens, tiers, docs, states, accessibility and copy |

| Template | |
|---|---|
| [`spec.md`](templates/spec.md) | The grounded spec: promise, jobs, user-can statements, flows, views, architecture, waits, copy, assumptions and risks, decisions, as built |
| [`definition-of-done.md`](templates/definition-of-done.md) | Project and stage Definitions of Done, ordered by value and risk, with "against the promise" |
| [`copy-glossary.md`](templates/copy-glossary.md) | One term per concept |
| [`perf-budgets.json`](templates/perf-budgets.json) | Noise allowances, budgets and targets |
| [`tokens/`](templates/tokens/) | A starter DTCG token set: primitives, semantic roles and scales, a component group, light, dark and more-contrast contexts, contrast pairs |
| [`ui/`](templates/ui/) | A JSON Schema for views as data, and an example |

| Tool (Node 20+, no dependencies) | |
|---|---|
| `tools/install.mjs` | Installs the skills and agents into a project (or for every project on the computer) |
| `tools/build-tokens.mjs` | DTCG tokens → CSS custom properties (`light-dark()` pairs, modifier media queries), a reference page, resolved values; `--check` for stale output |
| `tools/check-tokens.mjs` | Descriptions, component-token ownership, aliases, and contrast pairs in every context |
| `tools/lint-styles.mjs` | Raw values, primitive tokens and bare `:hover` rules in CSS and component `<style>` blocks |
| `tools/lint-copy.mjs` | Banned words, title case, long or verbless buttons, straight quotes, emoji as icons, bare "Loading…", glossary terms |

## Install

Clone it once, then install into any project:

```sh
git clone https://github.com/prabinpebam/agentic-craft.git
node agentic-craft/tools/install.mjs path/to/your-project
```

That copies the skills to `.github/skills/` (and `.claude/skills/` when the project uses Claude Code), the agents beside them, and adds a **Craft** section to the project's `AGENTS.md` with the project facts the skills read: where the spec, its assumptions and the Definitions of Done live, the design system's folders, and the performance baseline and budgets. Fill those in. Run it again any time to update; your filled-in facts are kept, and other sections of `AGENTS.md` are left alone.

Options:

```sh
node tools/install.mjs <project> --for copilot,claude,agents   # choose the agents (agents = .agents/skills, read by Codex)
node tools/install.mjs <project> --templates docs/craft         # also copy the templates (files already there are kept)
node tools/install.mjs <project> --dry-run                      # show what it would do
node tools/install.mjs --global --for copilot,claude,agents     # for every project on this computer (~/.copilot, ~/.claude, ~/.agents)
```

Without `--for`, it installs for Copilot, plus Claude Code when the project has `.claude/` or `CLAUDE.md`, plus the open skills layout when it has `.agents/`; with `--global`, for Copilot and Claude Code. The installer never deletes files; remove retired skills yourself.

## Use

Ask your agent as you normally would; the skills load when they apply. Some starting points:

- "Spec this feature, grounded from the customer promise down to the UI." (`ground`)
- "What are we taking on faith here? Rank the risks and tell me what to validate first." (`assumptions`)
- "Define success for this: a project Definition of Done and stages a person can try, with the evidence for each row." (`definition-of-done`)
- "Critique this spec." (`grounding-critic`)
- "Define a design system for this app: tokens, fundamentals, compounds, layouts, and render the settings screen from data." (`design-system`)
- "Review the copy on these screens." (`ui-copy`)
- "Saving feels slow." (`perceived-performance`, then `performance`)

The design-system tools run on their own too:

```sh
node tools/build-tokens.mjs --src design/ --css styles/tokens.css --md docs/tokens.md --json design/tokens.resolved.json
node tools/check-tokens.mjs --src design/
node tools/lint-styles.mjs src/components --allow 1px
node tools/lint-copy.mjs src/components --glossary docs/glossary.md
```

## The ideas behind it

- **Grounded:** nothing is built that doesn't trace to a user-can statement and a promise.
- **Assumptions named:** what the plan takes on faith is written down, ranked and given a test.
- **Success means evidence:** a row in a table, with the proof it needs named in advance.
- **Honest waits:** speed is felt; feedback is matched to the wait and never lies.
- **Usable by design:** what to build comes from the chain (promise, jobs, user-can statements, flows); the UI that serves it is designed and reviewed against Nielsen's ten usability heuristics (H1 to H10), and the decisions they drive are written down.
- **Strict systems:** every value a token, every component in its tier and documented, every screen data.
- **Portable artifacts:** Markdown and JSON with stable IDs any person, agent or tool can cite.

## Using it with agent-orchestration and Slate

Each harness works on its own. Used together, they hand artifacts across a clear line, with no shared skills and no overlapping instructions:

| Harness | Owns | Produces |
|---|---|---|
| agentic-craft | What is worth building and what success means | Promise, jobs, user-can statements, flows, UX direction, assumptions and risks, Definitions of Done |
| [agent-orchestration](https://github.com/prabinpebam/agent-orchestration) | How the work is carried out, monitored and adapted | Work plan, execution mode and bounds, evidence, progress log, handoffs |
| [Slate](https://github.com/prabinpebam/slate) | Documentation authoring and reading | Browsable pages from either harness's artifacts, when useful |

What execution can rely on from this harness: the spec and Definitions of Done as plain Markdown, with stable IDs for promises (P1), jobs (J1), user-can statements (U1), assumptions (A1), decisions with working defaults (O1), and Definition of Done rows (PD1, 1.1); the riskiest assumptions ranked with criteria; and a "Try it" for every stage. What comes back: evidence recorded beside the rows, assumptions confirmed or refuted, and differences between what was built and the spec. Fold those into the spec's register and "As built" with these skills.

## Upgrading from 0.1.0

Version 0.2.0 keeps only product reasoning. Execution control moved to [agent-orchestration](https://github.com/prabinpebam/agent-orchestration):

| Removed here | Now |
|---|---|
| `orchestrate` skill | agent-orchestration's `orchestrate`, `execution-modes`, `stage-validation`, `progress-review` and `coordinate` |
| `throughput-reviewer` agent | agent-orchestration's `throughput-reviewer` |
| The build-check-fix loop, blocked rows, status and reporting in `definition-of-done` | agent-orchestration's `stage-validation` and `coordinate`; this skill now defines success criteria and evidence |
| `templates/progress-log.md` | agent-orchestration's `progress-log.md` and `handoff.md` |
| `templates/plan.md` | `templates/definition-of-done.md` here; execution steps and status in agent-orchestration's `work-plan.md` |

New here: the `assumptions` skill, an assumptions-and-risks section in `spec.md`, and value rows in the Definitions of Done. The `performance` skill now says what needs measurement evidence; when the checks run is up to whoever carries out the work.

The installer never deletes files, and it keeps the Craft section's facts as they are (it prints a note when they come from 0.1.0). In a project that installed 0.1.0:

1. Delete the old copies of the `orchestrate` skill and the `throughput-reviewer` agent from each layout you installed (`.github/skills/`, `.github/agents/`, `.claude/skills/`, `.claude/agents/`, `.agents/skills/`), unless agent-orchestration now provides them.
2. If you copied the templates, keep your filled-in `plan.md` and `progress-log.md` as documents, or move their Definitions of Done into `definition-of-done.md` and their build steps and status into a work plan. Rerunning with `--templates` adds the new starters and never replaces your files.
3. Rerun this installer, then replace the Craft section's facts:

   ```md
   <!-- 0.1.0 -->
   - **Spec and plan:** <spec> · <plan>
   - **Commands:** …
   - **Progress log:** …
   - **Branches and merges:** …
   - **Design system:** …

   <!-- 0.2.0 -->
   - **Product artifacts:** <spec, with its assumptions register> · <Definitions of Done>
   - **Design system:** … (unchanged)
   - **Performance:** benchmark `<…>` · baseline `<path>` · budgets `<path>`
   ```

   Move "Commands", "Progress log" and "Branches and merges" into agent-orchestration's section if you use it, or keep them in your own section of `AGENTS.md`.

## Developing the harness

```sh
npm test    # node --test test/: skill metadata, links, the product-reasoning boundary, no project-specific words, the tools
```

Keep it project-agnostic and independent: no product, person, machine or stack assumptions, and no execution-control practices or dependence on another harness, in `skills/`, `agents/`, `templates/` or `tools/` (the tests check). A practice belongs here only once it has worked in a real project.

## Licence

MIT
