# Views from data

The test of a strong design library: a new screen needs **data**, not code. Content and state are described by a contract; a registry maps each kind of data to a component; a layout says where things go. A renderer joins them.

## 1. The content contract

Typed schemas (Zod, JSON Schema, TypeScript types with validators) for every kind of content and every piece of structure:

- **Items:** a page (an ordered list of blocks), media (with alt text, credit, focus point, a dark version), a person, a setting.
- **Blocks:** `heading`, `text` (rich text), `image`, `gallery`, `quote`, `video`, `table`, `collection`, `callout`… each a discriminated union member with its own fields.
- **Structure:** the site or app map (home, sections, pages), navigation menus, which view a section uses, ordering. Never hardcoded.
- **Rules across items** (references resolve, ids are unique, private things never appear in public lists) checked by the loader, with errors that name the file and the fix.

Everything renders from validated data or doesn't render: a failed check stops a build and refuses a save, never shows a half page.

## 2. The registry

```js
// One entry per block type: the component, and a pure function from data to its props.
export const BLOCKS = {
  heading:   { component: Heading,  props: (b) => ({ level: b.level ?? 2, text: b.text }) },
  text:      { component: Prose,    props: (b) => ({ html: renderMarkdown(b.markdown) }) },
  image:     { component: Figure,   props: (b, ctx) => ({ picture: ctx.picture(b.media), caption: b.caption, breakout: b.width }) },
  gallery:   { component: Gallery,  props: (b, ctx) => ({ pictures: b.items.map(ctx.picture), layout: b.layout }) },
  quote:     { component: Quote,    props: (b) => ({ text: b.text, cite: b.cite }) },
};
```

- The mapping functions are pure and unit-tested; they're where data decisions live (defaults, derived values, picture sizes), never in the components.
- A test holds the registry equal to the schema: every block type in the contract has an entry, and every entry a type.

## 3. The view spec

```json
{
  "layout": "index",
  "regions": {
    "header": [{ "type": "hero", "title": "Work", "standfirst": "Case studies from ten years of design." }],
    "lead":   [{ "type": "contact-form" }],
    "main":   [{ "type": "collection", "view": "tiles", "items": { "from": "section", "id": "work" } }]
  }
}
```

- A layout declares its regions (slots) and what may go in each.
- Region items are the same block types as page bodies, or compound types (a collection, a form), each in the registry.
- Queries (`"from": "section"`) are resolved by the repository layer before rendering, so components only ever see plain data.

A JSON Schema for view specs is in `templates/ui/view.schema.json` of this harness, with an example in `templates/ui/example.view.json`.

## 4. The renderer

```
render(view):
  layout = LAYOUTS[view.layout]                     # fails validation if unknown
  for region, items in view.regions:
    for item in items:
      { component, props } = REGISTRY[item.type]
      place component(props(item, context)) in layout's region
```

The renderer is framework-agnostic in shape: in a component framework it's a page that loops; in a static site generator it's the route that renders every item the structure places; in a native app it's a list adapter.

## 5. Editing

An editor is another set of views over the same contract:

- Forms are generated from block schemas (field kinds the editor knows: text with a length, rich text, a picture, a choice, a switch, a reference).
- Every write goes through **one store** that validates the whole content before writing, versions files to detect conflicts, writes atomically, and rolls back on failure.
- The preview is the real renderer on the edited data.

## 6. Checks

- Every item in the content passes its schema; every reference resolves.
- Every schema type has a registry entry and a story; every layout has its regions documented.
- A sample of real content renders every block type (a fixture page) and is checked by axe in every context.
- A test greps the views folder: no styles, no raw markup beyond the layout and registry calls.
