// The harness's own checks: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/build-tokens.mjs';
import { contrast, problems } from '../tools/check-tokens.mjs';
import { lint } from '../tools/lint-styles.mjs';
import { glossary, lintString, stringsInSource } from '../tools/lint-copy.mjs';
import { plan, withSection } from '../tools/install.mjs';

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
  assert.ok(copies.some((c) => c.to === join(dir, '.claude', 'agents', 'throughput-reviewer.md')));
  const first = withSection('# My project\n');
  assert.match(first, /<!-- agentic-craft:start -->[\s\S]*### Project facts[\s\S]*<!-- agentic-craft:end -->/);
  const filled = first.replace('<a path outside the repository>', '~/logs/progress.log');
  const again = withSection(filled);
  assert.match(again, /~\/logs\/progress\.log/);
  assert.equal((again.match(/agentic-craft:start/g) ?? []).length, 1);
});
