---
name: spacing
description: Use when adding or changing layout, padding, margins or gaps, defining spacing tokens or density, when a screen feels cramped, loose or badly grouped, or when auditing and fixing spacing in a running app. A spacing system on one base unit - a scale, semantic roles (inset, stack, inline, gutter, page margin) and component tokens; grouping by proximity, with space inside a group never larger than the space around it; space owned by the layout (gap and padding on the parent, never margins set by a sibling's position); rules for text, icons, targets, density, small windows, scrolling and right-to-left; geometry that never moves on hover, focus or loading; an audit procedure with measurements, severities and a report that maps every issue to a token, component or layout fix; and the lint rules and tests that keep it true.
---

# Spacing: group by space, owned by the layout

Space is the strongest and cheapest way to show what belongs together. Things closer together read as one group; things further apart read as separate (the Gestalt law of proximity). Spacing, type, enclosing shapes, colour and motion all build hierarchy, and they're used together, but space does the grouping first: get it wrong and no border or colour can fix it.

A spacing system has two halves. The **visual rules** say how much space goes where, so grouping reads at a glance. The **ownership rules** say which element holds each space, so it stays right when content changes: a tooltip appended to a dialog, a row that's hidden, a language that reads right to left. Most spacing bugs in a working app break the second half.

This file is the contract; the detail is in the references: [tokens](references/tokens.md), [rules by element](references/elements.md), [the audit](references/audit.md), [enforcement](references/enforcement.md), and [sources and trade-offs](references/sources.md). Tokens, tiers and component rules in general belong to `design-system`; states and their timing to `ui-states`; layout shift during loading to `perceived-performance`.

## The rules

1. **Space groups first.** Show a group by proximity; add an enclosure (a surface, a border) only when proximity isn't enough, and a separator line only between groups that already have space. Use one mechanism per boundary: a divider *and* a large gap *and* a border on the same edge waste space and say nothing more.
2. **Inner space never exceeds outer space.** Within a group, the space between members is smaller than the space that separates the group from its neighbours. For groups with no enclosure, the space between groups is at least twice the space within them (never less than 1.5 times): if items in a row are as far apart as the rows, the rows become a grid. Inside an enclosed container, no gap between its children is larger than its inset (its padding); equal is the limit.
3. **Flow space grows with the level; a heading belongs to what follows.** Pair < item < group < section < page. The space above a heading is at least twice the space below it, and larger for higher headings (before a section heading > before a subsection heading), so a heading and its content read as one group, apart from the one before.
4. **Insets stay constant; nesting doesn't escalate.** Every container in a family uses that family's inset at every depth. Deeper structure is shown by enclosure, a heading or a divider, never by ever-growing space: a scale runs out of steps long before a real interface runs out of nesting, and growing insets waste room the content needs. Keep structures flat. A container with no visible boundary of its own adds no inset of its own (no padding inside padding).
5. **The layout owns space.** Space between siblings is the parent's `gap`; space inside a container is its own `padding`. Components have no outer margin. Space never depends on a sibling's position (`:first-child`, `:last-child`, `:nth-child`, `+`, `~`, `* + *`): anything added at run time (a tooltip, a portal, a live region, a hidden input, a focus guard) changes which child is first or last, and the space moves or vanishes. A real case: a tooltip appended to a dialog became its last child, the rule that spaced the last child stopped matching, and the dialog lost 24 px of bottom padding. With no margins, nothing can collapse either.
6. **Every value is a token on one scale.** A 4 px base unit (0.25 rem), a scale of its multiples, semantic roles that name the relationship (inset, stack, inline, gutter, page margin) and component tokens that alias them. Components read roles and their own tokens, never a literal and preferably never a bare scale step. Values in `rem`, so space grows with text size. See [tokens](references/tokens.md).
7. **Measure space to what the eye sees.** A line box adds half the leading above and below its text; an icon's artwork has padding inside its box. Space set to the box looks larger than its token. Trim the text box (`text-box: trim-both cap alphabetic` where supported) or build the leading into the role, and centre icons on the text's cap height or x-height. Never compensate with a one-off negative margin.
8. **A target's size isn't its visual size.** Every pointer target meets the project's target size (`size.control`, 44 px by default, as `design-system` sets). A dense surface (a toolbar, a table, a code editor's gutter) may take a smaller size by a written decision, never below 24 × 24 CSS px, or spaced so a 24 px circle on each touches no other (WCAG 2.5.8). Grow the hit area with padding or an invisible extension that changes neither the look nor the layout.
9. **Geometry is stable.** Hover, focus, pressed, selected, expanded, pending, loading and validation never change an element's size or move its neighbours. Borders are reserved at rest (a transparent border, an inset shadow or an outline), weight and size changes reserve their room, a spinner replaces content in the same box, and scrollbars reserve their gutter. A message that appears (an error, a hint) grows its container in one direction, never moving the control the person is using or anything above it.
10. **Logical, not physical.** `padding-inline`, `margin-block`, `inset-inline-start`, `text-align: start`. Right-to-left mirrors with no extra rules; anything that must not mirror (a media control, a graph's axis) says so in a comment.
11. **Density is a context, not a rewrite.** A compact or comfortable mode swaps the role tokens' values in one place; text size, targets and the inner ≤ outer ratios hold in every density.
12. **Small windows shrink the frame, not the content.** Page margins and gutters change at breakpoints through tokens; component insets keep their minimum. Content never touches the window edge, and nothing clips or overlaps at 320 CSS px wide, at 200 % text size, or with WCAG 1.4.12's text spacing applied.

## Choosing a value

For every space, answer in order; the first answer that settles it wins.

1. **Which relationship?** Inside a container's edge (**inset**), between siblings stacked in the block direction (**stack**), between siblings in a row (**inline**), between columns or regions (**gutter**), between content and the window (**page margin**).
2. **Which level?** A **pair** that reads as one thing (icon and label, label and field, field and hint, title and subtitle); **items** in one group (rows of a list, buttons in a group, fields in a fieldset); **groups** within a section; **sections** of a view; the **page**.
3. **Take the role** for that relationship and level (defaults with a 16 px root):

   | Level | Stack (block) | Inline (row) | Inset (container) |
   |---|---|---|---|
   | Pair | `space.stack-pair` 4 px | `space.inline-pair` 8 px | — |
   | Item | `space.stack-item` 8 px | `space.inline-item` 8 px | `space.inset-sm` 8 px: menus, tooltips, chips, list rows |
   | Group | `space.stack-group` 16 px | `space.inline-group` 16 px | `space.inset-md` 16 px: cards, popovers, panels |
   | Section | `space.stack-section` 32 px | `space.gutter` 24 px | `space.inset-lg` 24 px: dialogs, sheets, page regions |
   | Page | `space.margin-page`, by breakpoint | `space.margin-page` | — |

   Items in a row are measured between their visible edges, which include their own padding, so `space.inline-item` can equal `space.inline-pair` without the two levels blurring.

4. **Check it against its neighbours.** Inside its container, is it at most the container's inset (rule 2)? Is the space around its group at least twice the space within (rule 2)? Above a heading, at least twice the space below (rule 3)?
5. **Check what the eye sees:** text trimmed or leading allowed for, icons optically centred, targets big enough, nothing moves between states (rules 7 to 9).
6. **No role fits?** Either the structure has a level too many (flatten it, or let an enclosure or a heading do the grouping) or a real relationship has no name yet: add a role that aliases a scale step, with a `$description` that names the relationship. Never a literal, never a one-off nudge.

## Rules by element

The summary; each element's anatomy, edge cases and the measurements to check are in [rules by element](references/elements.md).

| Element | Inset | Inside | Watch for |
|---|---|---|---|
| Button | Component tokens; inline padding larger than block | `space.inline-pair` between icon and label; leading padding reduced when an icon leads | Width change when the label becomes a spinner or "Saving…"; hit area below target |
| Field | Component tokens | Label to field and field to hint `space.stack-pair` | A hint or error appearing moves the next field up or the field itself: grow downward only |
| Form | Its container's | Fields `space.stack-group`; related fields (a fieldset) `space.stack-item` | Groups and fields at the same distance |
| Card, tile | `space.inset-md` | At most the inset | Content flush with one edge; actions out of line with the text edge |
| Dialog, sheet | `space.inset-lg` on header, body and footer alike | Groups at most the inset; sections by heading or divider | Bottom padding from a child's margin; a scrolling body with no end padding; actions that move when the body scrolls |
| Menu, popover, listbox | `space.inset-sm` in the block direction; items carry their own inline padding | Items touch (their padding is the gap); `space.stack-item` either side of a separator | A hover fill that doesn't reach the edge, or that changes an item's height |
| Toolbar | `space.inset-sm` | Buttons in a group `space.inline-item`, or touching inside a segmented enclosure; groups `space.inline-group` or a separator | Three mechanisms on one boundary; targets that overlap |
| List, table | Rows by component tokens | Rows touch or `space.stack-item`; cell padding is the column gap | Row height changing on hover or selection; the first column out of line with its header |
| Panel, sidebar | `space.inset-md` | Sections by heading; `space.stack-section` only when unenclosed | A sticky header covering focused content |
| Tooltip | `space.inset-sm` | — | Being appended into the flow of its anchor's container |
| Page | `space.margin-page` | Sections `space.stack-section`; columns `space.gutter` | Content touching the window edge at small widths |

## Never

- A literal spacing value (`12px`, `0.8rem`) outside the token source.
- A margin on a component's outer edge; space between siblings set by the child instead of the parent.
- Space set by sibling position: `:first-child`, `:last-child`, `:nth-child`, `+`, `~`, the `* + *` owl selector, or margin collapse doing the work.
- A negative margin to undo space that shouldn't be there; a magic nudge to make a screenshot line up.
- A gap inside a container larger than its inset; groups separated by less than 1.5 times their inner space.
- Padding inside padding with no visible boundary between; insets that grow with nesting depth.
- A change of border width, padding, font weight, font size or size on hover, focus, press, selection or loading.
- A fixed height on anything holding text (it clips at 200 % text or with text spacing); a fixed width on a label.
- Physical properties (`margin-left`, `padding-right`, `left`, `text-align: left`) where a logical one exists.
- A hit area grown by adding visible space that moves the layout; adjacent targets that overlap.
- Spacing values in view documents or data: views name layouts, regions and roles, never sizes.

## The audit

To audit a running app, follow [the audit](references/audit.md). It's written for an agent working against real windows, with the probe in `tools/spacing-probe.mjs`. In short:

1. **Inventory** every view and its states, at 320 px and either side of each breakpoint, in each density and theme, left to right and right to left.
2. **Measure** computed styles and bounding boxes for every visible element: padding, margin, gap, borders, line height, the measured gaps between siblings and the measured insets to the container's edges.
3. **Perturb:** append a hidden and an absolutely positioned child to every container, and force hover, focus and press on every control; anything that moves is a finding.
4. **Check** each rule: tokens on the scale, no outer margins, inner ≤ outer, headings, edges, targets, stability, clipping and overlap, alignment, right-to-left mirroring.
5. **Trace** each finding to its source: the token, the component (and its tier) or the layout that set it.
6. **Report** with the template: severity, where, measured against expected, the rule, the root cause and the **system-level fix** (a token, a component or a layout, never a one-off patch), plus the test that keeps it fixed. Group findings by root cause; one fix usually clears many.

| Severity | Means | Examples |
|---|---|---|
| **S1 Broken** | Content lost, clipped, overlapping or moving; an accessibility failure | Padding lost when a child is appended; layout moves on hover; a target under 24 px; horizontal scroll at 320 px; text clipped at 200 % |
| **S2 Misgrouped** | Grouping reads wrong, a family is inconsistent, or a target is under the project's size | An inner gap larger than the inset; groups as close as items; a heading nearer the content above than its own; cards with different insets; a 32 px button where `size.control` is 44 |
| **S3 Fragile** | Right today, wrong after the next change | A literal or off-scale value; a margin on a component; sibling-position spacing; a physical property; a bare scale step in a component |
| **S4 Polish** | Visible to a careful eye | Untrimmed text; an icon a pixel off centre; edges 1 to 3 px out of line |

## Enforcement

The rules hold only where a test holds them ([enforcement](references/enforcement.md)):

- **Static:** `tools/lint-styles.mjs` fails on literal values; `tools/lint-spacing.mjs` fails on outer margins, sibling-position spacing, geometry that changes in a state rule and physical properties, and warns on bare scale steps in components.
- **Tokens:** every spacing role aliases a scale step and has a description that names the relationship; the scale is multiples of the base unit; density contexts override roles only; the inner ≤ outer ratios hold between roles in every density.
- **In the browser:** the probe on the library and every layout, failing on S1 and S2; append a child to every container and assert no inset changes; force hover, focus and press on every control and assert no box moves; targets at least `size.control` outside the written dense-surface list, and never under 24 px; no horizontal scroll at 320 px; no clipping at 200 % text or with text spacing; insets mirror in right-to-left.

## Review checklist

- [ ] Every space is a role or component token; no literals, no bare scale steps in components
- [ ] Inside every container, gaps ≤ inset; between unenclosed groups, at least twice the space within
- [ ] Headings closer to their own content than to the content above
- [ ] Containers in a family share one inset; no inset grows with depth; no padding inside padding
- [ ] Space is the parent's gap and padding; no outer margins; no sibling-position selectors
- [ ] Appending a child to any container changes nothing; hiding one leaves no gap behind
- [ ] Hover, focus, press, selection and loading move nothing
- [ ] Targets ≥ `size.control`; smaller only on dense surfaces by a written decision, and never under 24 px
- [ ] Text and icons optically aligned; edges in line
- [ ] Nothing clips or overlaps at 320 px, 200 % text, or with text spacing; content never touches the window edge
- [ ] Right-to-left mirrors; density modes keep the ratios and targets

Spacing carries two of the [usability heuristics](../craft/references/usability-heuristics.md): one inset and one rhythm across the product is consistency (H4), and space that groups without boxes and lines is minimalist design (H8). Check them with the rest when the view is reviewed.
