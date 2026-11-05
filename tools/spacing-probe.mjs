#!/usr/bin/env node
// @ts-check
/**
 * Measures spacing in a running page and reports what breaks the spacing skill's rules, with no dependencies
 * (agentic-craft, skills/spacing).
 *
 * Two halves:
 * - In the page (pass to a browser driver's evaluate; each function is self-contained):
 *     collect(options)  a snapshot of every visible element: box, padding, margin, gap, borders, line height,
 *                       overflow, whether it's interactive, enclosed, a heading or out of flow, and an interactive
 *                       element's hit area when a ::before or ::after extends it. Skips what's visually hidden (a
 *                       clipped wrapper 1 px or less, and everything in it); options.ignore exempts from every rule;
 *                       options.bleed marks the children that must reach their surface's edge (dividers, edge-to-edge
 *                       rows, media). Stamps each element with data-spacing-id so later snapshots can be compared.
 *     perturb()         prepends a hidden child and appends an absolutely positioned one to every container (the
 *                       run-time tooltip, portal or live region a component didn't plan for); unperturb() removes them.
 * - In Node:
 *     analyze(snapshot, options)  findings for one snapshot;
 *     compare(before, after)      findings for anything that moved or changed size between two snapshots;
 *     mirror(ltr, rtl)            findings for insets that don't swap sides in right to left;
 *     report(findings, title)     a markdown report (the audit's template).
 *
 *   node spacing-probe.mjs <snapshot.json> [--compare <after.json> | --mirror <rtl.json>] [--base 4] [--allow 1,2] [--target 44] [--ring 4] [--title "…"]
 *
 * Exit 1 when any S1 or S2 finding is reported.
 */
import { readFileSync } from 'node:fs';

/**
 * @typedef {{ t: number, r: number, b: number, l: number }} Sides
 * @typedef {{ id: string, parent: string | null, path: string, tag: string, rect: { x: number, y: number, w: number, h: number },
 *   hit?: { x: number, y: number, w: number, h: number },
 *   display: string, flow: 'row' | 'column' | 'block' | 'grid' | 'inline', pad: Sides, mar: Sides, border: Sides,
 *   gap: { row: number, col: number }, lineHeight: number, fontSize: number, interactive: boolean, enclosed: boolean,
 *   look?: string, selected?: boolean,
 *   heading: number, outOfFlow: boolean, ignored: boolean, inlineText: boolean, centred: boolean, ellipsis: boolean, spread?: boolean,
 *   clip: null | { sw: number, sh: number, cw: number, ch: number, cx?: number, cy?: number, st?: number, sl?: number, m?: number },
 *   scrolls: boolean, scrollsY?: boolean, bleed?: boolean, children: string[] }} Box
 * @typedef {{ url: string, viewport: { w: number, h: number }, rootFontSize: number, dir: string, pageScroll: { sw: number, cw: number }, elements: Box[] }} Snapshot
 * @typedef {{ severity: 'S1' | 'S2' | 'S3' | 'S4', rule: string, path: string, measured: string, expected: string, fix: string }} Finding
 */

