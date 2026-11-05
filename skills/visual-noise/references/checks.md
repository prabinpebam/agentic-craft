# Measuring visual noise

How to count noise in a running view, so a review says "four stroke values and a depth of three" instead of "it feels busy". The `spacing` probe (`tools/spacing-probe.mjs`) already reports `nested-enclosure`; the snippet here counts the rest. Both are read at rest: no pointer over the page, nothing focused, no drag, no menu open, motion settled.

## What counts as an enclosure

An element is **visibly enclosed** when, at rest, it has any of:

- a border or outline on any side, wider than 0, not `none`, not transparent;
- a background that differs from the nearest enclosing ancestor's background (a fill the same as its parent's draws no boundary);
- a box shadow.

Text, icons and images are content, not enclosures. A field (`input`, `select`, `textarea`, a `combobox`) is an enclosure that's allowed to be one: it needs its boundary to be found (WCAG 1.4.11).

**Depth** is the number of visibly enclosed ancestors an element in flow has, counting itself, from the window's surface. Anything out of flow and above the page (a menu, a popover, a dialog, a toast) is a new surface: its depth starts again at one.

## The snippet

Run it in the page (a browser driver's `evaluate`, or the developer tools console) with the view at rest. It returns the counts and the paths of what breaks a threshold; it changes nothing.

```js
function noiseCounts({ root = 'body', maxDepth = 2 } = {}) {
  const top = document.querySelector(root);
  const clear = (c) => !c || c === 'transparent' || /rgba?\([^)]*,\s*0(\.0+)?\)$/.test(c) || /\/\s*0\)$/.test(c);
  const field = (el) => el.matches('input:not([type=hidden]),select,textarea,[role=combobox],[role=textbox],[contenteditable="true"]');
  const label = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : '');
  const path = (el) => { const p = []; for (let e = el; e && e !== top && p.length < 4; e = e.parentElement) p.unshift(label(e)); return p.join(' > '); };
  const strokes = new Set(), fills = new Set(), shadows = new Set();
  const deep = [], restingInGroup = [];
  const walk = (el, depth, parentBg, enclosedParent) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const floating = cs.position === 'fixed' || (cs.position === 'absolute' && el.matches('[role=menu],[role=listbox],[role=dialog],dialog,[popover]'));
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !clear(cs[`border${s}Color`]));
    for (const s of sides) strokes.add(`${cs[`border${s}Width`]} ${cs[`border${s}Style`]} ${cs[`border${s}Color`]}`);
    const outline = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none' && !clear(cs.outlineColor);
    const bg = clear(cs.backgroundColor) ? parentBg : cs.backgroundColor;
    if (!clear(cs.backgroundColor) && cs.backgroundColor !== parentBg) fills.add(cs.backgroundColor);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
    const enclosed = sides.length > 0 || outline || bg !== parentBg || (cs.boxShadow && cs.boxShadow !== 'none');
    const d = floating ? (enclosed ? 1 : 0) : depth + (enclosed ? 1 : 0);
    if (enclosed && !floating && !field(el) && d > maxDepth) deep.push(`${path(el)} (depth ${d})`);
    const interactive = el.matches('button,a[href],[role=button],[role=tab],[role=menuitem],[role=option],[role=radio]');
    const selected = el.matches('[aria-pressed="true"],[aria-selected="true"],[aria-checked="true"],[aria-current]:not([aria-current="false"]),:checked');
    if (enclosed && interactive && !selected && !field(el) && enclosedParent) restingInGroup.push(path(el));
    for (const c of el.children) walk(c, d, bg, enclosed && !floating ? true : (floating ? false : enclosedParent));
  };
  walk(top, 0, getComputedStyle(document.documentElement).backgroundColor, false);
  return { strokes: strokes.size, fills: fills.size, shadows: shadows.size, deep, restingInGroup, values: { strokes: [...strokes], fills: [...fills], shadows: [...shadows] } };
}
```

Read the result against the thresholds in the skill:

| Field | Check | Threshold |
|---|---|---|
| `restingInGroup` | `nested-enclosure` (with the `spacing` probe's finding for rows of controls) | empty; one emphasised action may remain and is named in the report |
| `deep` | `enclosure-depth` | empty |
| `strokes` | `distinct-strokes` | ≤ 3, after removing status and focus values listed in `values.strokes` |
| `fills` | `distinct-fills` | ≤ 4, after removing status and selection values |
| `shadows` | `distinct-shadows` | ≤ 2 |

The counts are a screen, not a verdict: a value that a token role names and a written decision allows is fine. A value that no role names is a finding for `design-system` as well.

## The checks a person makes

Some noise needs eyes, not a script. Walk the view at rest and in each state:

1. **Cover each mark.** For each border, divider, fill, shadow and icon, imagine it gone. If nothing becomes ambiguous, it's `decorative-mark` or `heavier-cue`.
2. **Name each state's cues.** Hover, press, focus, selected, error, a drag over a drop target. Count the channels each one changes (fill, border, weight, colour, icon, word). More than two is `redundant-cue`.
3. **Leave each state.** Move the pointer away, finish the drag, close the customise mode. Anything still drawn that appeared for the state is `resting-transient`.
4. **Compare each approved component with the library.** Side by side, at rest, in light and dark. Any difference in a change that wasn't about that component is `restyled-approved`.
5. **Read every sentence.** Strike any that describes what the screen shows; that's `decorative-mark` (text). If the project scores visual over verbose presentation, score the view.

## The report

One table, grouped by root cause, as in the `spacing` audit:

| ID | Severity | Root cause | Component or token | Instances | System-level fix |
|---|---|---|---|---|---|
| VN-1 | N1 | Toolbar buttons use the outlined button variant inside the enclosed toolbar | compound toolbar, its button variant | 9 buttons | The toolbar's members use the bare variant; the outline moves to the drop-target state while dragging |

Then the findings, one line each: check, where (view, state, context), measured, threshold. End with the test that keeps each class fixed (the probe on the library, the snippet's thresholds in a browser test).
