---
name: visual-noise
description: Use when designing, mocking or reviewing any UI, when adding a border, divider, fill, shadow, icon, colour or line of text, when a screen feels busy, boxy or cluttered, when a request asks for a cue during one interaction (a drag, a hover, a customise mode), or when a task touches a component that is already approved. Every mark must carry information nothing else carries - an ink budget; one cue per meaning; the cue order space, alignment, type, tone, border, shadow (the cheapest that works); at most one enclosure per boundary and a depth limit; transient affordances that appear only while their state is active; no decoration or colour noise; icons and words that earn their place; approved components never restyled as a side effect; and measurable checks (enclosure depth, nested enclosures, borders per region, distinct strokes, fills and shadows, resting cues inside enclosed groups) with severities and a review checklist.
---

# Visual noise: every mark earns its place

**Noise** is anything a person has to see and process that tells them nothing new: a border around something already grouped, a second cue for a meaning already shown, an icon that repeats its label, a sentence that describes what the screen already shows. Each one is small. Together they make a calm screen busy, push the real signal down, and make every later change harder to see. NN/g: "every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility" (heuristic 8). Tufte's version for graphics: maximise the share of ink that carries data; erase ink that carries none, and ink that repeats what's already there.

Noise rarely arrives on purpose. It arrives as a side effect: a cue asked for during one interaction made permanent, a component restyled inside a mock for another feature, a box added "to be safe" around a group that space already groups. This skill is the check against that.

Neighbours: grouping by space and the one-enclosure-per-boundary rule are in `spacing`; tokens and component tiers in `design-system`; when state cues appear and how long they stay in `ui-states`; words in `ui-copy`; the measurements and a page snippet in [checks](references/checks.md); the research in [sources](references/sources.md).

## The rules