/** In the page: a snapshot of every visible element under options.root (default body). Self-contained. */
export function collect(options = {}) {
  const rootSel = options.root || 'body';
  const ignore = options.ignore || '';
  const bleed = options.bleed || '';
  const root = document.querySelector(rootSel);
  if (!root) throw new Error(`spacing probe: no element matches ${rootSel}`);
  const px = (v) => parseFloat(v) || 0;
  const INTERACTIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[contenteditable=""],[contenteditable="true"],[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=slider],[role=spinbutton],[role=combobox],[role=treeitem],[role=gridcell]';
  let next = 0;
  for (const el of document.querySelectorAll('[data-spacing-id]')) next = Math.max(next, Number(el.getAttribute('data-spacing-id')) + 1);
  const label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    for (const a of ['data-component', 'data-testid', 'role']) if (el.getAttribute(a)) s += `[${a}="${el.getAttribute(a)}"]`;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += `.${cls.join('.')}`;
    return s;
  };
  const path = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.documentElement && parts.length < 4; e = e.parentElement) parts.unshift(label(e));
    return parts.join(' > ');
  };
  const transparent = (c) => !c || c === 'transparent' || /rgba?\([^)]*,\s*0(\.0+)?\)$/.test(c) || /\/\s*0\)$/.test(c);
  /** The pointer target: the box grown by any absolutely positioned ::before or ::after that takes the pointer (an invisible hit extension). */
  const hitArea = (el, cs, r) => {
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    const cb = cs.position !== 'static' ? el : el.offsetParent;
    if (!cb) return null;
    const cr = cb.getBoundingClientRect();
    const ccs = cb === el ? cs : getComputedStyle(cb);
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (!ps || ps.content === 'none' || ps.content === 'normal' || ps.display === 'none' || ps.position !== 'absolute' || ps.pointerEvents === 'none' || ps.visibility === 'hidden') continue;
      const w = px(ps.width) + px(ps.paddingLeft) + px(ps.paddingRight) + px(ps.borderLeftWidth) + px(ps.borderRightWidth);
      const h = px(ps.height) + px(ps.paddingTop) + px(ps.paddingBottom) + px(ps.borderTopWidth) + px(ps.borderBottomWidth);
      if (w <= 0 || h <= 0) continue;
      const left = cr.left + px(ccs.borderLeftWidth) + px(ps.left);
      const top = cr.top + px(ccs.borderTopWidth) + px(ps.top);
      x1 = Math.min(x1, left); y1 = Math.min(y1, top); x2 = Math.max(x2, left + w); y2 = Math.max(y2, top + h);
    }
    if (x1 === r.left && y1 === r.top && x2 === r.right && y2 === r.bottom) return null;
    return { x: x1 + scrollX, y: y1 + scrollY, w: x2 - x1, h: y2 - y1 };
  };
  /** @type {any[]} */
  const out = [];
  const visit = (el, parentId) => {
    if (el.hasAttribute('data-spacing-probe')) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.display === 'contents') {
      if (cs.display === 'contents') for (const c of el.children) visit(c, parentId);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && cs.position !== 'static') return;
    // Visually hidden (a screen-reader-only wrapper): 1 px or less and clipped, so nothing inside it is seen or pressed.
    const clipped = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || (cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none');
    if (clipped && (r.width <= 1 || r.height <= 1)) return;
    if (!el.hasAttribute('data-spacing-id')) el.setAttribute('data-spacing-id', String(next++));
    const id = el.getAttribute('data-spacing-id');
    const display = cs.display;
    const flex = display.includes('flex');
    const flow = flex ? (cs.flexDirection.startsWith('column') ? 'column' : 'row') : display.includes('grid') ? 'grid' : display.startsWith('inline') ? 'inline' : 'block';
    const border = { t: px(cs.borderTopWidth), r: px(cs.borderRightWidth), b: px(cs.borderBottomWidth), l: px(cs.borderLeftWidth) };
    const hasBorder = (['Top', 'Right', 'Bottom', 'Left']).some((s) => px(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !transparent(cs[`border${s}Color`]));
    const heading = /^H[1-6]$/.test(el.tagName) ? Number(el.tagName[1]) : el.getAttribute('role') === 'heading' ? Number(el.getAttribute('aria-level') || 2) : 0;
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const parentEl = el.parentElement;
    const parentText = parentEl ? [...parentEl.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) : false;
    const overflowing = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    const scrolls = /(auto|scroll)/.test(cs.overflowX + cs.overflowY);
    const ml = px(cs.marginLeft);
    const mr = px(cs.marginRight);
    const interactive = el.matches(INTERACTIVE);
    const hit = interactive ? hitArea(el, cs, r) : null;
    const box = {
      id,
      parent: parentId,
      path: path(el),
      tag: el.tagName.toLowerCase(),
      rect: { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height },
      display,
      flow,
      pad: { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) },
      mar: { t: px(cs.marginTop), r: mr, b: px(cs.marginBottom), l: ml },
      border,
      gap: { row: px(cs.rowGap), col: px(cs.columnGap) },
      lineHeight: cs.lineHeight === 'normal' ? px(cs.fontSize) * 1.2 : px(cs.lineHeight),
      fontSize: px(cs.fontSize),
      interactive,
      ...(hit ? { hit } : {}),
      enclosed: !transparent(cs.backgroundColor) || hasBorder || (cs.boxShadow && cs.boxShadow !== 'none'),
      look: [cs.backgroundColor, ...(['Top', 'Right', 'Bottom', 'Left']).map((s) => `${cs[`border${s}Width`]} ${cs[`border${s}Style`]} ${cs[`border${s}Color`]}`), cs.boxShadow].join('|'),
      selected: el.matches('[aria-pressed="true"],[aria-pressed="mixed"],[aria-selected="true"],[aria-checked="true"],[aria-checked="mixed"],[aria-current]:not([aria-current="false"]),:checked'),
      heading,
      outOfFlow: cs.position === 'absolute' || cs.position === 'fixed',
      ignored: Boolean(ignore && el.closest(ignore)),
      inlineText: display === 'inline' && parentText,
      centred: ml > 0 && Math.abs(ml - mr) < 0.5 && !!parentEl && getComputedStyle(parentEl).display === 'block',
      ellipsis: cs.textOverflow === 'ellipsis',
      spread: /space-(between|around|evenly)/.test(cs.justifyContent),
      // cx, cy: where the clip rect starts (border, and a scrollbar on the start side); st, sl: scroll position;
      // m: overflow-clip-margin, which lets a ring or shadow paint past an overflow: clip edge.
      clip: overflowing ? {
        sw: el.scrollWidth, sh: el.scrollHeight, cw: el.clientWidth, ch: el.clientHeight, cx: el.clientLeft, cy: el.clientTop,
        st: el.scrollTop, sl: el.scrollLeft, m: cs.overflowX === 'clip' || cs.overflowY === 'clip' ? px(cs.overflowClipMargin) : 0,
      } : null,
      scrolls,
      scrollsY: /(auto|scroll)/.test(cs.overflowY),
      ...(bleed && el.matches(bleed) ? { bleed: true } : {}),
      children: [],
    };
    out.push(box);
    for (const c of el.children) {
      const before = out.length;
      visit(c, id);
      for (let i = before; i < out.length; i++) if (out[i].parent === id && !box.children.includes(out[i].id)) box.children.push(out[i].id);
    }
  };
  visit(root, null);
  return {
    url: location.href,
    viewport: { w: innerWidth, h: innerHeight },
    rootFontSize: px(getComputedStyle(document.documentElement).fontSize),
    dir: getComputedStyle(root).direction,
    pageScroll: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
    elements: out,
  };
}

