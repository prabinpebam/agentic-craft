# Rules by element

How [spacing](../SKILL.md) applies to each kind of element: its anatomy, the tokens it reads, its edge cases, and what an [audit](audit.md) measures. Roles are from [tokens](tokens.md). "Layout-owned" means the parent sets the space with `gap` and its own `padding`; the element sets none outside its own box.

## Where padding lives

Padding is defined once, at the right level: not too high, not too granular. Whether a surface gets an enclosure at all is `visual-noise`'s call; this section is where its padding goes.

- **Functional and visual wrappers.** A functional wrapper exists for behaviour: it scrolls, clips, positions or sizes, and nobody sees it. A visual wrapper is the surface the eye reads as one thing: a dialog, a card, a panel. These rules are about the visual wrapper. A functional wrapper carries no padding unless it is the level chosen below.
- **Not all around the surface.** Padding on every side of the outermost visual wrapper fences in everything inside it: a divider can't reach the edges, a row can't run edge to edge, media can't bleed, and a scroll region can't put its scrollbar at the edge.
- **Not on the leaves.** Padding scattered across leaf components fragments the definition: each piece is right on its own, they drift apart, and lining them up takes arithmetic nobody keeps up to date.
- **Once, at the highest safe level.** Pad at the highest level where you're confident no content will ever need to break the padding. That is usually one or two levels below the visual wrapper: a dialog's header region and its content region, each with its own inset role.
- **Full-bleed children opt out by structure.** A child that must reach the edge sits outside the padded region, as its sibling, never inside it and pulled out with a negative margin.

To choose the level for a visual wrapper:

