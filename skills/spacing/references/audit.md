# The spacing audit

How to audit spacing in a running app and turn what you find into fixes at the level of the system, so the same issue can't come back. It's written to be followed step by step by an agent with a browser driver; a person with developer tools can follow it too. The rules it checks are in [spacing](../SKILL.md); the tokens in [tokens](tokens.md); per-element expectations in [rules by element](elements.md).

The probe, `tools/spacing-probe.mjs` in this harness (copy it into the project's tools), has two halves: functions that run **in the page** (`collect`, `perturb`, `unperturb`), passed to the driver's `evaluate`, and functions that run **in Node** on the snapshots they return (`analyze`, `compare`, `mirror`, `report`). The examples use Playwright; any driver with an `evaluate` works, and a desktop app built on web technology is driven the same way through its window's page.

## 0. Before you start

- **Read the system:** the token source (the scale's steps and the roles, resolved to px at a 16 px root), the component folders by tier, the layout components and which of them own `gap` and `padding`, the density and theme contexts, and the containers that render markup the system didn't write (rich text, imported HTML). Those go in the probe's `ignore` selector: they follow prose rules ([rules by element](elements.md#text-and-headings)), not component rules.
- **Know the base unit and any allowed exceptions** (hairlines: `--allow 1`). The probe checks that every padding and gap is a multiple of the base unit at the current root size.
- **Know the target size** the project promises (`size.control`) and its written list of dense surfaces allowed a smaller one. The probe always checks WCAG's 24 px; pass `target` to also report controls below the project's size, then drop the findings on listed surfaces.
- **Never take over the screen.** Run the app's windows hidden or headless, drive them only through the driver (no operating-system input), and close every window and browser you start.

## 1. Inventory

List what to measure before measuring anything. Keep the matrix small: every view at the default window first; the extra sizes and contexts for layouts and the views that differ.

| Axis | Values |
|---|---|
| Views | Every view and every layout, reached through the normal UI |
| States that add content | Open dialogs, menus, popovers, tooltips, expanded sections; empty, loading, error and pending states (`ui-states`); a long and a short value in every text slot |
| Widths | 320 px; each breakpoint −1 px and at the breakpoint; the default window; a wide window |
| Text | 100 % and 200 % text size; WCAG 1.4.12 text spacing |
| Contexts | Light and dark (enclosure is read from borders and fills, which can differ); each density |
| Direction | Left to right and right to left |

## 2. Measure

```js
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { collect, perturb, unperturb, analyze, compare, mirror, report } from './tools/spacing-probe.mjs';

const ROOT = 'body';
const IGNORE = '.prose';          // containers that style markup the system didn't write
const findings = [];
const where = (list, context) => list.map((f) => ({ ...f, measured: `${f.measured} [${context}]` }));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
await page.goto(APP_URL);
await openView(page, 'settings');                       // reach the view through the normal UI
await page.evaluate(() => document.fonts.ready);
const base = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
writeFileSync('audit/settings-1280.json', JSON.stringify(base));
findings.push(...where(analyze(base, { base: 4, allow: [1], target: 44 }), 'settings, 1280 px'));
```

`collect` returns, for every visible element: its box, padding, margin, border, gap, line height, font size, whether it's interactive, enclosed (a fill, border or shadow), a heading, out of flow, or clipping, and its children. An interactive element's target includes any absolutely positioned `::before` or `::after` that takes the pointer (an invisible hit extension). A visually hidden wrapper (clipped, 1 px or less) is skipped with everything in it, and anything inside `ignore` is exempt from every rule, in `analyze` and `compare` alike. It stamps each element with `data-spacing-id` so later snapshots line up. Wait for fonts and for motion to settle (reduced motion helps) before collecting.

`analyze` checks one snapshot:

| Rule | Severity | What it measures |
|---|---|---|
| `page-scroll` | S1 | The document is wider than the window |
| `clipped` | S1 | A box hides content it doesn't scroll or ellipsize |
| `overlap` | S1 | In-flow siblings overlap by more than 1 px |
| `content-intrudes` | S1 | A child sits inside its container's padding (a negative margin, a fixed size) |
| `target-size` | S1 or S2 | A target under 24 × 24 px: S1 when another target is within its 24 px circle, S2 otherwise |
| `inner-exceeds-inset` | S2 | In an enclosed container, a measured gap between children larger than the measured inset |
| `heading-space` | S2 or S4 | A heading no further from the content above than from its own (S2), or less than twice as far (S4) |
| `group-separation` | S2 or S4 | Unenclosed groups less than 1.5 × (S2) or 2 × (S4) apart than their members, measured to what the eye sees: the box gap plus each group's empty inset on the facing sides. A spread row (`space-between`) aligns its ends and isn't counted as a group |
| `off-scale` | S3 | A padding or gap that isn't a multiple of the base unit |
| `outer-margin`, `negative-margin` | S3 | A block-level element with a margin (centring `auto` margins excepted) |
| `uneven-insets` | S4 | An enclosed container with different top and bottom padding |
| `alignment` | S4 | A child's start edge 0.5 to 4 px from its siblings' |
| `below-target` | S2 | A target under the project's size, when `target` is given (dense surfaces on the written list excepted) |

## 3. Perturb: does the space survive a new child?

The test for the ownership rules. `perturb` prepends a hidden child and appends an out-of-flow child to every container, which is what a tooltip, portal, live region or focus guard does at run time. Every rule keyed to `:first-child`, `:last-child`, `* + *` or `+` now matches a different element; if any space moves, it was owned by a sibling's position.

```js
await page.evaluate(perturb, { root: ROOT });
const perturbed = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
findings.push(...where(compare(base, perturbed, { cause: 'a child added to every container' }), 'settings, 1280 px'));
await page.evaluate(unperturb);
await page.reload();                                   // the app's framework didn't expect those nodes
```

`compare` reports each box whose own margin, padding, border or gap changed (`spacing-changed`: the cause, for example `margin-b 24px → 0px`), each box where a move or resize starts (`moved`), and one line counting everything that was pushed. All are S1.

## 4. States: does anything move?

Force each state on each kind of control and compare. Pseudo-classes can be forced without any pointer through the browser's developer protocol; states driven by scripts (a tooltip on pointer enter, `aria-expanded`, `data-busy`) need the real event through the driver, then a compare, then closing it again.

```js
const cdp = await page.context().newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
const seen = new Set();
for (const t of base.elements.filter((e) => e.interactive)) {
  const kind = t.path.split(' > ').pop().replace(/#[\w-]+/, '');   // one instance per kind of control
  if (seen.has(kind)) continue;
  seen.add(kind);
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-spacing-id="${t.id}"]` });
  for (const forced of [['hover'], ['focus', 'focus-visible'], ['active']]) {
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: forced });
    const s = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
    findings.push(...where(compare(base, s, { cause: `:${forced.at(-1)} on ${kind}` }), 'settings'));
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  }
}
// Script-driven states: page.locator(sel).hover() / .focus() / .click(), collect, compare, then close (Escape, click away).
// Pending and loading: trigger a slow save or load with the project's test fakes, collect while pending, compare.
```

Hover rules inside `@media (hover: hover)` need a driver that reports a fine pointer (desktop emulation does).

## 5. Small windows and large text

```js
for (const width of [320, 639, 640, 1024]) {
  await page.setViewportSize({ width, height: 800 });
  const s = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
  findings.push(...where(analyze(s, { base: 4 }), `settings, ${width} px`));
}
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });   // the person's text size, if sizes are rem
// WCAG 1.4.12 text spacing:
await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }' });
const big = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
findings.push(...where(analyze(big).filter((f) => ['page-scroll', 'clipped', 'overlap', 'content-intrudes'].includes(f.rule)), 'settings, 200 % text and text spacing'));
```

With text enlarged or spacing injected, only losses count (scroll, clipping, overlap, intrusion); the injected values break the scale on purpose.

## 6. Right to left

```js
await page.reload();
await openView(page, 'settings');
const ltr = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
const rtl = await page.evaluate(collect, { root: ROOT, ignore: IGNORE });
findings.push(...where(mirror(ltr, rtl), 'settings, right to left'));
```

`mirror` reports any box whose left and right padding, margin or border don't swap (`not-mirrored`, S2): a physical property where a logical one belongs.

## 7. The static pass

Run the linters over the component and layout styles (not the token source):

```sh
node tools/lint-styles.mjs src/components src/layouts --allow 1px
node tools/lint-spacing.mjs src/components src/layouts --allow-margin .prose
```

Static findings point straight at a file and line; the browser findings say which of them a person can see. Check the token source too: every role aliases a scale step, every role has a description that names a relationship, and the ratios in [tokens](tokens.md#rules-between-roles) hold in every density.

## 8. Trace each finding to its source

A finding names a box; the fix needs the rule that set the value and the tier it lives in.

```js
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-spacing-id="42"]' });
const { matchedCSSRules } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
for (const m of matchedCSSRules) {
  const decl = m.rule.style.cssProperties.filter((p) => /^(margin|padding|gap|border)/.test(p.name) && p.value);
  if (decl.length) console.log(m.rule.selectorList.text, decl.map((p) => `${p.name}: ${p.value}`).join('; '));
}
```

Search the source for that selector and declaration. Then name the tier: a token (a role or scale value), a fundamental, a compound, a layout, or a view. A value set in a view is itself a finding: views carry no styles (`design-system`).

## 9. Choose the fix at the level of the system

Fix the cause once, where it lives, so every instance is fixed and the test can hold it. Never a per-view override, an `!important`, a negative margin, an extra wrapper with padding, or a nudge to make one screen line up.

| Finding | Usual cause | System-level fix |
|---|---|---|
| `off-scale` across many components, same value | A relationship with no role | Add a role aliasing a scale step; replace the literals |
| `off-scale` in one component | A literal or a stray step | The component's token, aliasing a role |
| `outer-margin`, `spacing-changed` after perturb | A component spacing itself from its siblings | Remove the margin; the parent layout's `gap` (give the layout a role-named gap if it lacks one) |
| `content-intrudes` | A negative margin or fixed size | Remove it; give the child room with the container's inset token |
| `inner-exceeds-inset` | Roles out of ratio, or a section gap inside a card | Lower the inner role or raise the inset role; inside containers, use group-level roles at most |
| `group-separation` | One stack role used at two levels | The layout uses the next role up between groups, or encloses them |
| `heading-space` | The heading carries its own space, or the stack is even | The stack layout's heading rule (more above, less below), or the prose rules |
| `uneven-insets`, insets differing within a family | Per-component values | One shared component-token group for the family (`owner: shared`) |
| `moved` on a state | A border, padding or weight set in a state rule | The component reserves it at rest (transparent border, outline, reserved bold width) |
| `target-size`, `below-target` | Hit area tied to visual size | The component's hit-area token, padding or invisible extension, at `size.control`; or a written dense-surface decision, never under 24 px |
| `clipped`, `page-scroll`, `overlap` | Fixed sizes, missing wrapping | `min-block-size` and wrapping in the component; a scroll container in the layout for two-dimensional content |
| `not-mirrored` | Physical properties | Logical properties in the component |
| `alignment` | Mismatched insets between neighbours | The same inset role on both, or the layout aligns them |

## 10. Severity

| Severity | Means | When it's fixed |
|---|---|---|
| **S1 Broken** | Content lost, clipped, overlapping or moving; a WCAG failure | Before anyone is shown the change |
| **S2 Misgrouped** | Grouping reads wrong, or one family looks inconsistent | Before release |
| **S3 Fragile** | Right today, wrong after the next change | Batched by root cause; each batch removes a class with a test |
| **S4 Polish** | Visible to a careful eye | When the component is next changed |

Ties go to the higher severity. A finding that repeats across views is one root cause with many instances: report it once, with the count.

## 11. The report

Write the report to the project's documentation, beside the design system. Root causes first, because that's what gets fixed.

```md
# Spacing audit: <scope>