/** In the page: prepend a hidden child and append an absolutely positioned one to every element that has children. Self-contained. */
export function perturb(options = {}) {
  const root = document.querySelector(options.root || 'body');
  if (!root) return 0;
  let n = 0;
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (!el.children.length || el.hasAttribute('data-spacing-probe') || /^(SCRIPT|STYLE|svg|SELECT|TEMPLATE|TABLE|THEAD|TBODY|TFOOT|TR|COLGROUP)$/i.test(el.tagName)) continue;
    const hidden = document.createElement('span');
    hidden.setAttribute('data-spacing-probe', 'hidden');
    hidden.hidden = true;
    const floating = document.createElement('span');
    floating.setAttribute('data-spacing-probe', 'floating');
    floating.setAttribute('aria-hidden', 'true');
    floating.style.cssText = 'position:absolute;inset-block-start:0;inset-inline-start:0;inline-size:0;block-size:0;overflow:hidden';
    // First and last: a rule keyed to :first-child, * + * or :last-child now matches different elements.
    el.prepend(hidden);
    el.append(floating);
    n++;
  }
  return n;
}

/** In the page: remove what perturb added. Self-contained. */
export function unperturb() {
  const probes = document.querySelectorAll('[data-spacing-probe]');
  for (const p of probes) p.remove();
  return probes.length;
}

const FIX = {
  'off-scale': 'Use a spacing role or component token; if the relationship is new, add a role aliasing a scale step (token)',
  'outer-margin': "Remove the margin; the parent's gap or the element's own padding owns the space (layout or component)",
  'negative-margin': 'Remove the negative margin; fix the inset or token it undoes (token or component)',
  'inner-exceeds-inset': "Lower the inner gap to a role at most the container's inset, or raise the inset role (token)",
  'content-intrudes': 'Find what eats the inset (a negative margin, a fixed size, overflow) and remove it (component)',
  'uneven-insets': "Use the family's even inset token on both block edges, or text-trimmed roles (component token)",
  'heading-space': 'Give the flow a larger space above headings than below (layout stack roles or prose rules)',
  'group-separation': 'Separate groups by a role at least 2 × the inner gap, or enclose them (layout or token)',
  'target-size': 'Grow the hit area to 24 px or more with padding or an invisible extension (component token)',
  'below-target': "Use the project's target size (size.control), or record the dense surface that takes a smaller one (component)",
  'clipped': 'Remove the fixed size; use min-block-size or let it wrap (component)',
  'page-scroll': 'Find the element wider than the window; let it wrap or scroll inside its own container (layout)',
  'overlap': 'Remove the negative margin or fixed size that makes siblings overlap (layout or component)',
  'alignment': 'Line the edges up on one inset; a child is offset by its own padding or margin (component)',
  'moved': 'Space set by sibling position or by a state rule; move it to the parent gap and padding, or reserve it (layout or component)',
  'spacing-changed': "A rule keyed to sibling position or to a state changes this box's spacing; make it the parent's gap and padding, or reserve it at rest (layout or component)",
  'not-mirrored': 'Replace the physical property (left, right) with its logical one (inline-start, inline-end) in the component',
  'nested-enclosure': "The group's members use the bare variant: no border, fill or shadow at rest; hover, selection, focus and drop-target cues only in their state rules (component)",
  'ring-clipped': "Pad inside the overflow container by at least the focus ring's width plus offset (tokens), or use overflow: clip with overflow-clip-margin; never overflow: hidden flush around controls (layout)",
  'scroll-inset': "Move the padding off the wrappers around the scroll region onto the content inside it, so the region reaches its surface's edges (layout)",
  'padded-surface': 'Remove the all-around padding from the visible surface; pad its regions one or two levels below, and let the child that bleeds sit outside them (layout)',
};

const fmt = (n) => `${Math.round(n * 10) / 10}px`;

