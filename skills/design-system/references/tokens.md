# Tokens in detail

## The files

```
design/
  tokens.json              base set: primitives p.*, semantic scales, component tokens c.*
  tokens.light.json        theme context: colour roles for light
  tokens.dark.json         theme context: colour roles for dark
  tokens.contrast-more.json  modifier: stronger muted text, outlines and rules (aliases)
  resolver.json            how they combine (sets and modifiers)
styles/tokens.css          generated
docs/tokens.md             generated reference
design/responsive.(ts|js)  generated helpers for scripts (breakpoints, sizes)
```

## A token

```json
{
  "color": {
    "text": {
      "$type": "color",
      "$value": "{p.ink.900}",
      "$description": "Body text on every surface"
    }
  },
  "space": {
    "4": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" }, "$description": "A field's gap to its hint" }
  },
  "c": {
    "button": {
      "$extensions": { "owner": "Button" },
      "height": { "$type": "dimension", "$value": "{size.control}", "$description": "A button's height: the control size" }
    }
  }
}
```

- A colour primitive: `{ "colorSpace": "srgb", "components": [0.1, 0.1, 0.12], "hex": "#1a1a1f" }`.
- Aliases use `{group.token}`; a component token aliases a semantic one; a semantic one aliases a primitive.
- `$description` says what it's for, not what it is ("Body text on every surface", not "Dark grey").

## Naming

| Kind | Pattern | Examples |
|---|---|---|
| Primitive | `p.<hue>.<step>`, `p.<scale>.<step>` | `p.indigo.500`, `p.gray.100` |
| Colour role | `color.<role>[-<variant>]` | `color.text`, `color.text-muted`, `color.bg`, `color.bg-raised`, `color.accent`, `color.accent-hover`, `color.positive`, `color.negative`, `color.focus`, `color.rule` |
| Scale | `<scale>.<step>` | `space.1…12`, `text.xs…3xl`, `radius.sm…pill`, `duration.fast`, `ease.standard`, `layer.overlay`, `shadow.md`, `opacity.disabled` |
| Size | `size.<thing>` | `size.control`, `size.measure`, `size.chrome-block` |
| Breakpoint | `breakpoint.<name>` | `breakpoint.sm` 40rem, `breakpoint.md` 56rem, `breakpoint.lg` 72rem, `breakpoint.short` (height) |
| Motion feedback | `scale.<intent>`, `shift.<intent>` | `scale.press`, `scale.lift`, `shift.press` |
| Component | `c.<component>.<part>-<property>` | `c.button.height`, `c.card.picture-ratio` |

## Contexts and modes

- The resolver applies the base set, then the theme context, then modifiers. The build emits each colour role that differs between light and dark as `light-dark(<light>, <dark>)`, and modifier overrides inside their media query (`@media (prefers-contrast: more)`).
- The page follows the system's scheme unless the person chooses one (stored, applied before first paint by a tiny inline script that sets `color-scheme` on the root).
- A subtree switches with `color-scheme` (`data-scheme="dark"`). Nothing else branches on the theme. The one exception worth allowing: a picture with a dark version (an image can't take a colour role), drawn as `<picture>` with a dark `<source>`.

## Fluid values

Type and space may grow between two viewport widths as `clamp(min, preferred, max)`; keep max ≤ 2.5 × min for text (WCAG 1.4.4). Store the min in `$extensions` beside the max.

## Breakpoints in scripts

`@media` can't read a custom property, so width queries in CSS use the breakpoint tokens' literal values (tested against the tokens), and scripts get generated helpers: `media('md')` → `(max-width: 56rem)`, `sizes(['popout', '92vw'], 'popout')` for responsive image `sizes`. No rem literal in a script's `matchMedia` or a `sizes` attribute (tested).

## The build

`tools/build-tokens.mjs` in this harness is a dependency-free reference: it resolves aliases, merges contexts, emits `light-dark()` pairs, writes CSS custom properties (`--color-text`, `--space-4`, `--c-button-height`), a markdown reference and a JSON of resolved values, and has `--check` to fail on stale output. Adapt names and paths to the project.
