#!/usr/bin/env node
// @ts-check
/**
 * Installs the agentic-craft harness into a project, or for every project on this computer, with no dependencies.
 *
 *   node tools/install.mjs <project folder> [--for copilot,claude,agents] [--templates <folder>] [--dry-run]
 *   node tools/install.mjs --global [--for copilot,claude,agents]
 *
 * - Skills go where each agent looks for them: GitHub Copilot `.github/skills/<name>/`, Claude Code
 *   `.claude/skills/<name>/`, Codex and other agents that read the open skills layout `.agents/skills/<name>/`
 *   (with --global: `~/.copilot/skills`, `~/.claude/skills`, `~/.agents/skills`).
 * - Agents go to `.github/agents/<name>.agent.md` (Copilot) and `.claude/agents/<name>.md` (Claude Code).
 * - The project's AGENTS.md (and CLAUDE.md, when there is one) gets a section between markers, with the project
 *   facts the skills read, to fill in. Run again to update the skills; the section's filled-in facts are kept.
 * - --templates copies the spec, Definitions of Done, glossary, budgets, token and view starters into a folder,
 *   keeping any file already there.
 * Without --for it installs for Copilot, plus Claude Code when the project has .claude/ or CLAUDE.md, plus the
 * open skills layout when the project has .agents/.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argumentsFor, copyTree, prepare, finish, output, safe } from './install-contract.mjs';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- agentic-craft:start -->';
const END = '<!-- agentic-craft:end -->';

/** The section the harness keeps in AGENTS.md; `facts` is what the project filled in before (kept). */
export function section(/** @type {string | null} */ facts) {
  const defaultFacts = `### Project facts (fill in; the skills read these)

- **Product artifacts:** <path to the spec, with its assumptions register> · <path to the Definitions of Done>
- **Design system:** tokens \`<source folder>\`, built with \`<…>\` · components by tier \`<folders>\` · library at \`<address>\` · glossary \`<path>\`
- **Performance:** benchmark \`<…>\` · baseline \`<path>\` · budgets \`<path>\``;
  return `${START}
## Craft (agentic-craft harness)

This project uses the [agentic-craft](https://github.com/prabinpebam/agentic-craft) skills for product reasoning: what is worth building and what success means. Start with the \`craft\` skill; it routes to the rest: \`ground\` (promise → jobs → user-can → flows → UI), \`assumptions\`, \`definition-of-done\`, \`design-system\`, \`ui-copy\`, \`perceived-performance\`, \`performance\`. Agents: \`grounding-critic\`, \`design-system-auditor\`. These skills define product intent and success criteria; they don't prescribe how the work is carried out.

${facts ?? defaultFacts}
${END}`;
}

/** AGENTS.md with the harness's section added or updated, keeping the project's filled-in facts. */
export function withSection(/** @type {string} */ text) {
  const i = text.indexOf(START);
  const j = text.indexOf(END);
  if (i >= 0 && j > i) {
    const old = text.slice(i, j);
    const facts = /### Project facts[\s\S]*$/.exec(old.trimEnd())?.[0] ?? null;
    return text.slice(0, i) + section(facts) + text.slice(j + END.length);
  }
  return `${text.trimEnd()}${text.trim() ? '\n\n' : ''}${section(null)}\n`;
}

const factNames = (/** @type {string} */ text) => [...text.matchAll(/^- \*\*([^*]+):\*\*/gm)].map((m) => m[1]);

/** When kept facts come from an earlier version: the facts this version reads that are missing, and the kept ones it doesn't read. */
export function factsCheck(/** @type {string} */ text) {
  const i = text.indexOf(START);
  const j = text.indexOf(END);
  if (i < 0 || j < i) return { missing: [], extra: [] };
  const known = factNames(section(null));
  const kept = factNames(text.slice(i, j));
  const missing = known.filter((k) => !kept.includes(k));
  return missing.length ? { missing, extra: kept.filter((k) => !known.includes(k)) } : { missing: [], extra: [] };
}