/** Findings for one snapshot. options: base (px at a 16 px root, default 4), allow (extra px values), target (px; adds S2 below it), ring (px: the focus ring's width plus offset; adds ring-clipped). */
export function analyze(/** @type {Snapshot} */ snap, options = {}) {
  const base = (options.base ?? 4) * (snap.rootFontSize || 16) / 16;
  const allow = new Set((options.allow ?? [1]).map(Number));
  const tol = 0.5;
  /** @type {Finding[]} */
  const out = [];
  const add = (severity, rule, el, measured, expected) => out.push({ severity, rule, path: el.path, measured, expected, fix: FIX[rule] });
  const byId = new Map(snap.elements.map((e) => [e.id, e]));
  const kids = (e) => e.children.map((c) => byId.get(c)).filter((c) => c && !c.outOfFlow && (c.rect.w > 0 || c.rect.h > 0));
  const onScale = (v) => allow.has(Math.round(Math.abs(v) * 100) / 100) || Math.abs(Math.abs(v) / base - Math.round(Math.abs(v) / base)) < 0.02;
  const axisOf = (e) => (e.flow === 'row' ? 'x' : 'y');
  /** Measured gaps between consecutive in-flow children along the container's axis. A spread row (space-between) aligns its ends; its gaps are alignment, not grouping. */
  const gaps = (e) => {
    const c = kids(e);
    if (c.length < 2 || e.flow === 'inline' || e.spread) return [];
    const ax = axisOf(e);
    const size = ax === 'x' ? 'w' : 'h';
    const sorted = [...c].sort((a, b) => a.rect[ax] - b.rect[ax]);
    const g = [];
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i].rect[ax] - (sorted[i - 1].rect[ax] + sorted[i - 1].rect[size]);
      if (d >= -tol) g.push({ d: Math.max(0, d), a: sorted[i - 1], b: sorted[i] });
    }
    return g;
  };
  /** Measured insets from the container's padding edge (inside the border) to its in-flow children. */
  const insets = (e) => {
    const c = kids(e);
    if (!c.length) return null;
    const r = e.rect;
    return {
      t: Math.min(...c.map((k) => k.rect.y)) - (r.y + e.border.t),
      b: r.y + r.h - e.border.b - Math.max(...c.map((k) => k.rect.y + k.rect.h)),
      l: Math.min(...c.map((k) => k.rect.x)) - (r.x + e.border.l),
      r: r.x + r.w - e.border.r - Math.max(...c.map((k) => k.rect.x + k.rect.w)),
    };
  };

  if (snap.pageScroll && snap.pageScroll.sw > snap.pageScroll.cw + 1) out.push({ severity: 'S1', rule: 'page-scroll', path: 'document', measured: `content ${snap.pageScroll.sw}px wide`, expected: `≤ ${snap.pageScroll.cw}px (the window)`, fix: FIX['page-scroll'] });

  for (const e of snap.elements) {
    // An ignored element (prose, a third-party widget) is exempt from every rule.
    if (e.ignored) continue;
    {
      for (const [k, v] of [...Object.entries(e.pad).map(([s, v]) => [`padding-${s}`, v]), ['row-gap', e.gap.row], ['column-gap', e.gap.col]])
        if (v > tol && !onScale(v) && !(k.endsWith('gap') && !/flex|grid/.test(e.display))) add('S3', 'off-scale', e, `${k} ${fmt(v)}`, `a multiple of ${fmt(base)}`);
      if (e.flow !== 'inline' && !e.outOfFlow && e.parent !== null) {
        const sides = Object.entries(e.mar).filter(([s, v]) => Math.abs(v) > tol && !(e.centred && (s === 'l' || s === 'r')));
        for (const [s, v] of sides) {
          if (v < 0) add('S3', 'negative-margin', e, `margin-${s} ${fmt(v)}`, '0');
          else add('S3', 'outer-margin', e, `margin-${s} ${fmt(v)}`, "0 (the parent's gap or padding)");
        }
      }
    }

    const ins = insets(e);
    const g = gaps(e);
    if (ins && !e.ignored && !e.scrolls && e.flow !== 'inline') {
      for (const s of /** @type {const} */ (['t', 'b', 'l', 'r']))
        if (ins[s] < e.pad[s] - tol) add('S1', 'content-intrudes', e, `inset-${s} ${fmt(ins[s])}${kids(e).some((k) => k.mar[s] < 0) ? " (a child's negative margin)" : ''}`, `≥ padding ${fmt(e.pad[s])}`);
      if (e.enclosed && e.flow !== 'row' && kids(e).length && Math.abs(e.pad.t - e.pad.b) > tol) add('S4', 'uneven-insets', e, `padding-top ${fmt(e.pad.t)}, padding-bottom ${fmt(e.pad.b)}`, 'equal block insets');
    }
    if (ins && e.enclosed && g.length && !e.scrolls) {
      const ax = axisOf(e);
      const edge = ax === 'x' ? Math.min(ins.l, ins.r) : Math.min(ins.t, ins.b);
      const widest = Math.max(...g.map((x) => x.d));
      if (edge > tol && widest > edge + tol) add('S2', 'inner-exceeds-inset', e, `gap ${fmt(widest)} inside, inset ${fmt(edge)}`, 'gap ≤ inset');
    }

    // Headings: more space above than below, ideally twice.
    if (e.flow !== 'row' && e.flow !== 'inline') {
      const c = kids(e).sort((a, b) => a.rect.y - b.rect.y);
      for (let i = 1; i < c.length - 1; i++) {
        const h = c[i];
        if (!h.heading || h.ignored) continue;
        const above = h.rect.y - (c[i - 1].rect.y + c[i - 1].rect.h);
        const below = c[i + 1].rect.y - (h.rect.y + h.rect.h);
        if (above <= below + tol) add('S2', 'heading-space', h, `above ${fmt(above)}, below ${fmt(below)}`, 'above ≥ 2 × below');
        else if (above < 2 * below - tol) add('S4', 'heading-space', h, `above ${fmt(above)}, below ${fmt(below)}`, 'above ≥ 2 × below');
      }
    }

    // Groups of groups: the space between unenclosed groups is at least 1.5 × (ideally 2 ×) the space within them.
    // Measured to what the eye sees: the box gap plus each group's own empty inset on the facing sides (a row
    // whose content is centred in a taller box reads further from its neighbour than its box edge).
    const groups = kids(e).filter((k) => !k.enclosed && gaps(k).length);
    if (groups.length >= 2 && g.length) {
      const ax = axisOf(e);
      const facing = (x) => {
        const ia = insets(x.a);
        const ib = insets(x.b);
        return x.d + (ia ? Math.max(0, ax === 'x' ? ia.r : ia.b) : 0) + (ib ? Math.max(0, ax === 'x' ? ib.l : ib.t) : 0);
      };
      const between = g.filter((x) => groups.includes(x.a) && groups.includes(x.b)).map(facing);
      if (between.length) {
        const outer = Math.min(...between);
        const inner = Math.max(...groups.flatMap((k) => gaps(k).map((x) => x.d)));
        if (inner > tol && outer < 1.5 * inner - tol) add('S2', 'group-separation', e, `between groups ${fmt(outer)}, within ${fmt(inner)}`, `≥ ${fmt(2 * inner)} (never under ${fmt(1.5 * inner)})`);
        else if (inner > tol && outer < 2 * inner - tol) add('S4', 'group-separation', e, `between groups ${fmt(outer)}, within ${fmt(inner)}`, `≥ ${fmt(2 * inner)}`);
      }
    }

    // Nested enclosure: a row of controls inside an enclosed group (the row, or its parent) whose members each draw
    // their own border, fill or shadow at rest. Two or more drawn the same way, with no state active, is noise;
    // one emphasised action and fields are exempt. Rows of tall tiles (over 64 px) are content, not controls.
    if (e.flow === 'row' && !e.outOfFlow) {
      const host = e.enclosed ? e : e.parent !== null ? byId.get(e.parent) : undefined;
      if (host && host.enclosed && host.parent !== null && !host.ignored) {
        const members = kids(e).filter((k) => k.interactive && !k.ignored && !/^(input|select|textarea)$/.test(k.tag));
        const looks = new Map();
        for (const k of members) if (k.enclosed && !k.selected && k.rect.h <= 64) looks.set(k.look ?? '', (looks.get(k.look ?? '') ?? 0) + 1);
        const most = Math.max(0, ...looks.values());
        if (most >= 2) add('S2', 'nested-enclosure', e, `${most} of ${members.length} members enclosed at rest inside an enclosed ${host === e ? 'group' : 'parent'}`, "no border, fill or shadow at rest; the group's boundary is the only one");
      }
    }

    // Edges out of line by a hair in a stacked column.
    if ((e.flow === 'block' || e.flow === 'column') && kids(e).length >= 2) {
      const lefts = kids(e).map((k) => k.rect.x);
      const common = lefts.sort((a, b) => lefts.filter((v) => Math.abs(v - b) < tol).length - lefts.filter((v) => Math.abs(v - a) < tol).length)[0];
      for (const k of kids(e)) {
        const d = Math.abs(k.rect.x - common);
        if (d > tol && d <= 4 && !k.ignored) add('S4', 'alignment', k, `start edge ${fmt(d)} from its siblings'`, 'in line');
      }
    }

    if (e.clip && !e.scrolls && !e.ellipsis && (e.clip.sw > e.clip.cw + 1 || e.clip.sh > e.clip.ch + 1)) add('S1', 'clipped', e, `content ${e.clip.sw}×${e.clip.sh}px in ${e.clip.cw}×${e.clip.ch}px`, 'nothing hidden');

    // Siblings that overlap.
    const c = kids(e);
    for (let i = 0; i < c.length; i++)
      for (let j = i + 1; j < c.length; j++) {
        if (c[i].ignored || c[j].ignored) continue;
        const a = c[i].rect;
        const b = c[j].rect;
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 1 && oy > 1) add('S1', 'overlap', c[j], `overlaps ${c[i].path.split(' > ').pop()} by ${fmt(ox)} × ${fmt(oy)}`, 'no overlap');
      }
  }

  // Targets (WCAG 2.5.8): at least 24 × 24, or a 24 px circle on each touches no other target or circle.
  // Visually hidden elements (1 px or less) aren't pointer targets. A target is its box grown by its hit extension.
  const targets = snap.elements.filter((e) => e.interactive && !e.ignored && !e.inlineText && e.rect.w > 1 && e.rect.h > 1).map((e) => ({ ...e, rect: e.hit ?? e.rect }));
  const centre = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  for (const t of targets) {
    const small = t.rect.w < 24 - tol || t.rect.h < 24 - tol;
    if (small) {
      const p = centre(t.rect);
      const conflict = targets.some((o) => {
        if (o === t || o.parent === t.id || t.parent === o.id) return false;
        const oSmall = o.rect.w < 24 - tol || o.rect.h < 24 - tol;
        if (oSmall) {
          const q = centre(o.rect);
          return Math.hypot(p.x - q.x, p.y - q.y) < 24;
        }
        const dx = Math.max(o.rect.x - p.x, 0, p.x - (o.rect.x + o.rect.w));
        const dy = Math.max(o.rect.y - p.y, 0, p.y - (o.rect.y + o.rect.h));
        return Math.hypot(dx, dy) < 12;
      });
      add(conflict ? 'S1' : 'S2', 'target-size', t, `${fmt(t.rect.w)} × ${fmt(t.rect.h)}${conflict ? ', too close to another target' : ''}`, '≥ 24px × 24px');
    } else if (options.target && (t.rect.w < options.target - tol || t.rect.h < options.target - tol)) add('S2', 'below-target', t, `${fmt(t.rect.w)} × ${fmt(t.rect.h)}`, `≥ ${fmt(options.target)} (the project's target size)`);
  }

  const up = (e) => (e.parent !== null ? byId.get(e.parent) : undefined);
  const last = (e) => e.path.split(' > ').pop();

  // Focus rings: a visible control's ring, its box grown by options.ring, lies inside its nearest clipping ancestor's
  // clip rect. On an axis that scrolls, an edge counts only when scrolled to it; a control partly scrolled out is skipped.
  const ring = options.ring ?? 0;
  if (ring > 0) {
    for (const t of snap.elements) {
      if (!t.interactive || t.ignored || t.outOfFlow || t.rect.w <= 1 || t.rect.h <= 1) continue;
      let a = up(t);
      while (a && !a.clip) a = up(a);
      if (!a || a.ignored) continue;
      const c = a.clip;
      const m = c.m ?? 0;
      const left = a.rect.x + (c.cx ?? a.border.l);
      const top = a.rect.y + (c.cy ?? a.border.t);
      const clipRect = { l: left - m, t: top - m, r: left + c.cw + m, b: top + c.ch + m };
      const r = t.rect;
      if (r.x < clipRect.l - tol || r.y < clipRect.t - tol || r.x + r.w > clipRect.r + tol || r.y + r.h > clipRect.b + tol) continue;
      const scrollsX = a.scrolls && c.sw > c.cw + 1;
      const scrollsY = a.scrolls && c.sh > c.ch + 1;
      const atInlineStart = Math.abs(c.sl ?? 0) <= 1;
      const atInlineEnd = Math.abs(c.sl ?? 0) + c.cw >= c.sw - 1;
      const rtl = snap.dir === 'rtl';
      const counts = {
        t: !scrollsY || (c.st ?? 0) <= 1,
        b: !scrollsY || (c.st ?? 0) + c.ch >= c.sh - 1,
        l: !scrollsX || (rtl ? atInlineEnd : atInlineStart),
        r: !scrollsX || (rtl ? atInlineStart : atInlineEnd),
      };
      const cut = { t: clipRect.t - (r.y - ring), b: r.y + r.h + ring - clipRect.b, l: clipRect.l - (r.x - ring), r: r.x + r.w + ring - clipRect.r };
      const sides = /** @type {const} */ (['t', 'r', 'b', 'l']).filter((s) => counts[s] && cut[s] > tol);
      if (sides.length) add('S1', 'ring-clipped', t, `ring cut ${sides.map((s) => `${fmt(cut[s])} ${{ t: 'top', r: 'right', b: 'bottom', l: 'left' }[s]}`).join(', ')} by ${last(a)}`, `≥ ${fmt(ring)} clear inside the clip`);
    }
  }

  for (const e of snap.elements) {
    if (e.ignored || e.parent === null) continue;

    // A scroll region bleeds to its surface's edges: no wrapper's padding between it and the surface's inline-end
    // or block-end edge, so the scrollbar sits at the edge and content scrolls to the bottom.
    if ((e.scrollsY ?? e.scrolls) && e.clip && !e.interactive && e.children.length) {
      const chain = [];
      for (let a = up(e); a; a = up(a)) {
        chain.push(a);
        if (a.enclosed) break;
      }
      const surface = chain.at(-1);
      if (surface && surface.enclosed) {
        const inlineEnd = snap.dir === 'rtl' ? 'l' : 'r';
        const s = surface.rect;
        const d = {
          [inlineEnd]: inlineEnd === 'r' ? s.x + s.w - surface.border.r - (e.rect.x + e.rect.w) : e.rect.x - (s.x + surface.border.l),
          b: s.y + s.h - surface.border.b - (e.rect.y + e.rect.h),
        };
        const off = Object.entries(d).filter(([side, v]) => {
          const pad = chain.reduce((n, a) => n + a.pad[side], 0);
          return v > 1 && pad > tol && v <= pad + 1;
        });
        if (off.length) add('S2', 'scroll-inset', e, off.map(([side, v]) => `${side === 'b' ? 'bottom' : 'scrollbar edge'} ${fmt(v)} inside ${last(surface)}`).join(', '), "0: the region reaches the surface's edge; padding goes on its content");
      }
    }

    // A visible surface padded all around blocks a child that must bleed (a divider, an edge-to-edge row, media).
    if (e.enclosed && e.children.length && ['t', 'r', 'b', 'l'].every((s) => e.pad[s] > tol)) {
      /** @type {Box | undefined} */
      let found;
      const walk = (x) => {
        for (const k of kids(x)) {
          if (found) return;
          if (k.bleed && !k.ignored) found = k;
          else if (!k.enclosed) walk(k);
        }
      };
      walk(e);
      if (found) add('S2', 'padded-surface', e, `padding ${fmt(e.pad.t)} ${fmt(e.pad.r)} ${fmt(e.pad.b)} ${fmt(e.pad.l)} all around; ${last(found)} must bleed`, 'no padding on the surface; its regions carry it');
    }
  }
  return dedupe(out);
}

