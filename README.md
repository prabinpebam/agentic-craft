# agentic-craft

A project-agnostic harness for building products with AI agents. It keeps every change tied to what a person was promised, proves it with evidence, and spends the owner's attention only where it's needed.

It's a set of **skills** (instructions an agent loads when they apply), **agents** (reviewers with one job each), **templates** and small **tools** with no dependencies. It works with GitHub Copilot (CLI and VS Code), Claude Code, and any agent that reads `AGENTS.md` or skill folders.

## What's in it

| Skill | Use it when | What it gives you |
|---|---|---|
| [`craft`](skills/craft/SKILL.md) | Starting any work; unsure which practice applies | The spine (promise → jobs → user-can → flows → UI), the ten rules, and which skill to load when |
| [`ground`](skills/ground/SKILL.md) | Writing or critiquing a spec; a request jumps to UI | Customer promise, scenarios and jobs to be done, user-can statements, task flows, then views; a critique method |
| [`definition-of-done`](skills/definition-of-done/SKILL.md) | Planning; deciding or proving "done" | Project and stage Definitions of Done with evidence, reviewable stages with a "Try it", build-check-fix loops, blocked rows, status |
| [`orchestrate`](skills/orchestrate/SKILL.md) | Any multi-step work, attended or unattended | Attended (one fix in ~15 minutes) and unattended (45-minute time-boxes, decide don't ask, handoffs) modes, validation tiers, merges, the progress log, delegation, the throughput review |
| [`design-system`](skills/design-system/SKILL.md) | Any UI change; defining a design system | Strict W3C DTCG tokens with light, dark and contrast contexts; tokens → fundamentals → compounds → layouts; sealed, self-documenting components; a library built from the source; **views made entirely from data**; the tests that enforce it |
| [`ui-copy`](skills/ui-copy/SKILL.md) | Writing any words a person reads | Voice, rules by element (buttons, labels, errors, empty states, waits…), a glossary, patterns, and the mechanical rules as a linter |
| [`perceived-performance`](skills/perceived-performance/SKILL.md) | Adding anything a person waits on | Four classes of wait (instant, responsive, waiting, long), the feedback patterns, and the rules: never block or lose input, keep the old view, one honest status, never a silent wait |
| [`performance`](skills/performance/SKILL.md) | Changing loading or rendering; claiming something is faster | One benchmark command, metrics from the person's point of view, server spans, a committed baseline, noise-aware regression checks, budgets and targets, field data |

| Agent | Job |
|---|---|
| [`throughput-reviewer`](agents/throughput-reviewer.agent.md) | Every 30 minutes of running work: is this the fastest path to validated progress? |
| [`grounding-critic`](agents/grounding-critic.agent.md) | Finds orphans, gaps, leaks and untestable lines in a spec, a plan or a change |
| [`design-system-auditor`](agents/design-system-auditor.agent.md) | Audits UI changes against tokens, tiers, docs, states, accessibility and copy |

| Template | |
|---|---|
| [`spec.md`](templates/spec.md) · [`plan.md`](templates/plan.md) | The grounded spec and the plan with Definitions of Done |
| [`copy-glossary.md`](templates/copy-glossary.md) | One term per concept |
| [`perf-budgets.json`](templates/perf-budgets.json) | Noise allowances, budgets and targets |
| [`progress-log.md`](templates/progress-log.md) | The log line and the handoff |
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

That copies the skills to `.github/skills/` (and `.claude/skills/` when the project uses Claude Code), the agents beside them, and adds a **Craft** section to the project's `AGENTS.md` with the project facts the skills read: where the spec and plan live, the commands for each validation tier, the progress log, the design system's folders. Fill those in. Run it again any time to update; your filled-in facts are kept.

Options:

```sh
node tools/install.mjs <project> --for copilot,claude,agents   # choose the agents
node tools/install.mjs <project> --templates docs/craft         # also copy the templates
node tools/install.mjs <project> --dry-run                      # show what it would do
node tools/install.mjs --global                                 # for every project on this computer (~/.copilot, ~/.claude)
```

## Use

Ask your agent as you normally would; the skills load when they apply. Some starting points:

- "Spec this feature, grounded from the customer promise down to the UI." (`ground`)
- "Critique this spec." (`grounding-critic`)
- "Plan it in reviewable stages with a project and stage Definition of Done, then build it against the DoD, unattended." (`definition-of-done`, `orchestrate`)
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
- **Done means evidence:** a row in a table with its proof beside it.
- **Validated progress per hour:** the owner's attention is the constraint; checks are scoped to the change; basics are right the first time.
- **Honest waits:** speed is felt; feedback is matched to the wait and never lies.
- **Strict systems:** every value a token, every component in its tier and documented, every screen data.

## Developing the harness

```sh
npm test    # node --test test/: skill metadata, links, no project-specific words, the tools
```

Keep it project-agnostic: no product, person, machine or stack assumptions in `skills/`, `agents/`, `templates/` or `tools/` (the tests check). A practice belongs here only once it has worked in a real project.

## Licence

MIT