/** The agents to install for when --for isn't given. */
export function defaultKinds(/** @type {string} */ root) {
  return [
    'copilot',
    ...(existsSync(join(root, '.claude')) || existsSync(join(root, 'CLAUDE.md')) ? ['claude'] : []),
    ...(existsSync(join(root, '.agents')) ? ['agents'] : []),
  ];
}

const skills = () => readdirSync(join(HERE, 'skills'));
const agents = () => readdirSync(join(HERE, 'agents')).filter((f) => f.endsWith('.agent.md'));

/** What to copy where, for a target. */
export function plan(/** @type {string} */ target, /** @type {string[]} */ kinds, /** @type {boolean} */ global) {
  /** @type {{ from: string, to: string }[]} */
  const copies = [];
  const roots = {
    copilot: global ? { skills: join(homedir(), '.copilot', 'skills'), agents: join(homedir(), '.copilot', 'agents') } : { skills: join(target, '.github', 'skills'), agents: join(target, '.github', 'agents') },
    claude: global ? { skills: join(homedir(), '.claude', 'skills'), agents: join(homedir(), '.claude', 'agents') } : { skills: join(target, '.claude', 'skills'), agents: join(target, '.claude', 'agents') },
    agents: { skills: join(target, '.agents', 'skills'), agents: null },
  };
  for (const kind of kinds) {
    const r = /** @type {any} */ (roots)[kind];
    if (!r) throw new Error(`Unknown --for ${kind}: use copilot, claude or agents`);
    for (const s of skills()) copies.push({ from: join(HERE, 'skills', s), to: join(r.skills, s) });
    if (r.agents) for (const a of agents()) copies.push({ from: join(HERE, 'agents', a), to: join(r.agents, kind === 'claude' ? a.replace('.agent.md', '.md') : a) });
  }
  return copies;
}

export function contract(argv) {
  const o = argumentsFor(argv, ['logical-root']);
  if (!o.target && !o.global) throw Object.assign(new Error('Choose a project folder or --global.'), { code: 2 });
  const root = resolve(o.global ? homedir() : o.target);
  if (!o.kinds.length) {
    if (o.json || !process.stdin.isTTY) throw Object.assign(new Error('Choose --for copilot,claude,agents explicitly.'), { code: 2 });
    o.kinds = defaultKinds(root);
  }
  const entries = [];
  for (const c of plan(root, o.kinds, o.global)) {
    const to = c.to.slice(root.length + 1).replaceAll('\\', '/');
    const from = c.from.slice(HERE.length + 1).replaceAll('\\', '/');
    if (from.startsWith('skills/')) entries.push(...copyTree(HERE, from, to));
    else entries.push({ path: to, bytes: readFileSync(c.from) });
  }
  if (!o.global) {
    for (const name of ['AGENTS.md', ...(existsSync(join(root, 'CLAUDE.md')) ? ['CLAUDE.md'] : [])]) entries.push({ path: name, section: { start: START, end: END, transform: withSection } });
    if (o.templates) { safe(root, o.templates); entries.push(...copyTree(HERE, 'templates', o.templates, 'keep')); }
  }
  const allowed = (p) => ['AGENTS.md', 'CLAUDE.md'].includes(p) && !o.global
    || ['.github', '.copilot', '.claude', '.agents'].some((d) => p.startsWith(`${d}/skills/`) && skills().some((s) => p.startsWith(`${d}/skills/${s}/`))
      || p.startsWith(`${d}/agents/`) && agents().some((a) => p === `${d}/agents/${d === '.claude' ? a.replace('.agent.md', '.md') : a}`))
    || !!o.templates && p.startsWith(`${o.templates}/`);
  const result = finish(prepare({ id: 'agentic-craft', root, entries, allowed, uninstall: o.uninstall, effects: ['writes-project-files'], settings: { kinds: o.kinds, global: !!o.global, templates: o.templates ?? null } }), o, 'Fill in Project facts in AGENTS.md.');
  if (!o.json && result.status === 'ok') console.log(`${o['dry-run'] ? 'planned' : o.uninstall ? 'removed' : 'installed'} ${skills().length} skills and ${agents().length} agents for ${o.kinds.join(', ')}`);
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = output(() => contract(process.argv.slice(2)), process.argv.slice(2));
