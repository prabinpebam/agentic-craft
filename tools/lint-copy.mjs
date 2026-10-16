#!/usr/bin/env node
// @ts-check
/**
 * Lints interface copy against the ui-copy skill's mechanical rules, with no dependencies (agentic-craft).
 *
 *   node lint-copy.mjs <strings.json | folder>… [--glossary glossary.md]
 *
 * Input: a JSON file of { "<kind>:<id>": "<text>" } (kinds: button, label, heading, error, status, hint, any),
 * or a folder of component files, from which it reads visible text of <button>, <h1>–<h6>, <label>, aria-label
 * and title attributes. Reports banned words, title case, long or verbless buttons, straight quotes, emoji or
 * symbols used as icons, bare "Loading…", and glossary terms to use instead (from a glossary's "Use instead of"
 * column). Exit 1 on any finding.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const BANNED = [/\bOK\b/, /\bsubmit\b/i, /\bclick here\b/i, /\bplease\b/i, /\bsimply\b/i, /\boops\b/i, /\binvalid\b/i];
const VERBS = /^(add|allow|apply|archive|back|browse|build|cancel|change|check|choose|clear|close|connect|continue|copy|create|crop|decline|delete|disconnect|download|duplicate|edit|email|explore|export|find|finish|get|go|hide|import|install|invite|keep|learn|leave|let|make|manage|move|next|open|paste|pause|pick|play|preview|print|publish|read|redo|refresh|reload|remove|rename|reopen|replace|reply|request|reset|restore|retry|review|run|save|search|see|select|send|set|share|show|sign|skip|sort|start|stop|submit|switch|take|try|turn|undo|unpublish|update|upload|use|view|withdraw|write|accept)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/u;

/** Words that start a proper noun or acronym are allowed capitals; the rest of a title should be lower case. */
function titleCase(/** @type {string} */ text, /** @type {Set<string>} */ proper) {
  const words = text.replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
  const caps = words.slice(1).filter((w) => /^\p{Lu}\p{Ll}/u.test(w) && !proper.has(w));
  return caps.length >= 1 && words.length > 1;
}

/** Findings for one string. */
export function lintString(/** @type {string} */ kind, /** @type {string} */ text, o = { proper: new Set(), insteadOf: /** @type {[string, string][]} */ ([]) }) {
  const out = [];
  for (const b of BANNED) if (b.test(text)) out.push(`banned word (${b.source.replace(/\\b/g, '')})`);
  if (['button', 'heading', 'label'].includes(kind) && titleCase(text, o.proper)) out.push('title case: use sentence case');
  if (kind === 'button') {
    const words = text.trim().split(/\s+/);
    if (words.length > 3) out.push(`button of ${words.length} words: 3 or fewer`);
    if (!VERBS.test(text.trim())) out.push('button should start with a verb');
  }
  if (/(^|[\s(])['"]|['"]($|[\s).,!?])/.test(text) && !/[‘’“”]/.test(text)) out.push('straight quotes: use curly quotes');
  if (EMOJI.test(text)) out.push('emoji or symbol: use an icon with a text twin');
  if (/^loading\W*$/i.test(text.trim())) out.push('bare "Loading…": name the work');
  for (const [use, instead] of o.insteadOf) if (new RegExp(`\\b${instead}\\b`, 'i').test(text)) out.push(`glossary: say "${use}", not "${instead}"`);
  return out;
}

/** Visible strings in a component file. */
export function stringsInSource(/** @type {string} */ src) {
  const out = [];
  const strip = (/** @type {string} */ s) => s.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
  for (const m of src.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) out.push(['button', strip(m[1])]);
  for (const m of src.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g)) out.push(['heading', strip(m[1])]);
  for (const m of src.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) out.push(['label', strip(m[1])]);
  for (const m of src.matchAll(/\b(?:aria-label|title)="([^"{]+)"/g)) out.push(['any', m[1]]);
  return out.filter(([, t]) => t && /\p{L}/u.test(t));
}

/** The glossary's "use instead of" pairs, from its markdown table. */
export function glossary(/** @type {string} */ md) {
  /** @type {[string, string][]} */
  const pairs = [];
  for (const row of md.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1)) {
    const [term, , instead] = row.split('|').slice(1, 4).map((c) => c?.trim() ?? '');
    for (const w of instead.split(',')) {
      const word = w.replace(/\(.*\)/, '').trim();
      if (word && term && !/^</.test(term)) pairs.push([term.replace(/[<>]/g, ''), word]);
    }
  }
  return pairs;
}

function walk(/** @type {string} */ p) {
  const st = statSync(p);
  if (st.isFile()) return [p];
  return readdirSync(p).flatMap((n) => (n === 'node_modules' || n.startsWith('.') ? [] : walk(join(p, n))));
}

function main(argv) {
  const gi = argv.indexOf('--glossary');
  const insteadOf = gi >= 0 && existsSync(argv[gi + 1]) ? glossary(readFileSync(argv[gi + 1], 'utf8')) : [];
  const inputs = argv.filter((a, i) => a !== '--glossary' && argv[i - 1] !== '--glossary');
  if (!inputs.length) {
    console.error('Usage: node lint-copy.mjs <strings.json | folder>… [--glossary glossary.md]');
    return 2;
  }
  const o = { proper: new Set(), insteadOf };
  let count = 0;
  const report = (/** @type {string} */ where, /** @type {string} */ kind, /** @type {string} */ text) => {
    for (const f of lintString(kind, text, o)) {
      count++;
      console.error(`${where}: ${f}: "${text}"`);
    }
  };
  for (const input of inputs) {
    if (extname(input) === '.json') for (const [key, text] of Object.entries(JSON.parse(readFileSync(input, 'utf8')))) report(`${input} ${key}`, key.split(':')[0], String(text));
    else for (const file of walk(input).filter((f) => ['.astro', '.vue', '.svelte', '.tsx', '.jsx', '.html'].includes(extname(f)))) for (const [kind, text] of stringsInSource(readFileSync(file, 'utf8'))) report(file, kind, text);
  }
  console.log(count ? `${count} copy finding(s)` : 'copy: every rule holds');
  return count ? 1 : 0;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('lint-copy.mjs')) process.exitCode = main(process.argv.slice(2));