1. **Ink budget.** Every line, border, divider, fill, shadow, icon, colour and word carries information that nothing else on the screen already carries. For each mark, ask what it tells the person that they wouldn't know without it. If the answer is "nothing" or "the same as that other thing", remove it. A mark that only decorates is noise, however pretty.
2. **One cue per meaning.** Each meaning (these belong together, this is selected, this failed, this can be pressed, this is a drop target) is shown once. Selected is a fill *or* a check, not a fill, a border, bold text and a check. The one allowed exception is accessibility: colour is never the only cue (WCAG 1.4.1), so a state may pair colour with exactly one non-colour cue. Two channels for one meaning is the ceiling.
3. **The cheapest cue that works.** Reach for cues in this order and stop at the first that does the job: **space → alignment → type (size, weight) → tone or fill → border → shadow (elevation)**. Each step to the right is heavier: it draws more ink, competes harder for attention and costs more in every theme and contrast mode. Proximity alone groups most things (`spacing`); a shared fill groups what space can't; a border is for a boundary that tone can't show (a field, a hairline between dense regions); a shadow is for something that truly floats above the page (a menu, a dialog, a dragged item).
4. **One enclosure per boundary, and a depth limit.** A boundary is drawn once, by one mechanism (`spacing` rule 1). Members of an enclosed group (a toolbar, a segmented control, a card, a menu, a list in a panel) get **no border, outline, resting fill or shadow of their own**: the group's boundary is the only one. In flow, at rest, a view has at most **two** levels of visible enclosure below the window's surface (a panel and a field in it; a dialog and its field). Something that floats (a menu, a popover, a dialog) starts a new surface and counts from one again. A card inside a card, a box inside a box with nothing between them, or a bordered button inside a bordered toolbar is never right at rest.
5. **Transient affordances stay transient.** At rest, a control shows only what a person needs to find and use it. Hover, press, focus, selection, a drop target while dragging, the slots of a customise mode: each appears only while its state is active and leaves with it. A cue asked for during one interaction is scoped to that interaction. **The worked example:** "a border on each slot" for drag to customise a toolbar means an accent-colour border on the one slot that is the active drop target, only while a dragged item is over it. It never means a border on every button at rest, nor on every slot for the whole drag; at rest, nothing inside the enclosed toolbar has a border. Two cues stay at rest because they carry information: the selected or on state (it's a fact about the control, not a moment), and the focus ring while focus is visible. A resting boundary is kept only where the control couldn't be found without it, which is what WCAG 1.4.11 asks for: a field needs its boundary at 3:1; a button identified by its text or icon doesn't need one.
6. **No decoration, little colour.** No gradients, textures, inner shadows, double rules, ornamental dividers, a stripe on one edge of a card or button, or a tint that means nothing. Colour carries meaning: neutrals for structure, one accent for the main action and the selection, status colours only where a status is shown. Every additional colour, stroke weight or shadow in a view is one more thing a person has to decode; keep each family small and named by its role (`design-system`'s tokens).
7. **Icons earn their place.** An icon belongs where it's recognised faster than the word, or where a frequent action needs a compact target (with its name as a tooltip and its accessible name). Not beside every label in a list "for balance", not repeating the word next to it in a heading, not as the only cue for something rare. One icon style; filled versus outline is used for state (on, selected), never mixed for taste. One size per context.
8. **Words earn their place.** No sentence describing what the screen already shows, no helper text that repeats the label, no "click here", no instructions for what the control makes obvious. Show the thing instead of describing it: a card, a badge, a preview, the options themselves. Where the project scores visual over verbose presentation, that rubric applies; `ui-copy` owns the words that remain.
9. **Approved components keep their look.** A component that has been approved (in the library, signed off, already shipping) is never restyled as a side effect of another task. A mock for a new feature reuses it unchanged; a change to its look is its own change, asked for and reviewed on its own, made in the component (never overridden in a view). When a new mode or interaction needs a different look (a drag, a customise mode), the new look is scoped to that mode's state and the resting look is untouched.
10. **Measure it.** Noise is countable: enclosure depth, enclosed members inside enclosed groups, bordered elements per region, distinct stroke, fill and shadow values in a view. The thresholds are below; the method is in [checks](references/checks.md).

## Choosing a cue

For every mark you're about to add, answer in order; stop at the first answer that settles it.

1. **What does it mean?** Name the meaning in a few words (grouped, selected, failed, pressable, droppable, more important). No meaning: don't add it.
2. **Is that meaning already shown?** By space, position, type, a fill, an icon, a word, an enclosing parent. Yes: don't add it (rule 2).
3. **Is it needed at rest, or only in a state?** Only in a state: put it in the state's rule (hover, `aria-pressed`, `aria-selected`, focus-visible, a dragging attribute), never in the resting style (rule 5).
4. **Take the cheapest cue that works:** space, alignment, type, tone or fill, border, shadow (rule 3).
5. **Check the boundary.** Is there already an enclosure at this boundary, or is this element a member of an enclosed group? Then it gets none of its own (rule 4).
6. **Check the floor.** Where identifying a control relies on the cue, does it reach 3:1 (WCAG 1.4.11)? Is colour paired with one non-colour cue (WCAG 1.4.1)? Accessibility is never traded for calm; it's met with the fewest marks.
7. **Is the component approved?** Then its look stays; scope any new look to the new state or mode (rule 9).

## Checks

| Check | Measures | Threshold | Severity |
|---|---|---|---|
| `restyled-approved` | An approved component's resting look differs from its library version in a view, mock or change that wasn't about it | none | **N1** |
| `nested-enclosure` | Members of an enclosed group drawn with their own border, fill or shadow at rest (the `spacing` probe's rule of the same name) | 0 | **N1** |
| `resting-transient` | A hover, drag, drop-target or customise cue present at rest | 0 | **N1** |
| `enclosure-depth` | Visible enclosures (a border, a fill that differs from its parent's, a shadow) from the window's surface to an element in flow, at rest | ≤ 2 | **N2** |
| `redundant-cue` | Channels showing one meaning (fill, border, weight, colour, icon, word) | ≤ 2, one of them not colour | **N2** |
| `borders-per-region` | Bordered elements and dividers inside one region (a toolbar, panel, card, dialog), fields excepted | ≤ dividers between its groups | **N2** |
| `distinct-strokes` | Distinct border and divider values (width, style, colour) in a view, status and focus excepted | ≤ 3 | **N3** |
| `distinct-fills` | Distinct background values in a view, status and selection excepted | ≤ 4 | **N3** |
| `distinct-shadows` | Distinct shadow values in a view | ≤ 2 (raised, overlay) | **N3** |
| `heavier-cue` | A border or shadow where tone or space already separates, a weight change where position already ranks | none | **N3** |
| `decorative-mark` | An icon, divider, tint or ornament with no meaning of its own; a sentence restating the UI | none | **N4** |

| Severity | Means | When it's fixed |
|---|---|---|
| **N1 Misleading** | A mark says something false or overrides an approved decision: a resting outline that reads as selected or as a drop target, members that read as separate controls, an approved component that changed without being asked | Before anyone is shown the change |
| **N2 Cluttered** | Grouping and state read through redundant boxes, lines and cues | Before release |
| **N3 Heavy** | A costlier cue or a wider palette than the job needs | Batched by root cause |
| **N4 Polish** | A mark that adds nothing, visible to a careful eye | When the component is next changed |

The `spacing` audit reports `nested-enclosure` on its own S1 to S4 scale (S2, misgrouped); a noise review raises it to N1 because a resting outline on every member reads as a state that isn't there. Fix each finding at the level of the system: the component's bare variant for group members, the state rule instead of the resting style, a token family trimmed to its roles. Never a one-off override in a view. A finding that a written decision allows (a dense data table that needs row rules) cites the decision.

## Never

- A border, outline, resting fill or shadow on the members of an enclosed toolbar, segmented control, card, menu or list.
- A card inside a card; a box inside a box with nothing between them; more than two levels of visible enclosure in flow at rest.
- A cue asked for during one interaction (a drag, a hover, a customise mode) left on at rest.
- A divider, a large gap and a border on the same boundary; a fill, a border, bold and a check for one selection.
- Colour as the only cue; colour as decoration.
- Gradients, textures, inner shadows, ornamental rules or a stripe on one edge of a card or button.
- An icon beside every label, an icon repeating its word, mixed icon styles.
- A sentence describing what the screen already shows; helper text that repeats the label.
- An approved component restyled in a mock, a view or a change that wasn't about it.

## Review checklist

- [ ] Every line, border, fill, shadow, icon, colour and word carries information nothing else carries
- [ ] Each meaning has one cue (two at most, one not colour)
- [ ] Each cue is the cheapest that works: space, alignment, type, tone, border, shadow
- [ ] One enclosure per boundary; members of enclosed groups have no border, outline, resting fill or shadow
- [ ] At most two levels of visible enclosure in flow at rest; floating surfaces start again at one
- [ ] Hover, press, focus, drag, drop-target and customise cues appear only while active; selection and visible focus are the only resting state cues
- [ ] Fields and other controls that need a boundary to be found have one at 3:1; nothing else does
- [ ] No decoration; colour only for structure, the accent, selection and status
- [ ] Icons are recognised faster than the word, or are compact targets with names; one style, one size per context
- [ ] No words that restate the UI; the visual-over-verbose rubric met where the project has one
- [ ] Every approved component looks exactly as approved; any new look is scoped to its new state or mode
- [ ] Distinct strokes ≤ 3, fills ≤ 4, shadows ≤ 2 in the view

Visual noise is the measurable side of heuristic 8, aesthetic and minimalist design, and one look per component across the product is heuristic 4, consistency (the [usability heuristics](../craft/references/usability-heuristics.md)). Check them together when a view is reviewed.