/**
 * Findings for what changed between two snapshots of the same page (before and after perturb(), or before and after
 * forcing hover, focus or press): every box whose own margin, padding, border or gap changed (the cause), then the boxes
 * where a move or resize starts, then one line counting everything it pushed.
 */
export function compare(/** @type {Snapshot} */ before, /** @type {Snapshot} */ after, options = {}) {
  const tol = options.tolerance ?? 0.5;
  const cause = options.cause ?? 'a change';
  const a = new Map(before.elements.map((e) => [e.id, e]));
  const b = new Map(after.elements.map((e) => [e.id, e]));
  /** @type {Finding[]} */
  const causes = [];
  /** @type {Map<string, Finding>} */
  const changed = new Map();
  /** @type {Set<string>} */
  const causeIds = new Set();
  const rel = (m, e) => {
    const p = e.parent ? m.get(e.parent) : null;
    return { x: e.rect.x - (p ? p.rect.x : 0), y: e.rect.y - (p ? p.rect.y : 0), w: e.rect.w, h: e.rect.h };
  };
  for (const [id, e1] of a) {
    const e2 = b.get(id);
    if (!e2 || e1.ignored) continue;
    const r1 = rel(a, e1);
    const r2 = rel(b, e2);
    const moved = Math.abs(r1.x - r2.x) > tol || Math.abs(r1.y - r2.y) > tol;
    const resized = Math.abs(r1.w - r2.w) > tol || Math.abs(r1.h - r2.h) > tol;
    // The cause: an element whose own margin, padding, border or gap changed.
    const diffs = [];
    for (const [k, name] of [['mar', 'margin'], ['pad', 'padding'], ['border', 'border']])
      for (const s of ['t', 'r', 'b', 'l']) if (Math.abs(e1[k][s] - e2[k][s]) > tol) diffs.push(`${name}-${s} ${fmt(e1[k][s])} → ${fmt(e2[k][s])}`);
    for (const s of ['row', 'col']) if (Math.abs(e1.gap[s] - e2.gap[s]) > tol) diffs.push(`${s}-gap ${fmt(e1.gap[s])} → ${fmt(e2.gap[s])}`);
    if (diffs.length) causeIds.add(id);
    if (diffs.length) causes.push({ severity: 'S1', rule: 'spacing-changed', path: e1.path, measured: `${diffs.join('; ')} after ${cause}`, expected: 'unchanged', fix: FIX['spacing-changed'] });
    if (!moved && !resized) continue;
    const parts = [];
    if (resized) parts.push(`size ${fmt(r1.w)} × ${fmt(r1.h)} → ${fmt(r2.w)} × ${fmt(r2.h)}`);
    if (moved) parts.push(`offset (${fmt(r1.x)}, ${fmt(r1.y)}) → (${fmt(r2.x)}, ${fmt(r2.y)})`);
    changed.set(id, { severity: 'S1', rule: 'moved', path: e1.path, measured: `${parts.join('; ')} after ${cause}`, expected: 'unchanged', fix: FIX.moved });
  }
  // Report where a change starts, not everything it pushes: skip a box with a changed descendant (it grew or shrank
  // because of it) and a box with a changed earlier sibling (it was pushed).
  const hasChangedInside = new Set();
  for (const id of [...changed.keys(), ...causeIds]) for (let p = a.get(id)?.parent; p; p = a.get(p)?.parent ?? null) hasChangedInside.add(p);
  const pushed = (id) => {
    const e = a.get(id);
    const siblings = e?.parent ? a.get(e.parent)?.children ?? [] : [];
    return siblings.slice(0, siblings.indexOf(id)).some((s) => changed.has(s) || causeIds.has(s) || hasChangedInside.has(s));
  };
  const origins = [...changed].filter(([id]) => !hasChangedInside.has(id) && !pushed(id)).map(([, f]) => f);
  const out = [...causes, ...origins];
  if (changed.size > origins.length) out.push({ severity: 'S1', rule: 'moved', path: 'document', measured: `${changed.size} boxes moved or changed size after ${cause}`, expected: 'none', fix: FIX.moved });
  return dedupe(out);
}

