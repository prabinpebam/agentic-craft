#!/usr/bin/env node
// @ts-check
/**
 * Finds raw values and private tokens in component styles, with no dependencies (agentic-craft, skills/design-system).
 *
 *   node lint-styles.mjs <folder or file>… [--allow <value>]… [--ext .css,.astro,.vue,.svelte]
 *
 * Reads .css files and the <style> blocks of component files, and reports, per declaration:
 * - a colour literal (#hex, rgb(), hsl(), oklch(), a named colour);
 * - a length, time or angle literal (px, rem, em, ms, s, vh, vw, deg…) other than the allowed ones (percentages,
 *   turns and the whole viewport are relative geometry, allowed);
 * - a primitive token read (var(--p-…)), which only the token build may do;
 * - a :hover rule outside @media (hover: hover).
 * Custom property definitions (--x: …) are skipped: they're how components set data. Exit 1 on any finding.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const DEFAULT_ALLOW = ['0', '1em', '100%', '50%', 'auto', 'none', 'inherit', 'initial', 'unset', 'currentColor', 'transparent', '90deg', '180deg', '270deg', '-90deg'];
const NAMED = /\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|navy|teal|maroon|olive|lime|aqua|fuchsia)\b/i;
const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
/** Relative geometry, not a design decision: percentages, turns, and the whole viewport. */
const RELATIVE = /^-?(?:\d*\.?\d+%|\d*\.?\d+turn|100(?:vh|vw|dvh|svh|lvh))$/;
const UNIT = /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|ms|s|vh|vw|vmin|vmax|dvh|svh|lvh|ch|ex|deg|turn|%)(?![\w-])/gi;

/** The style text of a file: the whole of a .css file, or its <style> blocks with their line offsets. */
export function styleBlocks(/** @type {string} */ file, /** @type {string} */ text) {
  if (extname(file) === '.css') return [{ text, line: 1 }];
  const out = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) out.push({ text: m[1], line: text.slice(0, m.index).split('\n').length });
  return out;
}

/** Findings in one block of CSS. */
export function lint(/** @type {string} */ css, /** @type {string[]} */ allow = DEFAULT_ALLOW) {
  /** @type {{ line: number, rule: string, text: string }[]} */
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const lines = clean.split('\n');
  // track whether we're inside @media (hover: hover)
  const stack = [];
  let pending = '';
  lines.forEach((raw, i) => {
    const line = raw.trim();
    // the blocks this line starts inside
    const enclosing = [...stack];
    for (const ch of raw) {
      if (ch === '{') {
        stack.push(pending.trim());
        pending = '';
      } else if (ch === '}') stack.pop();
      else pending += ch;
    }
    if (/:hover\b/.test(line) && line.includes('{') && !enclosing.some((s) => /@media[^{]*\(hover:\s*hover\)/.test(s))) out.push({ line: i + 1, rule: 'hover outside @media (hover: hover)', text: line });
    const decl = /^([a-z-]+)\s*:\s*(.+?);?$/i.exec(line);
    if (!decl || line.startsWith('--') || line.includes('{')) return;
    const value = decl[2].replace(/var\([^()]*(?:\([^()]*\))?[^()]*\)/g, (v) => (/var\(--p-/.test(v) ? v : ' '));
    if (/var\(--p-/.test(decl[2])) out.push({ line: i + 1, rule: 'reads a primitive token', text: line });
    if (COLOUR.test(value) || NAMED.test(value.replace(/['"][^'"]*['"]/g, ''))) out.push({ line: i + 1, rule: 'raw colour', text: line });
    for (const m of value.matchAll(UNIT)) if (!allow.includes(m[0]) && !RELATIVE.test(m[0])) out.push({ line: i + 1, rule: `raw value ${m[0]}`, text: line });
  });
  return out;
}

function walk(/** @type {string} */ p, /** @type {string[]} */ exts) {
  const st = statSync(p);
  if (st.isFile()) return exts.includes(extname(p)) ? [p] : [];
  return readdirSync(p).flatMap((n) => (n === 'node_modules' || n.startsWith('.') ? [] : walk(join(p, n), exts)));
}

function main(argv) {
  const allow = [...DEFAULT_ALLOW];
  let exts = ['.css', '.astro', '.vue', '.svelte', '.html'];
  const paths = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--allow') allow.push(argv[++i]);
    else if (argv[i] === '--ext') exts = argv[++i].split(',');
    else paths.push(argv[i]);
  }
  if (!paths.length) {
    console.error('Usage: node lint-styles.mjs <folder or file>… [--allow <value>]… [--ext .css,.astro]');
    return 2;
  }
  let count = 0;
  for (const file of paths.flatMap((p) => walk(p, exts))) {
    const text = readFileSync(file, 'utf8');
    for (const block of styleBlocks(file, text))
      for (const f of lint(block.text, allow)) {
        count++;
        console.error(`${relative(process.cwd(), file)}:${block.line + f.line - 1} ${f.rule}: ${f.text}`);
      }
  }
  console.log(count ? `${count} finding(s): use tokens` : 'styles: tokens only');
  return count ? 1 : 0;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('lint-styles.mjs')) process.exitCode = main(process.argv.slice(2));