1. **List what sits inside it** and mark anything that must reach its edges, on any side, in any state: a divider, a full-width row or selection fill, media, a scroll region, a sticky bar.
2. **Nothing will ever bleed** (a tooltip, a chip, a button)? The surface carries its own inset; stop.
3. **Otherwise go one level down.** Each region (header, body, footer, a column) carries its own padding role; the children that bleed sit between or beside the regions.
4. **A region that scrolls** is a functional wrapper that bleeds; its padding goes one level further down, on the content inside it ([scroll containers](#scroll-containers-clipping-and-sticky-regions)).
5. **Stop there.** If a leaf seems to need padding of its own to line up, the region's inset is wrong: fix the region, not the leaf.

**Worked example: a settings dialog.** *Before:* the dialog itself had no padding, and its header and content areas each had their own, which was right. But the content area was padded all around and clipped with `overflow: hidden`, and the right-hand column scrolled inside it. The column's scrollbar sat an inset away from the dialog's right edge; its content was cut off an inset above the dialog's bottom edge; and a text field flush with the clip's start edge lost the left side of its focus ring. Padding the content area was still a level too high. *After:* the dialog has no padding; the header region has its inset; the content area has none and lays out the two columns edge to edge. Each column's scroll region reaches the dialog's edges, so the scrollbar sits at the dialog's edge and content scrolls to its bottom edge. The padding, including the end padding, is on the content inside each scroll region, and it's wider than the focus ring, so no ring is cut. The probe's `padded-surface`, `scroll-inset` and `ring-clipped` rules find the first version and pass the second.

## Text and headings

- **Prose** (rendered rich text, articles, help): paragraphs separated by a stack role that's at least the line's leading, so paragraphs read as units and not as double-spaced lines. Rendered markup you didn't write is the one place a flow rule (`> * + *`) is acceptable, scoped to the prose container, because the markup has no layout component to own the space; list it in `design-system`'s named list of global escapes.
- **Headings:** space above at least twice the space below; above a section heading `space.stack-section`, below it `space.stack-pair` or `space.stack-item`. A heading first in its container takes the container's inset and no more: the space above a heading belongs to the flow between siblings, never to the heading itself.
- **Line height** is part of spacing: leading for running text ≥ 1.5 (WCAG 1.4.8 at AAA, and readable at AA), tighter for headings and controls. Leading changes are type tokens (`leading.*`), never padding.
- **Measure to the ink.** A 16 px inset to a heading whose line box adds 6 px of half-leading looks like 22 px. Trim with `text-box: trim-both cap alphabetic` where the platform supports it, as a progressive enhancement; elsewhere, use text-trimmed roles ([tokens](tokens.md#roles)). Single-line labels in controls are centred by the box and don't need trimming; multi-line blocks next to edges do.
- **Text spacing must not break layout** (WCAG 1.4.12): with line height 1.5, paragraph spacing 2 ×, letter spacing 0.12 em and word spacing 0.16 em applied, nothing clips or overlaps. So: no fixed heights on text containers, `min-block-size` instead of `block-size`.

## Icons and text pairs

- **Gap:** `space.inline-pair` between icon and label, set on the pair's container with `gap`, never as a margin on the icon.
- **Alignment:** centre the icon on the text's cap height (or x-height for lower-case runs), not the line box; with `align-items: center` and a line height near 1 for the label, the two coincide. Check the result at each text size the pair is used with.
- **Built-in padding:** icon sets draw inside a smaller live area (a 24 px icon commonly has 2 px of padding). Where an icon leads a button, the button's leading padding is reduced by that amount, so the icon's ink, not its box, sits at the inset. This is a component token (`c.button.padding-inline-icon`), the one place a half step (2 px) is right.
- **Icon-only controls** are square, their icon centred, and their hit area at least the target size, whatever the icon's size.

## Buttons and controls

- **Squish inset:** inline padding larger than block (for example `space.3` block, `space.5` inline), from component tokens; height from `size.control` (44 px default) or a smaller size for compact contexts that still meets 24 px.
- **States move nothing:** the label becoming a spinner keeps the button's width (the spinner replaces content inside the same box, or the box has a minimum inline size); a pressed scale is a transform, which changes no layout; a focus ring is an outline, outside the box, with `outline-offset`.
- **Bold on hover or selection** reserves its width: a hidden bold copy of the label (`::after` with `content: attr(data-label)`, `visibility: hidden`, `block-size: 0`) or a variable font's grade axis, never a plain `font-weight` change.
- **Button groups:** `space.inline-item` between buttons, set by the group's `gap`. Primary and secondary actions in a footer align to the inline end, in the platform's order.

## Fields and forms

- **Field anatomy:** label, `space.stack-pair`, control, `space.stack-pair`, hint or error. Set on the field's own stack (`gap`), so a field without a hint has no dangling space.
- **Hints and errors appearing:** either the slot is reserved (one line of `min-block-size`) or the message grows the field downward only. Never shift the control the person is typing in. Reserving is right for short forms where messages are common; growing is right for long forms where reserved lines would waste room.
- **Between fields:** `space.stack-group`; related fields in a fieldset `space.stack-item`, with the fieldset's legend as a heading.
- **Checkbox and radio rows:** the whole row (control and label) is the target; `space.inline-pair` between control and label; label text wraps aligned with the label's start, not under the control.

## Cards and tiles

- **Inset:** `space.inset-md` on every side of the card's body region, from the card's component token. Media that bleeds to the card's edge sits outside the padded body, as its sibling, and bleeds on all the sides it touches; only a card that will never hold anything that bleeds carries the inset itself ([where padding lives](#where-padding-lives)).
- **Inside:** `space.stack-item` or `space.stack-group`, never more than the inset.
- **Between cards:** the grid's `gap`. Because each card is enclosed, the gap between cards may equal or be less than the inset; it is never more than twice the inset, or the cards stop reading as a set.
- **Actions** sit on the same inline start edge as the text above them, except an action footer aligned to the end.
- **Equal heights in a row:** the grid stretches the cards; a card's content never sets another card's height by a fixed size.

## Dialogs and sheets

- **Inset:** `space.inset-lg`, the same on header, body content and footer, so the three edges line up; never on the dialog itself, so dividers and the scroll region reach its edges ([where padding lives](#where-padding-lives)). The header and footer may be separated from the body by a divider or a surface change, or by space alone (`space.stack-group`), not both.
- **The dialog owns its padding** on its own regions. A tooltip, a toast region, a portal or a hidden form element appended into the dialog sits outside the flow (`position: absolute` or `fixed`, or rendered by the layout's host) and changes nothing. The audit's append test proves it.
- **Scrolling body:** the body is the scroll region and reaches the dialog's inline edges, so its scrollbar sits at the dialog's edge; header and footer stay put. Its inline and end padding is on the content inside it, so the end padding stays visible at the end of the scroll (not a margin on the last child). Scroll shadows or dividers show that more content exists.
- **Width:** a minimum and a maximum inline size from size tokens; on small windows, the dialog takes the full width minus `space.margin-page` and its inset doesn't shrink below `space.inset-md`.
- **Actions:** `space.inline-item` between buttons; aligned to the inline end; the primary first or last, by platform.

## Menus, popovers and listboxes

- **Container:** `space.inset-sm` in the block direction only. Items run edge to edge, so their hover and selection fills reach the container's inline edges or stop at an even inset on both sides, never one.
- **Items:** their own inline padding (component token) and height; `space.inline-pair` between icon and label; a trailing shortcut or chevron aligned to the inline end.
- **Groups:** a separator with `space.stack-item` on each side, or a group heading; not both plus extra space.
- **Hover and selection** change only colour; a checkmark slot is reserved at rest, so checking an item doesn't shift its label.

## Toolbars

- **Grouping, three ways, one at a time:** buttons in a group close together (`space.inline-item`), with groups apart (`space.inline-group`); or buttons touching inside a segmented enclosure; or a vertical separator between groups with `space.inline-item` either side. Pick one per boundary.
- **Bare members:** when the toolbar is enclosed (a pill, a bar with a fill or border), its buttons have no border, outline, fill or shadow at rest; only hover, press, the selected or on state, focus and a drop target while dragging draw one, and only while active. The worked example: in drag to customise, a slot gets a border, in the accent colour, only while it's the active drop target (a dragged item is over it). At rest, and on every other slot during the drag, no button or slot has a border.
- **Targets:** `size.control` by default. A dense toolbar may take a smaller target by a written decision, never under 24 × 24 px, with hit areas that don't overlap; on touch, always `size.control`.
- **Overflow:** when the toolbar runs out of room, whole groups move to an overflow menu from the end; buttons never shrink their padding to fit.

## Lists and tables

- **Rows:** a row height or block padding from component tokens; rows touch (a divider or alternating fill separates them) or are spaced by `space.stack-item`. Not a mix.
- **Cells:** cell padding is the column gap; the first column's text aligns with its header's text, and numbers align to the inline end.
- **States:** hover, selection and focus change colour or an outline, never the row's height or a cell's padding. A selected marker (a checkbox or an icon) has its slot at rest.
- **Empty rows and loading rows** keep the row's height (`ui-states`).

## Tabs and segmented controls

- **Tabs:** `space.inline-item` or touching tabs with their own inline padding; the selected indicator is drawn inside the tab's box (a background or an inset shadow), so selecting doesn't change height. The panel below starts with its own inset.
- **Segmented controls:** segments touch inside the enclosure; equal inline padding per segment; the selected fill moves without changing any segment's width.

## Panels, sidebars and regions

- **Inset:** `space.inset-md`; sections by heading and `space.stack-group`, or by a divider; `space.stack-section` only in an unenclosed panel.
- **Resizable panels:** content reflows; insets stay; below a minimum width the panel collapses rather than squeezes its inset.
- **Gutters:** between regions, `space.gutter` from the layout, or a divider with no gutter when the regions are surfaces of their own.

## Tooltips, popovers and anything appended

- **Rendered outside the flow:** in a layer host owned by the layout, or `position: fixed` or `absolute` with no effect on the parent's layout. Never a flex or grid item of the container it's attached to.
- **Offset** from its anchor by a component token (`c.tooltip.offset`, typically `space.2`), and kept inside the window with `space.2` of clearance.
- **Inset:** `space.inset-sm`; text trimmed or leading allowed for.

## Scroll containers, clipping and sticky regions

- **A scroll region bleeds to its surface's edges.** It's a functional wrapper: nothing around it is padded on the sides it touches, so its scrollbar sits at the surface's edge and its content scrolls all the way to the surface's bottom edge (or to the footer that ends it).
- **Padding goes on the scroll content inside it,** end padding included, so the last item has its end space when scrolled to the end: on the content element inside the scroll container, never a margin on the last child, never a wrapper outside the region. Check it at the end of the scroll, not only at the start.
- **Never clip a focus ring or a shadow.** Inside any overflow container (scrolling, `hidden` or `clip`), the space between its clip edge and every control is at least the focus ring's width plus its offset, from tokens (`border.focus` and the ring's offset), and enough for any shadow that must show. Prefer padding inside the clipping element, or `overflow: clip` with `overflow-clip-margin` (rings and shadows paint past the edge), over `overflow: hidden` on a wrapper whose children sit flush with its edge; don't clip at all where nothing overflows.
- **Scrollbars:** `scrollbar-gutter: stable` on containers whose content can grow past them, so content doesn't jump sideways when a scrollbar appears; with overlay scrollbars, keep the inset clear of the bar.
- **Sticky headers and footers** set `scroll-padding-block-start` (and `-end`) on the scroll container to their own size, so a focused or linked element is never hidden under them (WCAG 2.4.11).
- **Scroll snap** uses `scroll-padding` to match the container's inset, so snapped items line up with the content edge.

## The page

- **Margins:** `space.margin-page` on the page's outer region, by breakpoint; content never touches the window edge at any width.
- **Measure:** running text is held to `size.measure`; the leftover width is margin.
- **Small windows:** at 320 CSS px wide nothing scrolls sideways (WCAG 1.4.10) except content that needs two dimensions (a table, a map, code), and those scroll inside their own container.

## Right to left

- Logical properties throughout, so `dir="rtl"` mirrors every inset and gap with no extra rules.
- Directional icons (back, forward, a chevron showing the reading direction) mirror; icons of real objects and media controls don't.
- Measured insets mirror exactly: an element's inline-start inset in left-to-right equals its inline-start inset in right-to-left (the audit compares them).