/**
 * Findings for insets that don't mirror: the same page collected left to right and right to left (dir="rtl" on the
 * root). Each box's inline-start padding and border in one equals its inline-start in the other.
 */
export function mirror(/** @type {Snapshot} */ ltr, /** @type {Snapshot} */ rtl, options = {}) {
  const tol = options.tolerance ?? 0.5;
  const b = new Map(rtl.elements.map((e) => [e.id, e]));
  /** @type {Finding[]} */
  const out = [];
  for (const e1 of ltr.elements) {
    const e2 = b.get(e1.id);
    if (!e2 || e1.ignored) continue;
    const diffs = [];
    for (const [k, name] of [['pad', 'padding'], ['mar', 'margin'], ['border', 'border']]) {
      if (Math.abs(e1[k].l - e2[k].r) > tol || Math.abs(e1[k].r - e2[k].l) > tol) diffs.push(`${name} left/right ${fmt(e1[k].l)}/${fmt(e1[k].r)} → ${fmt(e2[k].l)}/${fmt(e2[k].r)}`);
    }
    if (diffs.length) out.push({ severity: 'S2', rule: 'not-mirrored', path: e1.path, measured: diffs.join('; '), expected: 'start and end swap in right to left', fix: FIX['not-mirrored'] });
  }
  return dedupe(out);
}

