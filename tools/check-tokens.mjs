#!/usr/bin/env node
// @ts-check
/**
 * Checks design tokens against the design-system skill's rules, with no dependencies (agentic-craft).
 *
 *   node check-tokens.mjs --src design/ [--checks design/checks.json]
 *
 * Fails (exit 1) when:
 * - a token has no $description, or an alias points nowhere, or aliases loop;
 * - a component token (c.*) has no owner, or aliases a primitive (p.*) directly;
 * - a contrast pair in checks.json falls below its minimum in any theme context.
 *
 * checks.json: { "contrast": [ { "fg": "color.text", "bg": "color.bg", "min": 4.5 }, … ] }
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { contextTokens, load, resolveValue } from './build-tokens.mjs';

/** Relative luminance of an sRGB hex colour (WCAG 2). */
export function luminance(/** @type {string} */ hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two hex colours. */
export function contrast(/** @type {string} */ a, /** @type {string} */ b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const ALIAS = /^\{([^}]+)\}$/;

/** Every problem with a token source, as lines. */
export function problems(/** @type {string} */ src, /** @type {string | undefined} */ checksFile) {
  const model = load(src);
  /** @type {string[]} */
  const out = [];
  const contexts = model.modifiers.theme ? Object.keys(model.modifiers.theme.contexts) : ['default'];
  const views = contexts.map((c) => /** @type {const} */ ([c, contextTokens(model, model.modifiers.theme ? { theme: c } : {})]));
  const everyToken = new Map(views.flatMap(([, t]) => [...t]));
  for (const t of everyToken.values()) {
    if (!t.description) out.push(`${t.path}: no $description (say what it's for)`);
    if (t.path.startsWith('c.')) {
      if (!t.owner) out.push(`${t.path}: a component token group needs $extensions.owner (a component, or "shared")`);
      if (typeof t.value === 'string' && ALIAS.test(t.value) && ALIAS.exec(t.value)[1].startsWith('p.')) out.push(`${t.path}: a component token aliases a semantic token, never a primitive`);
    }
  }
  for (const [ctx, tokens] of views)
    for (const p of tokens.keys())
      try {
        resolveValue(tokens, p);
      } catch (e) {
        out.push(`${p} (${ctx}): ${/** @type {Error} */ (e).message}`);
      }
  const file = checksFile ?? join(src, 'checks.json');
  if (existsSync(file)) {
    const { contrast: pairs = [] } = JSON.parse(readFileSync(file, 'utf8'));
    for (const [ctx, tokens] of views)
      for (const { fg, bg, min } of pairs) {
        let ratio;
        try {
          ratio = contrast(resolveValue(tokens, fg), resolveValue(tokens, bg));
        } catch (e) {
          out.push(`contrast ${fg} on ${bg} (${ctx}): ${/** @type {Error} */ (e).message}`);
          continue;
        }
        if (ratio < min) out.push(`contrast ${fg} on ${bg} (${ctx}): ${ratio.toFixed(2)}:1, needs ${min}:1`);
      }
  }
  return out;
}

function main(argv) {
  const arg = (/** @type {string} */ k) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const src = arg('--src');
  if (!src) {
    console.error('Usage: node check-tokens.mjs --src <folder with resolver.json> [--checks <checks.json>]');
    return 2;
  }
  const found = problems(resolve(src), arg('--checks'));
  for (const p of found) console.error(`✗ ${p}`);
  if (!found.length) console.log('tokens: every rule holds');
  return found.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) process.exitCode = main(process.argv.slice(2));
