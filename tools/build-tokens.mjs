#!/usr/bin/env node
// @ts-check
/**
 * Builds design tokens (W3C DTCG 2025.10) into CSS custom properties, a markdown reference and resolved values,
 * with no dependencies. Part of the agentic-craft harness (skills/design-system).
 *
 *   node build-tokens.mjs --src design/ --css styles/tokens.css [--md docs/tokens.md] [--json design/tokens.resolved.json] [--check]
 *
 * The source folder holds resolver.json:
 *   { "sets": ["tokens.json"],
 *     "modifiers": {
 *       "theme":    { "contexts": { "light": ["tokens.light.json"], "dark": ["tokens.dark.json"] }, "default": "light" },
 *       "contrast": { "contexts": { "normal": [], "more": ["tokens.contrast-more.json"] }, "default": "normal", "media": "(prefers-contrast: more)" } } }
 *
 * - A token's CSS name is its path joined with dashes: color.text → --color-text, c.button.height → --c-button-height.
 * - An alias ("{space.4}") becomes var(--space-4), so contexts and modifiers cascade.
 * - A token that differs between the theme's light and dark contexts becomes light-dark(<light>, <dark>).
 * - A modifier other than the theme is written inside its media query.
 * - --check writes nothing and exits 1 when any output is stale.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** @typedef {{ path: string, type: string, value: any, description: string, owner?: string }} Token */

/** Every token under a group, flattened, with the nearest owner ($extensions.owner) inherited. */
export function flatten(group, prefix = [], inherited = { type: undefined, owner: undefined }) {
  /** @type {Map<string, Token>} */
  const out = new Map();
  const type = group.$type ?? inherited.type;
  const owner = group.$extensions?.owner ?? inherited.owner;
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith('$') || v === null || typeof v !== 'object') continue;
    const path = [...prefix, k];
    if ('$value' in v) out.set(path.join('.'), { path: path.join('.'), type: v.$type ?? type, value: v.$value, description: v.$description ?? '', owner: v.$extensions?.owner ?? owner });
    else for (const [p, t] of flatten(v, path, { type, owner })) out.set(p, t);
  }
  return out;
}

/** Deep-merges token groups (later files override earlier ones). */
function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v) && out[k] && typeof out[k] === 'object' ? merge(out[k], v) : v;
  return out;
}

const ALIAS = /^\{([^}]+)\}$/;
export const cssName = (/** @type {string} */ path) => `--${path.replace(/\./g, '-')}`;

/** A token's value as CSS: an alias as var(), anything else by its type. */
export function cssValue(/** @type {Token} */ t) {
  const v = t.value;
  if (typeof v === 'string' && ALIAS.test(v)) return `var(${cssName(ALIAS.exec(v)[1])})`;
  switch (t.type) {
    case 'color':
      return typeof v === 'string' ? v : (v.hex ?? `color(${v.colorSpace} ${v.components.join(' ')}${v.alpha !== undefined ? ` / ${v.alpha}` : ''})`);
    case 'dimension':
    case 'duration':
      return typeof v === 'object' ? `${v.value}${v.unit}` : String(v);
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v]).map((f) => (/^[\w-]+$/.test(f) && !/\s/.test(f) ? f : `'${f}'`)).join(', ');
    case 'cubicBezier':
      return `cubic-bezier(${v.join(', ')})`;
    case 'shadow':
      return (Array.isArray(v) ? v : [v]).map((s) => `${s.inset ? 'inset ' : ''}${cssValue({ ...t, type: 'dimension', value: s.offsetX })} ${cssValue({ ...t, type: 'dimension', value: s.offsetY })} ${cssValue({ ...t, type: 'dimension', value: s.blur })} ${cssValue({ ...t, type: 'dimension', value: s.spread })} ${cssValue({ ...t, type: 'color', value: s.color })}`).join(', ');
    default:
      return String(v);
  }
}

/** A token's literal value in a context, aliases followed (for references and contrast checks). */
export function resolveValue(/** @type {Map<string, Token>} */ tokens, /** @type {string} */ path, seen = new Set()) {
  const t = tokens.get(path);
  if (!t) throw new Error(`No token ${path}`);
  if (seen.has(path)) throw new Error(`Alias loop at ${path}`);
  seen.add(path);
  if (typeof t.value === 'string' && ALIAS.test(t.value)) return resolveValue(tokens, ALIAS.exec(t.value)[1], seen);
  return cssValue(t);
}

