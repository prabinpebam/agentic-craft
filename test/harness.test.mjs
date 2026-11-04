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
import { lintSpacing } from '../tools/lint-spacing.mjs';
import { analyze, compare, mirror, report } from '../tools/spacing-probe.mjs';
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
  const BANNED = /\b(atiya|chopper|little planet|cozy life|personal-site|pebam|focus[ -]notes)\b|[A-Z]:\\{1,2}Projects|\/Users\/[a-z]+\//i;
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

test('ui-states keeps its fixed rules, its references, and its neighbours point to it', () => {
  const dir = join(ROOT, 'skills', 'ui-states');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  for (const rule of [/at least 200 ms, even when the save is instant/, /smallest independent unit/, /extremely rare/, /green tick in a circle/, /spinner replaces the (switch|control)/i, /subtle/, /notification pill, at the bottom/i, /auto-dismiss or hard-dismiss/, /at most three/, /transparent/, /recovery action/, /Input is never lost/])
    assert.match(skill, rule, `ui-states keeps ${rule}`);
  for (const rule of [/Empty is never left empty/, /same wrapper the content uses/, /minimum width and height/, /why it's empty and what to do/, /quirky message/, /subtle silhouette/])
    assert.match(skill, rule, `ui-states keeps the empty-state rule ${rule}`);
  const empty = readFileSync(join(dir, 'references', 'empty-states.md'), 'utf8');
  for (const kind of ['First use', 'Cleared by the person', 'No results', 'No permission or access', 'Offline or failed to load', 'All done']) assert.ok(empty.includes(kind), `empty states cover ${kind}`);
  for (const scope of ['**App**', '**View**', '**Section or card**', '**Component**', '**List or table cell**']) assert.ok(empty.includes(scope), `empty states cover ${scope}`);
  assert.match(empty, /Silhouette versus loading skeleton/);
  assert.match(empty, /No layout shift/);
  for (const rule of [/Shimmer \(skeleton\) loading for views and sections/, /spinner at component or field scope/, /no skeleton for the first 300 ms, at least 500 ms once shown/, /Never shimmer forever/, /each section swaps in complete/, /with reduced motion, no shimmer/, /`aria-busy="true"` on the region/])
    assert.match(skill, rule, `ui-states keeps the shimmer rule ${rule}`);
  const shimmer = readFileSync(join(dir, 'references', 'shimmer.md'), 'utf8');
  for (const part of ['## When to use which indicator', '## Shape: the real wrapper, the real layout', '## Timing', '## Progressive swap', '## Animation', '## Accessibility', '## Skeleton versus empty-state silhouette', 'error model', 'WCAG 2.2.2', 'aria-hidden'])
    assert.ok(shimmer.includes(part), `shimmer covers ${part}`);
  for (const r of ['components.md', 'notification-pill.md', 'errors.md', 'empty-states.md', 'shimmer.md', 'accessibility.md', 'enforcement.md', 'sources.md']) assert.ok(existsSync(join(dir, 'references', r)), `references/${r}`);
  for (const s of ['perceived-performance', 'ui-copy']) assert.match(readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8'), /`ui-states`/, `${s} points to ui-states`);
  assert.match(readFileSync(join(ROOT, 'agents', 'design-system-auditor.agent.md'), 'utf8'), /`ui-states`/);
  const tokens = JSON.parse(readFileSync(join(ROOT, 'templates', 'tokens', 'tokens.json'), 'utf8'));
  assert.deepEqual(tokens.duration['confirm-min'].$value, { value: 200, unit: 'ms' });
  assert.deepEqual(tokens.duration.shimmer.$value, { value: 1500, unit: 'ms' });
  assert.ok(tokens.count['shimmer-passes'].$value * tokens.duration.shimmer.$value.value < 5000, 'shimmer motion stays under 5 s');
});

test('ui-states keeps the room-for-a-mark and border-as-spinner rule', () => {
  const dir = join(ROOT, 'skills', 'ui-states');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const components = readFileSync(join(dir, 'references', 'components.md'), 'utf8');
  const loading = readFileSync(join(dir, 'references', 'shimmer.md'), 'utf8');
  for (const [text, name] of [[skill, 'skill'], [components, 'components']]) {
    for (const rule of [/Room for a mark/, /inline spinner/, /tick/, /error icon with Retry/, /No room/, /element's own border becomes the spinner/, /arc sweeping around its shape and radius/, /success (colour|border)/, /danger (colour|border)/, /nearest place with room, never squeezed inside/, /dashed or held border, no sweep/, /aria-busy/, /focus stays/, /announcements?/, /200 ms/])
      assert.match(text, rule, `${name} keeps the border-as-spinner rule ${rule}`);
  }
  for (const control of ['segments of a segmented control', 'chips', 'small icon buttons', 'tiles', 'swatches', 'compact pills'])
    assert.ok(components.includes(control), `no-room guidance covers ${control}`);
  assert.match(components, /Placement rule overrides|placement rule overrides/);
  assert.match(components, /success colour for at least `duration\.confirm-min` \(200 ms\)/);
  assert.match(skill, /- \[ \] Room for a mark:.*own-border arc/);
  for (const rule of [/inline spinner/, /own border becomes the spinner/, /shape and radius/, /dashed or held border, no sweep/, /300 ms delay and 500 ms minimum/, /two 200 ms beats/])
    assert.match(loading, rule, `loading keeps placement and timing ${rule}`);
  const access = readFileSync(join(dir, 'references', 'accessibility.md'), 'utf8');
  assert.match(access, /Border-as-spinner/);
  assert.match(access, /same status announcement as the inline case/);
  assert.match(access, /state beyond colour/);
});

test('ui-states has one coherent timing model, matching its tokens and perceived-performance', () => {
  const dir = join(ROOT, 'skills', 'ui-states');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const perf = readFileSync(join(ROOT, 'skills', 'perceived-performance', 'SKILL.md'), 'utf8');
  const tokens = JSON.parse(readFileSync(join(ROOT, 'templates', 'tokens', 'tokens.json'), 'utf8'));
  const ms = (t) => (typeof t.$value === 'number' ? t.$value : t.$value.unit === 's' ? t.$value.value * 1000 : t.$value.value);
  // Pending and confirmed each hold the beat; the old shared-beat wording must not come back anywhere.
  assert.match(skill, /Pending shows at once and holds at least 200 ms/);
  assert.match(skill, /confirmed state holds at least 200 ms/);
  const texts = [...walk(join(ROOT, 'skills')), join(ROOT, 'templates', 'tokens', 'tokens.json')].filter((f) => /\.(md|json)$/.test(f));
  for (const f of texts) assert.doesNotMatch(readFileSync(f, 'utf8'), /pending and confirmed (states )?(together|last together)/i, `${relative(ROOT, f)} uses the shared-beat wording`);
  // Every token the skill and its references name exists, and any value written beside it equals the token.
  for (const f of [join(dir, 'SKILL.md'), ...walk(join(dir, 'references'))]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/`(duration|count)\.([a-z-]+)`(?: \((\d+(?:\.\d+)?) ?(ms|s)\b)?/g)) {
      const t = tokens[m[1]]?.[m[2]];
      assert.ok(t, `${relative(ROOT, f)} names ${m[1]}.${m[2]}, which isn't a token`);
      if (m[3]) assert.equal(Number(m[3]) * (m[4] === 's' ? 1000 : 1), ms(t), `${relative(ROOT, f)}: ${m[1]}.${m[2]} is written as ${m[3]} ${m[4]}`);
    }
  }
  assert.equal(ms(tokens.duration['indicator-delay']), 300);
  assert.equal(ms(tokens.duration['indicator-min']), 500);
  for (const [text, name] of [[skill, 'ui-states'], [perf, 'perceived-performance']]) {
    assert.match(text, /300 ms/, `${name} states the load delay`);
    assert.match(text, /500 ms/, `${name} states the load minimum`);
  }
  assert.doesNotMatch(perf, /Skeleton \| Opening a view that takes over 1 s/, 'perceived-performance shows skeletons on the 300 ms delay, like ui-states');
  assert.ok(ms(tokens.duration['confirm-min']) < ms(tokens.duration['indicator-delay']), 'the commit beat is shorter than the load delay');
  assert.ok(ms(tokens.duration['confirm-read']) > ms(tokens.duration['confirm-min']), 'words hold longer than the beat');
  assert.ok(ms(tokens.duration['notice-long']) > ms(tokens.duration.notice), 'longer pills stay longer');
  // One state attribute vocabulary across the kit.
  const busy = new Set(texts.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/data-busy="([^"]+)"/g)].map((m) => m[1])));
  assert.deepEqual([...busy], ['ack|on|done|failed'], 'one data-busy vocabulary');
});

test('ui-states covers focus, announcements, concurrency and every control, and stays lean', () => {
  const dir = join(ROOT, 'skills', 'ui-states');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const read = (r) => readFileSync(join(dir, 'references', r), 'utf8');
  for (const part of ['## How to apply it', '## Choosing the scope', '## Timing: one model, three tracks', '## Focus and announcements', '## Review checklist', 'Decisions and trade-offs', 'Never lock continuous text', 'never `disabled` or unmounted', 'One commit in flight per control', '`role="alert"` only for a failure'])
    assert.ok(skill.includes(part), `SKILL.md has ${part}`);
  for (const part of ['## Combobox and async search', '## Date and time pickers', '## Drag and reorder', '## Multi-select and bulk actions', '## Destructive actions', '## Document and long-text autosave', 'The same element throughout', 'Decisions and trade-offs'])
    assert.ok(read('components.md').includes(part), `components covers ${part}`);
  for (const part of ['## Concurrency and ordering', 'The newest value wins', 'last confirmed value', 'never drops it silently'])
    assert.ok(read('errors.md').includes(part), `errors covers ${part}`);
  for (const part of ['Several at once', 'starts only when it becomes visible', 'Decisions and trade-offs', 'WCAG 2.2.1'])
    assert.ok(read('notification-pill.md').includes(part), `the pill covers ${part}`);
  for (const part of ['## After each kind of change', '## Live regions', '## Locks never drop focus', '## Not colour alone', '## Motion', 'changes motion, not timing'])
    assert.ok(read('accessibility.md').includes(part), `accessibility covers ${part}`);
  assert.match(read('enforcement.md'), /out of order/);
  assert.ok(skill.length <= 18000, `SKILL.md stays lean (${skill.length} characters); move detail to references`);
  for (const r of ['accessibility.md', 'enforcement.md']) assert.ok(skill.includes(`references/${r}`), `SKILL.md links ${r}`);
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

test('spacing keeps its rules and references, its tokens hold the ratios, and its neighbours point to it', () => {
  const dir = join(ROOT, 'skills', 'spacing');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  for (const rule of [/Inner space never exceeds outer space/, /at least twice/, /never less than 1\.5 times/, /a heading belongs to what follows/i, /Insets stay constant; nesting doesn't escalate/, /The layout owns space/, /`:last-child`/, /tooltip appended to a dialog/, /4 px base unit/, /Measure space to what the eye sees/, /24 × 24 CSS px/, /Geometry is stable/, /Logical, not physical/, /Density is a context/, /320 CSS px/])
    assert.match(skill, rule, `spacing keeps ${rule}`);
  for (const part of ['## Choosing a value', '## Rules by element', '## Never', '## The audit', '## Enforcement', '## Review checklist', 'S1 Broken', 'S2 Misgrouped', 'S3 Fragile', 'S4 Polish'])
    assert.ok(skill.includes(part), `SKILL.md has ${part}`);
  assert.ok(skill.length <= 18000, `SKILL.md stays lean (${skill.length} characters)`);
  for (const r of ['tokens.md', 'elements.md', 'audit.md', 'enforcement.md', 'sources.md']) assert.ok(skill.includes(`references/${r}`), `SKILL.md links ${r}`);
  const audit = readFileSync(join(dir, 'references', 'audit.md'), 'utf8');
  for (const part of ['## 1. Inventory', '## 3. Perturb', '## 4. States', '## 6. Right to left', '## 8. Trace each finding to its source', '## 9. Choose the fix at the level of the system', '## 11. The report', 'Root causes', 'Tests to add', 'forcePseudoState'])
    assert.ok(audit.includes(part), `the audit covers ${part}`);
  for (const s of ['craft', 'design-system']) assert.match(readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8'), /`spacing`/, `${s} points to spacing`);
  assert.match(readFileSync(join(ROOT, 'agents', 'design-system-auditor.agent.md'), 'utf8'), /`spacing`/);
  // The starter roles alias scale steps, and their resolved values keep the ratios.
  const tokens = JSON.parse(readFileSync(join(ROOT, 'templates', 'tokens', 'tokens.json'), 'utf8'));
  const rem = (name) => {
    const v = tokens.space[name].$value;
    return typeof v === 'string' ? rem(/^\{space\.([\w-]+)\}$/.exec(v)[1]) : v.value;
  };
  for (const [name, t] of Object.entries(tokens.space)) if (!/^\d+$/.test(name)) assert.match(t.$value, /^\{space\.\d+\}$/, `space.${name} aliases a scale step`);
  const stack = ['stack-pair', 'stack-item', 'stack-group', 'stack-section'].map(rem);
  for (let i = 1; i < stack.length; i++) assert.ok(stack[i] >= 1.5 * stack[i - 1], 'each stack level is at least 1.5 × the one below');
  assert.ok(rem('inline-group') >= 1.5 * rem('inline-item'));
  assert.ok(rem('stack-group') <= rem('inset-md') && rem('inset-md') <= rem('inset-lg'), 'groups fit inside cards and dialogs');
  for (const [name, t] of Object.entries(tokens.space)) if (/^\d+$/.test(name)) assert.ok(Math.abs(t.$value.value / 0.25 - Number(name)) < 1e-9, `space.${name} is ${name} base units`);
});

test('the spacing linter finds space the layout does not own, and passes layout-owned styles', () => {
  const rules = (css, o) => lintSpacing(css, o).map((f) => `${f.level} ${f.rule.split(':')[0]}`);
  assert.deepEqual(rules('.dialog > :last-child { margin-bottom: var(--space-inset-lg); }'), ['error outer margin', 'error sibling-position spacing']);
  assert.deepEqual(rules('.stack > * + * { padding-block-start: var(--space-stack-item); }'), ['error sibling-position spacing']);
  assert.deepEqual(rules('@media (hover: hover) { .b:hover { border: 2px solid var(--color-accent); font-weight: 700; } }'), ['error geometry in a state', 'error geometry in a state']);
  assert.deepEqual(rules('.t[aria-selected="true"] { padding-block-end: 2px; }'), ['error geometry in a state']);
  assert.deepEqual(rules('.b { margin-left: 0; text-align: left; }'), ['error physical property', 'error physical value']);
  assert.deepEqual(rules('.b { padding: var(--space-4); }'), ['warn bare scale step']);
  assert.deepEqual(rules('.b { padding: var(--space-4); }', { strict: true }), ['error bare scale step']);
  assert.deepEqual(rules('.prose > * + * { margin-block-start: 1em; }', { allowMargin: ['.prose'] }), []);
  const good = '.card { display: flex; flex-direction: column; gap: var(--space-stack-group); padding: var(--space-inset-md); margin: 0; }\n.wrap { margin-inline: auto; }\n.list li:nth-child(odd) { background: var(--color-bg-raised); }\n.x[class~="y"] { color: var(--color-text); }\n@media (hover: hover) { .b:hover { border-color: var(--color-accent); outline: 2px solid var(--color-focus); } }';
  assert.deepEqual(lintSpacing(good), []);
});

test('the spacing probe finds misgrouping, fragile space, small targets, and space that moves or does not mirror', () => {
  const sides = (t = 0, r = t, b = t, l = r) => ({ t, r, b, l });
  let n = 0;
  const box = (parent, x, y, w, h, extra = {}) => ({ id: String(n++), parent, path: extra.path ?? `div:${n - 1}`, tag: 'div', rect: { x, y, w, h }, display: 'flex', flow: 'column', pad: sides(), mar: sides(), border: sides(), gap: { row: 0, col: 0 }, lineHeight: 20, fontSize: 16, interactive: false, enclosed: false, heading: 0, outOfFlow: false, ignored: false, inlineText: false, centred: false, ellipsis: false, clip: null, scrolls: false, children: [], ...extra });
  const page = box(null, 0, 0, 320, 600, { display: 'block', flow: 'block' });
  const card = box('0', 0, 0, 200, 100, { enclosed: true, pad: sides(12), path: 'card' });
  const a = box('1', 12, 12, 176, 20);
  const b = box('1', 12, 68, 176, 20);
  const odd = box('0', 0, 120, 100, 40, { pad: sides(10), path: 'odd' });
  const pushed = box('0', 0, 170, 100, 20, { mar: sides(0, 0, 8, 0), path: 'pushed' });
  const t1 = box('0', 0, 200, 16, 16, { interactive: true, path: 'tiny-1' });
  const t2 = box('0', 18, 200, 16, 16, { interactive: true, path: 'tiny-2' });
  const flow = box('0', 0, 300, 300, 100, { display: 'block', flow: 'block', path: 'flow' });
  const p1 = box('8', 0, 300, 300, 20);
  const h = box('8', 0, 324, 300, 20, { heading: 2, path: 'heading' });
  const p2 = box('8', 0, 360, 300, 20);
  page.children = ['1', '4', '5', '6', '7', '8'];
  card.children = ['2', '3'];
  flow.children = ['9', '10', '11'];
  const snap = { url: 'x', viewport: { w: 320, h: 600 }, rootFontSize: 16, dir: 'ltr', pageScroll: { sw: 400, cw: 320 }, elements: [page, card, a, b, odd, pushed, t1, t2, flow, p1, h, p2] };
  const found = analyze(snap).map((f) => `${f.severity} ${f.rule} ${f.path}`);
  for (const want of ['S1 page-scroll document', 'S2 inner-exceeds-inset card', 'S3 off-scale odd', 'S3 outer-margin pushed', 'S1 target-size tiny-1', 'S2 heading-space heading'])
    assert.ok(found.includes(want), `finds ${want} in ${found.join(', ')}`);
  // A child's margin that vanishes when a child is appended is named as the cause, and what it pushed is counted, not listed.
  const after = structuredClone(snap);
  after.elements[5].mar.b = 0;
  for (const i of [6, 7, 8, 9, 10, 11]) after.elements[i].rect.y -= 8;
  const moved = compare(snap, after, { cause: 'a child added' });
  assert.deepEqual(moved.map((f) => `${f.rule} ${f.path}`), ['spacing-changed pushed', 'moved document']);
  assert.match(moved[0].measured, /margin-b 8px → 0px after a child added/);
  // Physical padding doesn't mirror.
  const rtl = structuredClone(snap);
  const ltrOdd = structuredClone(snap);
  ltrOdd.elements[4].pad = sides(10, 0, 10, 16);
  rtl.elements[4].pad = sides(10, 0, 10, 16);
  assert.deepEqual(mirror(ltrOdd, rtl).map((f) => `${f.rule} ${f.path}`), ['not-mirrored odd']);
  assert.match(report(analyze(snap)), /^# Spacing audit\n\nS1 \d+ · S2 \d+ · S3 \d+ · S4 \d+\n\n\| # \| Severity \| Rule \| Where \| Measured \| Expected \| Root cause \| System fix \| Test \|/);
});