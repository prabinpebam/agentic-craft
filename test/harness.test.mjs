// The harness's own checks: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from '../tools/build-tokens.mjs';
import { contrast, problems } from '../tools/check-tokens.mjs';
import { lint } from '../tools/lint-styles.mjs';
import { glossary, lintString, stringsInSource } from '../tools/lint-copy.mjs';
import { defaultKinds, factsCheck, plan, withSection } from '../tools/install.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => readdirSync(d).flatMap((n) => (n === '.git' || n === 'node_modules' ? [] : statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const frontmatter = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? Object.fromEntries(m[1].split(/\r?\n/).map((l) => /^(\w[\w-]*):\s*(.*)$/.exec(l)).filter(Boolean).map((x) => [x[1], x[2].replace(/^'|'$/g, '')])) : null;
};

test('every skill has a SKILL.md whose name is its folder and whose description says when to use it', () => {
  const skills = readdirSync(join(ROOT, 'skills'));
  assert.ok(skills.length >= 8);
  for (const s of skills) {
    const fm = frontmatter(readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8'));
    assert.ok(fm, `${s}: frontmatter`);
    assert.equal(fm.name, s);
    assert.match(fm.description, /^Use /, `${s}: description starts with "Use"`);
    assert.ok(fm.description.length <= 1024, `${s}: description at most 1024 characters`);
  }
});

test('every agent has a name and a description', () => {
  for (const a of readdirSync(join(ROOT, 'agents'))) {
    const fm = frontmatter(readFileSync(join(ROOT, 'agents', a), 'utf8'));
    assert.ok(fm?.name && fm?.description, a);
    assert.equal(fm.name, a.replace('.agent.md', ''));
  }
});

test('the craft skill routes to every other skill, and every skill it names exists', () => {
  const craft = readFileSync(join(ROOT, 'skills', 'craft', 'SKILL.md'), 'utf8');
  const skills = readdirSync(join(ROOT, 'skills')).filter((s) => s !== 'craft');
  for (const s of skills) assert.ok(craft.includes(`\`${s}\``), `craft names ${s}`);
  for (const m of craft.matchAll(/\| `([a-z-]+)` \|/g)) assert.ok(skills.includes(m[1]), `${m[1]} exists`);
});

test('project-agnostic: no project, person or machine names in skills, agents, templates or tools', () => {
  const BANNED = /\b(atiya|chopper|little planet|cozy life|personal-site|pebam)\b|[A-Z]:\\{1,2}Projects|\/Users\/[a-z]+\//i;
  const files = ['skills', 'agents', 'templates', 'tools'].flatMap((d) => walk(join(ROOT, d)));
  for (const f of files) {
    const text = readFileSync(f, 'utf8').replace(/https:\/\/github\.com\/prabinpebam\/agentic-craft[\w/.-]*/g, '');
    const m = BANNED.exec(text);
    assert.equal(m, null, `${relative(ROOT, f)}: "${m?.[0]}"`);
    assert.doesNotMatch(text, /prabin/i, `${relative(ROOT, f)} names a person`);
  }
});

test('the usability heuristics: all ten, in order, and every UX skill and reviewer applies them', () => {
  const ref = readFileSync(join(ROOT, 'skills', 'craft', 'references', 'usability-heuristics.md'), 'utf8');
  const heads = [...ref.matchAll(/^## H(\d+)\. (.+)$/gm)].map((m) => Number(m[1]));
  assert.deepEqual(heads, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const s of ['craft', 'ground', 'design-system', 'definition-of-done', 'ui-copy'])
    assert.match(readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8'), /usability-heuristics\.md/, `${s} links the heuristics`);
  for (const a of ['design-system-auditor', 'grounding-critic'])
    assert.match(readFileSync(join(ROOT, 'agents', `${a}.agent.md`), 'utf8'), /H1 to H10/, `${a} reviews against the heuristics`);
});

test('relative links in the markdown resolve', () => {
  for (const f of walk(ROOT).filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || target.startsWith('<')) continue;
      assert.ok(existsSync(resolve(dirname(f), target)), `${relative(ROOT, f)} → ${target}`);
    }
  }
});

test('the starter tokens hold every rule, build deterministically, and emit light-dark pairs and the contrast modifier', () => {
  const src = join(ROOT, 'templates', 'tokens');
  assert.deepEqual(problems(src), []);
  const a = build(src);
  const b = build(src);
  assert.equal(a.css, b.css);
  assert.match(a.css, /--color-text: light-dark\(var\(--p-ink-900\), var\(--p-ink-50\)\);/);
  assert.match(a.css, /--space-4: 1rem;/);
  assert.match(a.css, /--c-button-height: var\(--size-control\);/);
  assert.match(a.css, /@media \(prefers-contrast: more\)/);
  assert.equal(a.resolved.dark['color.text'], '#f7f7f8');
  assert.match(a.md, /\| `--c-button-height` \|.*\| Button \|/);
});

test('the token check catches a missing description, a component token on a primitive, and low contrast', () => {
  const dir = mkdtempSync(join(tmpdir(), 'craft-tokens-'));
  cpSync(join(ROOT, 'templates', 'tokens'), dir, { recursive: true });
  const light = JSON.parse(readFileSync(join(dir, 'tokens.light.json'), 'utf8'));
  light.color['text-muted'].$value = '{p.ink.300}';
  writeFileSync(join(dir, 'tokens.light.json'), JSON.stringify(light));
  const base = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'));
  base.c.button.radius.$value = '{p.ink.50}';
  delete base.space['4'].$description;
  writeFileSync(join(dir, 'tokens.json'), JSON.stringify(base));
  const found = problems(dir).join('\n');
  assert.match(found, /contrast color\.text-muted on color\.bg \(light\)/);
  assert.match(found, /c\.button\.radius: a component token aliases a semantic token, never a primitive/);
  assert.match(found, /space\.4: no \$description/);
  assert.ok(contrast('#000000', '#ffffff') > 20.9);
});

test('the style linter finds raw values, primitives and bare hovers, and passes token-only styles', () => {
  const bad = lint(`.a {\n  color: #fff;\n  padding: 12px;\n  margin: var(--p-space-2);\n}\n.a:hover { color: var(--color-accent); }`);
  assert.deepEqual(bad.map((f) => f.rule), ['raw colour', 'raw value 12px', 'reads a primitive token', 'hover outside @media (hover: hover)']);
  const good = lint(`.a {\n  color: var(--color-text);\n  padding: var(--space-4) 0;\n  inline-size: 100%;\n  --fill: 0.5;\n}\n@media (hover: hover) {\n  .a:hover { color: var(--color-accent-hover); }\n}`);
  assert.deepEqual(good, []);
});

test('the copy linter applies the ui-copy rules', () => {
  assert.deepEqual(lintString('button', 'Save changes'), []);
  assert.ok(lintString('button', 'OK').some((f) => f.startsWith('banned word')));
  assert.ok(lintString('button', 'Click Here To Save Your Work').some((f) => f.startsWith('button of 6 words')));
  assert.ok(lintString('heading', 'Contact And Visitor Counts').some((f) => f.startsWith('title case')));
  assert.ok(lintString('status', 'Loading…').some((f) => f.startsWith('bare')));
  assert.ok(lintString('any', "Don't do it, 'now'").some((f) => f.startsWith('straight quotes')));
  assert.deepEqual(stringsInSource('<button class="x">Publish page</button><h2>Your pages</h2><a aria-label="Close the menu">'), [['button', 'Publish page'], ['heading', 'Your pages'], ['any', 'Close the menu']]);
  const pairs = glossary('| Term | Means | Use instead of |\n|---|---|---|\n| publish | make it public | deploy, push |');
  assert.deepEqual(pairs, [['publish', 'deploy'], ['publish', 'push']]);
  assert.ok(lintString('status', 'Deploying your site…', { proper: new Set(), insteadOf: [['publish', 'deploying']] }).some((f) => f.includes('say "publish"')));
});

test('the installer copies skills and agents where each agent looks, and keeps the filled-in project facts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'craft-install-'));
  const copies = plan(dir, ['copilot', 'claude'], false);
  assert.ok(copies.some((c) => c.to === join(dir, '.github', 'skills', 'craft')));
  assert.ok(copies.some((c) => c.to === join(dir, '.github', 'skills', 'assumptions')));
  assert.ok(copies.some((c) => c.to === join(dir, '.claude', 'agents', 'grounding-critic.md')));
  const first = withSection('# My project\n');
  assert.match(first, /<!-- agentic-craft:start -->[\s\S]*### Project facts[\s\S]*<!-- agentic-craft:end -->/);
  const filled = first.replace('<path to the Definitions of Done>', 'docs/done.md');
  const again = withSection(filled);
  assert.match(again, /docs\/done\.md/);
  assert.equal((again.match(/agentic-craft:start/g) ?? []).length, 1);
});

test('the installer leaves other sections in AGENTS.md alone', () => {
  const other = '# Project\n\n<!-- other-harness:start -->\n## Other\n\n### Project facts\n\n- **Progress log:** ~/logs/progress.log\n<!-- other-harness:end -->\n';
  const once = withSection(other);
  assert.ok(once.startsWith(other.trimEnd()), 'the other section is untouched');
  assert.equal(withSection(once), once, 'a second run changes nothing');
});

test('the installer detects the agents a project uses, and notices facts kept from an earlier version', () => {
  const dir = mkdtempSync(join(tmpdir(), 'craft-kinds-'));
  assert.deepEqual(defaultKinds(dir), ['copilot']);
  mkdirSync(join(dir, '.claude'));
  mkdirSync(join(dir, '.agents'));
  assert.deepEqual(defaultKinds(dir), ['copilot', 'claude', 'agents']);
  assert.deepEqual(factsCheck(withSection('# Project\n')), { missing: [], extra: [] });
  const earlier = '<!-- agentic-craft:start -->\n## Craft\n\n### Project facts\n\n- **Spec and plan:** docs/spec.md\n- **Commands:** npm test\n- **Design system:** design/\n<!-- agentic-craft:end -->\n';
  assert.deepEqual(factsCheck(withSection(earlier)), { missing: ['Product artifacts', 'Performance'], extra: ['Spec and plan', 'Commands'] });
});

test('the installer runs from the command line, never replaces a filled-in template, and is idempotent', () => {
  const dir = mkdtempSync(join(tmpdir(), 'craft-cli-'));
  writeFileSync(join(dir, 'AGENTS.md'), '# Project\n');
  const run = () => execFileSync(process.execPath, [join(ROOT, 'tools', 'install.mjs'), dir, '--for', 'copilot,agents', '--templates', 'docs/craft'], { encoding: 'utf8' });
  assert.match(run(), /installed \d+ skills and \d+ agents for copilot, agents/);
  assert.ok(existsSync(join(dir, '.agents', 'skills', 'assumptions', 'SKILL.md')));
  assert.ok(existsSync(join(dir, 'docs', 'craft', 'tokens')));
  writeFileSync(join(dir, 'docs', 'craft', 'spec.md'), '# Filled-in spec\n');
  const after = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  run();
  assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), after);
  assert.equal(readFileSync(join(dir, 'docs', 'craft', 'spec.md'), 'utf8'), '# Filled-in spec\n');
});

test('product reasoning only: no execution-control skills, agents, templates or instructions, and no dependence on another harness', () => {
  for (const s of ['orchestrate', 'execution-modes', 'stage-validation', 'progress-review', 'coordinate']) assert.ok(!existsSync(join(ROOT, 'skills', s)), `skills/${s} belongs to an execution harness`);
  assert.ok(!existsSync(join(ROOT, 'agents', 'throughput-reviewer.agent.md')), 'the throughput reviewer belongs to an execution harness');
  for (const t of ['progress-log.md', 'work-plan.md', 'handoff.md', 'plan.md']) assert.ok(!existsSync(join(ROOT, 'templates', t)), `templates/${t} belongs to an execution harness`);
  const EXECUTION = /\b(unattended|attended|time-?box(es|ed)?|throughput|progress log|hand-?offs?|hand over|delegat\w*|sub-?agents?|validation tiers?|per hour|orchestrat\w*|worktrees?|slate)\b/i;
  for (const f of ['skills', 'agents', 'templates', 'tools'].flatMap((d) => walk(join(ROOT, d)))) {
    const m = EXECUTION.exec(readFileSync(f, 'utf8'));
    assert.equal(m, null, `${relative(ROOT, f)}: "${m?.[0]}"`);
  }
});