/** One finding per rule, element and measurement. */
function dedupe(/** @type {Finding[]} */ list) {
  const seen = new Set();
  return list.filter((f) => {
    const k = `${f.rule}|${f.path}|${f.measured}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const ORDER = { S1: 0, S2: 1, S3: 2, S4: 3 };

/** The audit report: counts, then findings grouped by rule, most severe first. Root cause and test are filled in by the auditor. */
export function report(/** @type {Finding[]} */ findings, title = 'Spacing audit') {
  const sorted = [...findings].sort((x, y) => ORDER[x.severity] - ORDER[y.severity] || x.rule.localeCompare(y.rule) || x.path.localeCompare(y.path));
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const lines = [`# ${title}`, '', `S1 ${count('S1')} · S2 ${count('S2')} · S3 ${count('S3')} · S4 ${count('S4')}`, ''];
  lines.push('| # | Severity | Rule | Where | Measured | Expected | Root cause | System fix | Test |', '|---|---|---|---|---|---|---|---|---|');
  sorted.forEach((f, i) => lines.push(`| ${i + 1} | ${f.severity} | ${f.rule} | \`${esc(f.path)}\` | ${esc(f.measured)} | ${esc(f.expected)} | (trace) | ${esc(f.fix)} | (name it) |`));
  return lines.join('\n') + '\n';
}

function main(argv) {
  const opts = { base: 4, allow: [1], target: 0, ring: 0, title: 'Spacing audit' };
  let file = '';
  let other = '';
  let rtl = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--compare') other = argv[++i];
    else if (argv[i] === '--mirror') rtl = argv[++i];
    else if (argv[i] === '--base') opts.base = Number(argv[++i]);
    else if (argv[i] === '--allow') opts.allow = argv[++i].split(',').map(Number);
    else if (argv[i] === '--target') opts.target = Number(argv[++i]);
    else if (argv[i] === '--ring') opts.ring = Number(argv[++i]);
    else if (argv[i] === '--title') opts.title = argv[++i];
    else file = argv[i];
  }
  if (!file) {
    console.error('Usage: node spacing-probe.mjs <snapshot.json> [--compare <after.json> | --mirror <rtl.json>] [--base 4] [--allow 1,2] [--target 44] [--ring 4] [--title "…"]');
    return 2;
  }
  const snap = JSON.parse(readFileSync(file, 'utf8'));
  const findings = other ? compare(snap, JSON.parse(readFileSync(other, 'utf8'))) : rtl ? mirror(snap, JSON.parse(readFileSync(rtl, 'utf8'))) : analyze(snap, opts);
  process.stdout.write(report(findings, opts.title));
  return findings.some((f) => f.severity === 'S1' || f.severity === 'S2') ? 1 : 0;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('spacing-probe.mjs')) process.exitCode = main(process.argv.slice(2));
