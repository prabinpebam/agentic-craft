# Components in detail

## Anatomy of a component file

Whatever the framework, a component file has, in order:

1. **The doc comment**
   ```
   /**
    * A button: an action on this page, or a link styled as one when it goes somewhere.
    * Use for the main actions of a form or a card; not for navigation lists (use Link).
    * @tier fundamental
    * @a11y A <button> when it does something, an <a> when it goes somewhere.
    * @a11y Disabled buttons stay focusable with aria-disabled, so their reason can be read.
    * @key Enter / Space: activates
    */
   ```
2. **Typed props, each commented**, with defaults in one destructuring the library can read.
3. **Markup** using only lower-tier components and its own elements.
4. **Scoped styles** reading tokens only (semantic or its own `c.*` group).
5. **A client script** if it has behaviour: wiring only, set up per instance through a helper that also handles pages swapped in without a reload, passing an abort signal to every global listener. Logic beyond wiring lives in a pure, tested module in tier 0.

Keep the file short (a tested limit, for example 650 lines with markup and script at most 350). Past it, move logic to tier 0.

## States every interactive component covers

rest · hover (inside `@media (hover: hover)`) · active (the touch twin) · focus-visible · disabled · and where they apply: selected, checked, expanded, invalid, busy (`data-busy`), empty, loading (skeleton), error. Each state in light, dark and more-contrast. One story per variant and state.

## Stories

```
stories/Button.stories.<ext>
  <Example title="Primary">   <Button variant="primary">Save changes</Button> </Example>
  <Example title="With an icon">…</Example>
  <Example title="Disabled, with a reason">…</Example>
```

What's inside each example is what the library shows as code, so keep it clean and real. A layout's story is a whole page, framed at desktop, tablet and phone widths.

## The library

A route (for example `/design/`) built from the source at build time:

- **Registry:** for each component file, parse the doc comment, the props (through the type checker), the tokens its styles read, its imports (giving "uses" and "used by"), and its stories.
- **A page per component:** summary, tier, accessibility notes, keys, props table (name, type, default, description), the tokens it reads (linked to their token pages), uses / used by, and each example rendered live with its source and a light/dark switch.
- **A page per token group:** the tokens shown as what they are (swatches with contrast, scales as bars, motion as playable curves), the only place primitives are displayed.
- **A page per layout:** the real layout framed at three widths with its regions labelled.

Nothing in the library is written by hand. A test fails if a component has no story or a story names a component that doesn't exist.

## Common fundamentals

Type: Heading, Text, Link, Caption, Prose (rich text), Quote, Tag, Divider · Media: Icon, Image, Video, Avatar · Actions: Button, IconButton · Controls: TextField, Select, Checkbox, Radio, Switch, Slider · Feedback: Progress, Spinner, Skeleton · Scrolling: ScrollArea.

## Common compounds

Page frame: Shell (document, head, theme before paint), Header, Footer, SideNav, Breadcrumbs · Openings: Hero, ArticleHeader · Indexes: Card, List · Media: Figure, Gallery, Lightbox, Carousel · Forms: ChoiceGroup, FormSection · Overlays: Dialog, Popover, Menu, Toast region.

## Common layouts

Landing · Index (a section listing its items in a view: list, tiles, grid) · Article (a long read) · Settings (forms in cards) · Manager (a list beside the chosen item's details) · Library (the design library itself).

## Icons

Imported one at a time as data (an SVG path set in a generated module) from a licensed or open set, only those used; drawn by an `Icon` fundamental with `aria-hidden` and a text twin on the control. Never an icon font, a CDN, an emoji or a text symbol.