**Scope:** <views> at <widths>, <text sizes>, <contexts>, <directions>. **Probe:** base <4 px>, allow <1 px>, target <44 px>.
**Totals:** S1 <n> · S2 <n> · S3 <n> · S4 <n> (<instances> instances, <root causes> root causes)

## Root causes

| ID | Severity | Root cause | Tier and source | Instances | System-level fix | Test that holds it |
|---|---|---|---|---|---|---|
| SP-1 | S1 | Dialog bottom space came from `:last-child` margin | compound `Dialog`, `dialog.css:41` | 6 dialogs | Dialog body owns `padding-block-end: var(--c-dialog-inset)`; remove the rule | perturb test on every dialog fixture; `lint-spacing` sibling-position rule |

## Findings

| # | Root cause | Severity | Rule | Where (view, state, width, context) | Measured | Expected |
|---|---|---|---|---|---|---|
| 1 | SP-1 | S1 | spacing-changed | settings › rename dialog, 1280 px, light | margin-b 24px → 0px after a child was added | unchanged |

## Tests to add

- <the check, where it runs, the root causes it covers>

## Not fixed, and why

- <finding or root cause>: <reason, and when it will be>
```

`report(findings)` from the probe prints the findings table with the measured and expected values and a suggested fix per rule; fill in the root cause and test columns while tracing, and group by root cause.

## False positives to recognise

- **Centred blocks:** equal `auto` margins on a block are centring, not spacing (the probe skips them).
- **Visually hidden elements** (skip links, screen-reader text) are 1 px boxes; the probe skips them as targets.
- **Scroll containers** are measured at their current scroll position; their insets are skipped. Check end padding by scrolling to the end and collecting again.
- **Enclosure depends on the theme:** a border that's transparent in one theme makes a container unenclosed there. Run light and dark.
- **Intentional overlap** (an avatar stack, a badge on an icon) is reported as `overlap`; keep it only if it's a component's documented anatomy, drawn out of flow.
- **Rich text** inside the `ignore` selector follows prose rules; audit it once, as its own component.
- **Animations** mid-flight move boxes: collect with reduced motion and after transitions end.
