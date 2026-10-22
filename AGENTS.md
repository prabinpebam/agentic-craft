# AGENTS.md (this repository)

This repository is the **agentic-craft** harness itself: skills, agents, templates and tools for product reasoning in any project.

- **Product reasoning only.** Promise, jobs, user-can statements, flows, UX direction, assumptions and risks, success criteria and their evidence. How work is carried out (execution modes, check schedules, progress reviews, logs, delegation, handoffs) belongs to an execution harness; `npm test` rejects that vocabulary in shipped folders.
- **Independent.** Nothing in `skills/`, `agents/`, `templates/` or `tools/` may require another harness. Integration is documented in the README only.
- **Keep it project-agnostic.** No product names, people, machine paths or stack assumptions in `skills/`, `agents/`, `templates/` or `tools/`. Examples use neutral content. `npm test` checks this.
- **Skills** are folders under `skills/` with a `SKILL.md` whose frontmatter has `name` (the folder's name) and `description` (starting "Use when…", at most 1024 characters). Longer detail goes in the skill's `references/`.
- **The `craft` skill routes to every other skill;** a new skill gets a row in its table and in the README.
- **Agents** are `agents/<name>.agent.md` with `name` and `description` frontmatter; the installer renames them for Claude Code.
- **Tools** are single-file Node 20+ ES modules with no dependencies, usable from the command line and importable for tests.
- **Check:** `npm test` (Node's own test runner). It runs in CI on every push.
- Copy in this repository follows the `ui-copy` skill: plain words, sentence case, no filler.
