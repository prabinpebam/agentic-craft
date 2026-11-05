# Enforcing spacing

Tests for the mechanical rules of [spacing](../SKILL.md), alongside `design-system`'s [enforcement suite](../../design-system/references/enforcement.md). Each line is a check a test can make; add them with the system, not after the first audit.

## Static: the styles

`tools/lint-spacing.mjs` in this harness, over component and layout styles (never the token source), with `tools/lint-styles.mjs` for literal values:

| Check | Fails on | Why |
|---|---|---|
| **Outer margin** | Any `margin` other than `0` or `auto` | Space between siblings is the parent's `gap`; a component that spaces itself breaks when it's placed somewhere new |
| **Sibling-position spacing** | `margin`, `padding` or `gap` in a rule keyed to `:first-child`, `:last-child`, `:nth-child`, `:only-child`, the `-of-type` forms, `+` or `~` | A child appended at run time (a tooltip, a portal, a live region) changes which rule matches |
| **Geometry in a state** | Size, padding, margin, border width, font size or weight, letter spacing, gap or position in a rule for `:hover`, `:focus`, `:focus-visible`, `:focus-within`, `:active`, `:checked`, or an `aria-` or `data-` state attribute | States change colour, outline, shadow, opacity or transform; anything else moves the layout |
| **Physical property** | `margin-left`, `padding-right`, `left`, `border-left`, `scroll-padding-right`, `text-align: left`, `float: right` and the like | Right-to-left doesn't mirror them |
| **Bare scale step** (warning; error with `--strict`) | `var(--space-4)` read in a component | Components read roles or their own tokens, so one change of role changes one relationship |
| **Literal value** (`lint-styles`) | `12px`, `0.8rem` in any spacing property | Every value is a token |

Exemptions are named, not silent: `--allow-margin .prose` for the one container that styles rendered markup it didn't write, listed in the design system's global-escape list.

## Static: the tokens

- Every `space.*` role aliases a scale step, or a `clamp()` whose bounds are scale steps.
- Every role's `$description` names a relationship (inset, stack, inline, gutter, page margin, and a level), not a size.
- Every scale step is a multiple of the base unit; half steps exist only as component tokens with a description saying what they compensate.
- The ratios between roles hold in every density context: `stack-pair` < `stack-item` < `stack-group` < `stack-section`, each ≥ 1.5 ×; `inline-group` ≥ 1.5 × `inline-item`; `stack-group` ≤ `inset-md` ≤ `inset-lg`.
- Density contexts override roles and component tokens only, never the scale or text sizes.
- Spacing component tokens alias roles; a family's shared spacing is one `shared` group.

## Static: the views

- View documents and data carry no sizes: a view names layouts, regions and role names (`"space": "group"`), and the schema rejects a number or a unit in a spacing prop.
- Layout components accept spacing props only as role names, typed as an enumeration of the roles.

## In the browser

Run `tools/spacing-probe.mjs` on the component library (every story) and on every layout, as part of the end-to-end suite. Each line is one test:

- **No S1 or S2 findings** from `analyze` at the default window, on every story and layout, in light and dark.
- **Children added at run time change nothing:** `perturb`, collect, `compare` against the snapshot before; zero findings. Run it on every container component's stories, and specifically on each dialog, sheet, popover, menu, card and list with a tooltip or a live region attached.
- **States move nothing:** for each kind of control, force `:hover`, `:focus-visible` and `:active`, and trigger the script-driven states (expanded, selected, pending, invalid); `compare` finds nothing. Pending and loading run with the project's test fakes for slow saves and loads.
- **Targets:** every interactive element at least `size.control`, except on the written list of dense surfaces, where it's at least 24 × 24 px (or meets WCAG 2.5.8's spacing exception).
- **Small windows:** no `page-scroll`, `clipped` or `overlap` at 320 px and either side of each breakpoint.
- **Large text and text spacing:** at 200 % root size and with WCAG 1.4.12 text spacing injected, no `page-scroll`, `clipped`, `overlap` or `content-intrudes`.
- **Right to left:** `mirror` finds nothing on every layout.
- **Scrolling:** each scroll container scrolled to its end still shows its end padding; a sticky header's height is in the scroll container's `scroll-padding`, so a focused element scrolled into view isn't covered.
- **Focus rings are never clipped (S1):** run `analyze` with `ring` set to the focus ring's width plus its offset, resolved from the tokens, never typed; no `ring-clipped` on any story, layout or dialog, scrolled to the start and to the end.
- **Scroll regions bleed (S2):** no `scroll-inset`. For each dialog, sheet and panel that scrolls, its scroll region's inline-end and block-end edges equal the surface's padding box edges (within 1 px), so the scrollbar sits at the edge and the last content scrolls to the bottom.
- **Padding sits a level below the surface (S2):** collect with `bleed` set to the full-bleed parts (dividers between regions, edge-to-edge rows, media); no `padded-surface`. Scattered leaf padding stays a review check (S3): a region's children share one inset from the region, not their own.

Keep the browser checks deterministic: fonts loaded, reduced motion, fixed data, the same window size. A failure names the box, the measurement and the rule, so it can be fixed without rerunning the audit.

## The anatomy test

For each component with spacing in its anatomy (a dialog's three regions, a field's label-control-hint, a card's media and body), one test asserts the measured insets and gaps equal the resolved tokens (within 0.5 px). It catches a token renamed or re-aliased by mistake, and documents the anatomy in numbers.