/** Loads the resolver: the base tokens, and each modifier's contexts as their own token maps. */
export function load(/** @type {string} */ src) {
  const r = JSON.parse(readFileSync(join(src, 'resolver.json'), 'utf8'));
  const read = (/** @type {string[]} */ files) => files.reduce((acc, f) => merge(acc, JSON.parse(readFileSync(join(src, f), 'utf8'))), {});
  const baseTree = read(r.sets ?? []);
  const base = flatten(baseTree);
  /** @type {Record<string, { media?: string, default: string, contexts: Record<string, Map<string, Token>> }>} */
  const modifiers = {};
  for (const [name, m] of Object.entries(r.modifiers ?? {})) {
    modifiers[name] = { media: m.media, default: m.default, contexts: {} };
    for (const [ctx, files] of Object.entries(m.contexts)) modifiers[name].contexts[ctx] = flatten(read(/** @type {string[]} */ (files)));
  }
  return { base, modifiers };
}

/** The whole token set as one context sees it: base, then each modifier's chosen context. */
export function contextTokens(model, /** @type {Record<string, string>} */ choice) {
  const all = new Map(model.base);
  for (const [name, m] of Object.entries(model.modifiers)) for (const [p, t] of m.contexts[choice[name] ?? m.default] ?? []) all.set(p, t);
  return all;
}

/** The generated outputs. */
export function build(/** @type {string} */ src) {
  const model = load(src);
  const theme = model.modifiers.theme;
  const lines = ['/* Generated by build-tokens.mjs from the design tokens. Never edit by hand. */', ':root {', '  color-scheme: light dark;'];
  for (const t of model.base.values()) lines.push(`  ${cssName(t.path)}: ${cssValue(t)};`);
  if (theme) {
    const light = theme.contexts.light ?? new Map();
    const dark = theme.contexts.dark ?? new Map();
    for (const path of new Set([...light.keys(), ...dark.keys()])) {
      const l = light.get(path);
      const d = dark.get(path);
      const lv = l ? cssValue(l) : d ? cssValue(d) : '';
      const dv = d ? cssValue(d) : lv;
      lines.push(`  ${cssName(path)}: ${lv === dv ? lv : `light-dark(${lv}, ${dv})`};`);
    }
  }
  lines.push('}', '', "[data-scheme='light'] { color-scheme: light; }", "[data-scheme='dark'] { color-scheme: dark; }");
  for (const [name, m] of Object.entries(model.modifiers)) {
    if (name === 'theme') continue;
    for (const [ctx, tokens] of Object.entries(m.contexts)) {
      if (ctx === m.default || !tokens.size) continue;
      const body = [...tokens.values()].map((t) => `    ${cssName(t.path)}: ${cssValue(t)};`);
      if (m.media) lines.push('', `@media ${m.media} {`, '  :root {', ...body, '  }', '}');
      lines.push('', `[data-${name}='${ctx}'] {`, ...body.map((b) => b.slice(2)), '}');
    }
  }
  const css = lines.join('\n') + '\n';

  // resolved literal values per theme context (for references and contrast checks)
  const contexts = theme ? Object.keys(theme.contexts) : ['default'];
  /** @type {Record<string, Record<string, string>>} */
  const resolved = {};
  for (const ctx of contexts) {
    const all = contextTokens(model, theme ? { theme: ctx } : {});
    resolved[ctx] = Object.fromEntries([...all.keys()].map((p) => [p, resolveValue(all, p)]));
  }
  const json = JSON.stringify(resolved, null, 2) + '\n';

  const md = ['# Tokens', '', 'Generated by build-tokens.mjs. Never edit by hand.', '', `| Token | ${contexts.join(' | ')} | Owner | What it's for |`, `|---|${contexts.map(() => '---').join('|')}|---|---|`];
  const every = new Set(contexts.flatMap((c) => Object.keys(resolved[c])));
  for (const p of every) {
    const t = contextTokens(model, theme ? { theme: contexts[0] } : {}).get(p) ?? model.base.get(p);
    md.push(`| \`${cssName(p)}\` | ${contexts.map((c) => `\`${resolved[c][p] ?? ''}\``).join(' | ')} | ${t?.owner ?? ''} | ${(t?.description ?? '').replace(/\|/g, '\\|')} |`);
  }
  return { css, json, md: md.join('\n') + '\n', model, resolved };
}

function main(argv) {
  const arg = (/** @type {string} */ k) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const src = arg('--src');
  const out = { css: arg('--css'), md: arg('--md'), json: arg('--json') };
  if (!src || !out.css) {
    console.error('Usage: node build-tokens.mjs --src <folder with resolver.json> --css <out.css> [--md <out.md>] [--json <out.json>] [--check]');
    return 2;
  }
  const built = build(resolve(src));
  const check = argv.includes('--check');
  let stale = 0;
  for (const [k, file] of Object.entries(out)) {
    if (!file) continue;
    const text = /** @type {any} */ (built)[k];
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== text) {
        console.error(`stale: ${file}`);
        stale++;
      }
    } else {
      mkdirSync(dirname(resolve(file)), { recursive: true });
      writeFileSync(file, text);
      console.log(`wrote ${file}`);
    }
  }
  if (check && !stale) console.log('tokens up to date');
  return stale ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) process.exitCode = main(process.argv.slice(2));
