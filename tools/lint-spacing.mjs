#!/usr/bin/env node
// @ts-check
/**
 * Finds spacing that the layout doesn't own, with no dependencies (agentic-craft, skills/spacing).
 *
 *   node lint-spacing.mjs <folder or file>… [--ext .css,.astro,.vue,.svelte,.html] [--allow-margin <selector part>]… [--strict]
 *
 * Reads .css files and the <style> blocks of component files, and reports, per declaration:
 * - error  outer margin: a margin other than 0 or auto (space belongs to the parent's gap or the element's padding);
 * - error  sibling-position spacing: margin, padding or gap set in a rule keyed to :first-child, :last-child,
 *          :nth-child, :only-child, the of-type forms, or a + or ~ combinator (anything appended at run time moves it);
 * - error  geometry in a state: size, padding, margin, border width, font size or weight, letter spacing, gap or
 *          position changed in a rule for :hover, :focus, :focus-visible, :focus-within, :active, :checked, or an
 *          aria- or data- state attribute (states change colour, outline, shadow, opacity or transform only);
 * - error  physical property: margin-left/right, padding-left/right, left/right, border-left/right, scroll-margin- or
 *          scroll-padding-left/right, text-align or float left/right (use the logical property);
 * - warn   bare scale step: var(--space-<number>) read outside the token source (read a role or a component token;
 *          --strict makes it an error).
 * Custom property definitions are skipped. --allow-margin exempts rules whose selector contains the given text
 * (for example a prose container that styles markup it didn't write). Exit 1 on any error.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { styleBlocks } from './lint-styles.mjs';

const SPACE_PROP = /^(margin|padding|gap|row-gap|column-gap)(-|$)/;
const SIBLING = /:(first|last|nth|nth-last|only)-(child|of-type)\b|:nth-child\(|:nth-last-child\(|[^\s>+~,(][\s]*[+~][\s]*[^\s=]|^\s*[+~]/;
const STATE = /:(hover|focus|focus-visible|focus-within|active|checked)\b|\[(aria-(pressed|selected|expanded|current|checked|busy|invalid)|data-(state|busy|selected|active|pressed|open|invalid))[^\]]*\]/;
const GEOMETRY = /^(width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|padding(-[a-z-]+)?|margin(-[a-z-]+)?|border(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?(-width)?|border-width|font-size|font-weight|letter-spacing|word-spacing|line-height|gap|row-gap|column-gap|top|right|bottom|left|inset(-[a-z-]+)?)$/;
const BORDER_SHORTHAND = /^border(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$/;
const PHYSICAL = new Map([
  ['margin-left', 'margin-inline-start'], ['margin-right', 'margin-inline-end'],
  ['padding-left', 'padding-inline-start'], ['padding-right', 'padding-inline-end'],
  ['left', 'inset-inline-start'], ['right', 'inset-inline-end'],
  ['border-left', 'border-inline-start'], ['border-right', 'border-inline-end'],
  ['border-left-width', 'border-inline-start-width'], ['border-right-width', 'border-inline-end-width'],
  ['scroll-margin-left', 'scroll-margin-inline-start'], ['scroll-margin-right', 'scroll-margin-inline-end'],
  ['scroll-padding-left', 'scroll-padding-inline-start'], ['scroll-padding-right', 'scroll-padding-inline-end'],
]);

/** Each declaration in a block of CSS, with the selectors and at-rules it sits inside. */
export function declarations(/** @type {string} */ css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  /** @type {{ line: number, prop: string, value: string, context: string[] }[]} */
  const out = [];
  /** @type {string[]} */
  const stack = [];
  let buf = '';
  let line = 1;
  let start = 1;
  let depth = 0;
  for (const ch of clean) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === '{' && depth === 0) {
      stack.push(buf.trim());
      buf = '';
    } else if ((ch === ';' && depth === 0) || ch === '}') {
      const text = buf.trim();
      const m = /^(-?[a-z][a-z-]*)\s*:\s*([\s\S]+)$/i.exec(text);
      if (m && stack.length) out.push({ line: start, prop: m[1].toLowerCase(), value: m[2].trim(), context: [...stack] });
      buf = '';
      if (ch === '}') stack.pop();
    } else {
      if (!buf.trim() && ch.trim()) start = line;
      buf += ch;
    }
    if (ch === '\n') line++;
  }
  return out;
}

