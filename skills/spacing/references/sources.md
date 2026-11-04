# Sources and trade-offs

The research behind [spacing](../SKILL.md), and where its rules deliberately differ from common guidance.

## Sources

**Perception and grouping**

- Max Wertheimer's laws of organisation, summarised by Nielsen Norman Group in [Proximity principle in visual design](https://www.nngroup.com/articles/gestalt-proximity/) and [The principle of common region](https://www.nngroup.com/articles/common-region/): items close together are seen as a group; a shared enclosure groups more strongly than proximity, and both are weakened by competing cues.
- Microsoft Fluent 2, [Layout](https://fluent2.microsoft.design/layout): elements close together are seen as related, and space alone can create sections without lines; more space around an element raises its importance; a global spacing ramp on a 4 px base unit, with 2, 6 and 10 px values added to compensate for icon padding.

**Scales and tokens**

- Material Design 3, [Spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing): measurements on a 4 dp grid, padding and spacing between elements, and margins and spacers that change with window size classes. Material 3, [Density](https://m3.material.io/foundations/layout/understanding-layout/density): denser layouts reduce component height in 4 dp steps, never below target sizes.
- Carbon Design System, [Spacing](https://carbondesignsystem.com/elements/spacing/overview/): one scale of 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 and 160 px complementing a 2x grid, used for both component and layout spacing, plus layout components for spacing that tokens alone don't express.
- Nathan Curtis (EightShapes), [Space in design systems](https://medium.com/eightshapes-llc/space-in-design-systems-188bcbae0d62): naming space by relationship (inset, squish and stretch insets, stack, inline) on a small scale of t-shirt sizes, so space is chosen by role rather than by number.
- W3C Design Tokens Community Group, [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/): the `dimension` type as `{ value, unit }` in `px` or `rem`, aliases, and groups.
- Every Layout, [The Stack](https://every-layout.dev/layouts/stack/), [The Box](https://every-layout.dev/layouts/box/) and [The Cluster](https://every-layout.dev/layouts/cluster/): layout primitives that own the space between and around their children, from a modular scale, so components carry no spacing of their own.

**Text**

- MDN, [`text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim) and [`text-box-edge`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-edge): trimming the half-leading over and under a text block to its cap height and baseline, for consistent space to the ink.
- Capsize, [Flipping how we define typography in CSS](https://seek-oss.github.io/capsize/): the same idea built from font metrics where trimming isn't available.
- WCAG 2.2, [1.4.12 Text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): no loss of content with line height 1.5, paragraph spacing 2 ×, letter spacing 0.12 × and word spacing 0.16 × the font size; [1.4.4 Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) to 200 %; [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) at 320 CSS px; [1.4.8 Visual presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) (line spacing at least 1.5 within paragraphs, AAA).

**Targets**

- WCAG 2.2, [2.5.8 Target size (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), AA: at least 24 × 24 CSS px, or spaced so a 24 px circle centred on each undersized target intersects no other target or circle; inline targets in a sentence excepted. [2.5.5 Target size (enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), AAA: 44 × 44.
- Apple Human Interface Guidelines, [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [Layout](https://developer.apple.com/design/human-interface-guidelines/layout): hit targets of at least 44 × 44 pt; consistent margins and alignment; respect safe areas.
- Material Design 3, [Accessibility basics](https://m3.material.io/foundations/accessible-design/accessibility-basics): touch targets of at least 48 × 48 dp, larger than the visual element where needed.

**Layout mechanics**

- MDN, [Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing): adjacent vertical margins, and a parent's margin with its first or last child's, collapse in block layout, but never in flex or grid.
- MDN, [`gap`](https://developer.mozilla.org/en-US/docs/Web/CSS/gap): space between rows and columns in flex, grid and multi-column layout, owned by the container.
- MDN, [CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values): flow-relative margins, padding, borders and insets.
- MDN, [`scrollbar-gutter`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) and [`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding); WCAG 2.2, [2.4.11 Focus not obscured (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- web.dev, [Cumulative Layout Shift](https://web.dev/articles/cls): unexpected movement of visible content harms use; shifts within 500 ms of an input are expected, others count.

## Where these rules differ from common guidance

| Rule here | Common guidance | Why |
|---|---|---|
| **No outer margins; gap only.** | Every Layout's Stack uses the owl selector (`* + *`) to add margin between siblings; many systems ship `:last-child { margin: 0 }` resets. | Both key space to sibling position. Run-time children (tooltips, portals, live regions, hidden inputs) change which sibling is first or last, and the space moves; flex and grid `gap` has no such failure and doesn't collapse. The owl stays acceptable in one place: a prose container styling markup it didn't write. |
| **Inner ≤ inset inside an enclosure; ≥ 2 × between open groups.** | Most systems say "related things closer" without numbers. | A number is testable. 2 × is the smallest ratio that reads as two levels at a glance on a 4 px scale (8 against 16); 1.5 × is the floor when a heading or enclosure also helps. Inside an enclosure the boundary does the separating, so equal is allowed there. |
| **Insets constant across nesting.** | Some guidance grows padding with hierarchy level. | A scale runs out of steps before real nesting does, and growing insets spend width the content needs. Hierarchy inside containers comes from headings, enclosure and dividers. |
| **Roles over bare steps in components.** | Many systems let components read `space-4` directly. | A role names the relationship, so density and rhythm change in one place and an audit can tell a stack gap from an inset. `design-system` allows bare steps; this skill tightens it with a warning first. |
| **Targets: the project's size (44 px by default), 24 px only on listed dense surfaces.** | WCAG AA asks for 24 px; Apple and Material ask for 44 pt and 48 dp. | 44 px is the default because a miss costs most people more than the space; dense desktop surfaces (toolbars, tables) can't always spend it, so they may take a smaller size by a written decision, with WCAG's 24 px as the floor. |
| **Text space measured to the ink.** | Most systems measure to the line box. | The eye sees ink; a 16 px token next to text with 6 px of half-leading reads as 22. Trimming makes tokens mean what they say; where trimming isn't available, the role carries the difference, written in its description. |
| **States change no geometry, not even 1 px.** | Some systems thicken a border on focus or selection. | A 1 px change moves every following element and makes hover flicker at the boundary. An outline, an inset shadow or a border reserved at rest looks the same and moves nothing. |
