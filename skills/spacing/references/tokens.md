# Spacing tokens

The token model for [spacing](../SKILL.md), in the format and tiers of `design-system` ([tokens in detail](../../design-system/references/tokens.md)). Three tiers, each reading only the one below:

```
scale            space.1 … space.16           multiples of the base unit; what roles alias
  └ roles        space.inset-md, space.stack-group, space.gutter …   the relationship; what components read
      └ component c.card.padding, c.button.padding-inline …          one component's decision, aliasing a role
```

## The base unit and the scale

- **Base unit: 4 px (0.25 rem at a 16 px root).** Small enough for the detail inside controls, large enough that every step is visibly different; 4 divides the common type sizes, icon sizes (16, 20, 24) and control heights (32, 40, 44, 48), so text, icons and boxes land on the same grid. An 8 px unit (Material's layout grid, Carbon's 2x grid) is the same system with the small steps removed: use 8 for layout and 4 inside components.
- **The scale is linear at the bottom and spreads at the top:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Small steps must be close (a 4 px difference inside a button is large); big steps must be far apart (24 against 28 between sections is noise). Name steps by their multiple of the base unit (`space.4` = 4 × 4 px = 16 px), so a step's name never lies when the unit stays fixed.
- **Half steps are exceptions, not steps.** 2 px (and 6 and 10 where icons need them) exist only to compensate for an icon's built-in padding or a hairline; they're component tokens with a description saying what they compensate, never roles.
- **`rem`, not `px`.** Space grows with the person's text size, so a 200 % text setting keeps grouping intact. `px` only for hairlines and outlines.
- **Fluid space is a role, not a scale step.** Page margins and section gaps may grow between two widths with `clamp(min, preferred, max)`; store the minimum in `$extensions` beside it. Component insets stay fixed.

| Step | rem | px | Typical use, through a role |
|---|---|---|---|
| `space.1` | 0.25 | 4 | Pairs in the block direction |
| `space.2` | 0.5 | 8 | Pairs in a row; items; compact insets |
| `space.3` | 0.75 | 12 | Compact component padding; a control's block padding |
| `space.4` | 1 | 16 | Groups; card and panel insets; small page margins |
| `space.5` | 1.25 | 20 | Control inline padding |
| `space.6` | 1.5 | 24 | Dialog insets; gutters |
| `space.8` | 2 | 32 | Sections; wide page margins |
| `space.10` | 2.5 | 40 | Sections on wide screens |
| `space.12` | 3 | 48 | Major breaks in long pages |
| `space.16` | 4 | 64 | Page-level breaks, marketing sections |

A project keeps the steps it uses; an unread step is removed (`design-system`'s every-token-read test).

## Roles

Roles name the relationship and the level, never the size. They're what components and layouts read; changing one role changes every place with that relationship, and nothing else.

| Role | Default | Relationship |
|---|---|---|
| `space.stack-pair` | `{space.1}` | Two things that read as one, stacked: label and field, field and hint, title and subtitle |
| `space.stack-item` | `{space.2}` | Items in one group, stacked: list rows that don't touch, fields in a fieldset |
| `space.stack-group` | `{space.4}` | Groups within a section; fields in a form |
| `space.stack-section` | `{space.8}` | Sections of a view; space above a section heading |
| `space.inline-pair` | `{space.2}` | Two things that read as one, side by side: icon and label, value and unit |
| `space.inline-item` | `{space.2}` | Items in one row: buttons in a group, tags, chips |
| `space.inline-group` | `{space.4}` | Groups in a row: toolbar groups, a footer's action groups |
| `space.inset-sm` | `{space.2}` | Inside compact containers: menus, tooltips, chips, list rows |
| `space.inset-md` | `{space.4}` | Inside cards, popovers, panels |
| `space.inset-lg` | `{space.6}` | Inside dialogs, sheets, page regions |
| `space.gutter` | `{space.6}` | Between columns and regions of a layout |
| `space.margin-page` | `{space.4}`, growing at breakpoints | Between content and the window edge |

**Inset shapes.** Most insets are even (the same on all sides). Two named variants, both as component tokens rather than roles: a **squish** inset (block smaller than inline: buttons, chips, list rows) and a **stretch** inset (block larger than inline: tall touch rows, text fields). Each is a pair of tokens (`c.button.padding-block`, `c.button.padding-inline`) aliasing roles or scale steps.

**Text-trimmed roles.** When the platform can't trim text boxes (`text-box`), a role next to text includes the half-leading in its value or gets a twin (`space.stack-pair-text`) whose description says so. Pick one approach per project and write it in the token's description.

## Rules between roles

The ratios from the skill hold between the roles' resolved values, in every density, and a token test checks them:

- `stack-pair` < `stack-item` < `stack-group` < `stack-section`, each at least 1.5 × the one before (2 × by default).
- `inline-pair` ≤ `inline-item` < `inline-group`, with `inline-group` at least 1.5 × `inline-item`.
- `stack-group` ≤ `inset-md` and `stack-group` ≤ `inset-lg`: groups fit inside cards and dialogs without breaking inner ≤ outer. Sections don't go inside enclosed containers; inside a dialog, a section is a heading or a divider at group spacing.
- `inset-sm` < `inset-md` < `inset-lg`.
- Every role aliases a scale step (or a `clamp()` whose minimum and maximum are scale steps).

## Component tokens

A component's spacing decisions are component tokens (`c.<component>.<part>-<property>`) that alias a role, and only where the component has a reason to differ: a button's squish padding, a list row's height, an icon offset. A family's shared decisions (every menu-like popup's item padding) are one group with `$extensions.owner: "shared"`.

```json
{
  "space": {
    "4": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" }, "$description": "4 base units (16 px at a 16 px root)" },
    "inset-md": { "$type": "dimension", "$value": "{space.4}", "$description": "Inside cards, popovers and panels" },
    "stack-group": { "$type": "dimension", "$value": "{space.4}", "$description": "Between groups within a section; between fields in a form" }
  },
  "c": {
    "card": {
      "$extensions": { "owner": "Card" },
      "padding": { "$type": "dimension", "$value": "{space.inset-md}", "$description": "A card's inset on every side" }
    }
  }
}
```

## Density

- **A context, like light and dark.** `tokens.density-compact.json` (and `-comfortable`) override **roles and component tokens only**, never the scale and never text sizes. The base set is the default density.
- **Applied by a selector or a person's setting**, not a media query: `[data-density="compact"]` on the root or a subtree, so one dense table can sit in a comfortable page. A token build that only knows media-query modifiers needs a selector option for this context; until it has one, write the density overrides as their own generated block under the selector.
- **What compact changes:** item and group stacks and insets step down one scale step (8 → 4, 16 → 12, 24 → 16); row and control heights step down by 4 px. **What it never changes:** text size, page margins at the smallest widths, targets (`size.control`, or 24 px on the listed dense surfaces; on touch, compact is turned off), the ratios above.
- **Compact on touch:** if the pointer is coarse (`@media (pointer: coarse)`), compact keeps touch targets at `size.control`; denser spacing between rows is fine, smaller targets aren't.

## Breakpoints and page margins

| Width | `space.margin-page` | `space.gutter` |
|---|---|---|
| Below `breakpoint.sm` | `space.4` (16 px) | `space.4` |
| `breakpoint.sm` to `breakpoint.lg` | `space.6` (24 px) | `space.6` |
| From `breakpoint.lg` | `space.8` (32 px), or the centred measure's leftover | `space.6` to `space.8` |

Write these as role values per breakpoint (or one `clamp()` between the smallest and largest), never as media queries in components: components read the role, the layout sets it.