/** Findings in one block of CSS. */
export function lintSpacing(/** @type {string} */ css, options = {}) {
  const allowMargin = options.allowMargin ?? [];
  const strict = Boolean(options.strict);
  /** @type {{ line: number, level: 'error' | 'warn', rule: string, text: string }[]} */
  const out = [];
  for (const d of declarations(css)) {
    if (d.prop.startsWith('--')) continue;
    const selector = d.context.filter((c) => !c.startsWith('@')).join(' ');
    const text = `${d.prop}: ${d.value}`;
    const exempt = allowMargin.some((a) => selector.includes(a));
    const zero = /^(0(px|rem|em)?|auto)(\s+(0(px|rem|em)?|auto))*(\s*!important)?$/.test(d.value);
    if (/^margin(-|$)/.test(d.prop) && !zero && !exempt)
      out.push({ line: d.line, level: 'error', rule: "outer margin: the parent's gap or the element's padding owns this space", text });
    if (SPACE_PROP.test(d.prop) && !zero && SIBLING.test(selector) && !exempt)
      out.push({ line: d.line, level: 'error', rule: 'sibling-position spacing: a child added at run time moves it; use the parent\'s gap', text: `${selector} { ${text} }` });
    if (STATE.test(selector) && GEOMETRY.test(d.prop) && !BORDER_SHORTHAND.test(d.prop))
      out.push({ line: d.line, level: 'error', rule: 'geometry in a state: states change colour, outline, shadow, opacity or transform only', text: `${selector} { ${text} }` });
    if (STATE.test(selector) && BORDER_SHORTHAND.test(d.prop) && /\d/.test(d.value))
      out.push({ line: d.line, level: 'error', rule: 'geometry in a state: a border width set on a state; reserve it at rest and change border-color', text: `${selector} { ${text} }` });
    if (PHYSICAL.has(d.prop))
      out.push({ line: d.line, level: 'error', rule: `physical property: use ${PHYSICAL.get(d.prop)}`, text });
    if ((d.prop === 'text-align' || d.prop === 'float' || d.prop === 'clear') && /\b(left|right)\b/.test(d.value))
      out.push({ line: d.line, level: 'error', rule: `physical value: use ${d.prop === 'text-align' ? 'start or end' : 'inline-start or inline-end'}`, text });
    if (/var\(--space-\d+\)/.test(d.value))
      out.push({ line: d.line, level: strict ? 'error' : 'warn', rule: 'bare scale step: read a spacing role or a component token', text });
  }
  return out;
}

function walk(/** @type {string} */ p, /** @type {string[]} */ exts) {
  const st = statSync(p);
  if (st.isFile()) return exts.includes(extname(p)) ? [p] : [];
  return readdirSync(p).flatMap((n) => (n === 'node_modules' || n.startsWith('.') ? [] : walk(join(p, n), exts)));
}

function main(argv) {
  /** @type {string[]} */
  const allowMargin = [];
  let exts = ['.css', '.astro', '.vue', '.svelte', '.html'];
  let strict = false;
  const paths = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--allow-margin') allowMargin.push(argv[++i]);
    else if (argv[i] === '--ext') exts = argv[++i].split(',');
    else if (argv[i] === '--strict') strict = true;
    else paths.push(argv[i]);
  }
  if (!paths.length) {
    console.error('Usage: node lint-spacing.mjs <folder or file>… [--ext .css,.astro] [--allow-margin <selector part>]… [--strict]');
    return 2;
  }
  let errors = 0;
  let warnings = 0;
  for (const file of paths.flatMap((p) => walk(p, exts))) {
    const text = readFileSync(file, 'utf8');
    for (const block of styleBlocks(file, text))
      for (const f of lintSpacing(block.text, { allowMargin, strict })) {
        if (f.level === 'error') errors++;
        else warnings++;
        console.error(`${relative(process.cwd(), file)}:${block.line + f.line - 1} ${f.level} ${f.rule}: ${f.text}`);
      }
  }
  console.log(errors || warnings ? `${errors} error(s), ${warnings} warning(s): let the layout own the space` : 'spacing: owned by the layout');
  return errors ? 1 : 0;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('lint-spacing.mjs')) process.exitCode = main(process.argv.slice(2));
