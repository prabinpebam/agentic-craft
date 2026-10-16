# Enforcing the design system

One test file (or a few) that reads the source and fails on any break of the rules. Write it in the project's test runner; the checks are plain file reading and regular expressions, plus a CSS parser for declarations.

| Check | How |
|---|---|
| **No raw values** in component styles | Parse every declaration (PostCSS or a small parser); a value with a colour literal, a `px`/`rem`/`ms` number, or a named colour, outside an allow-list (`0`, `1`, `100%`, `1em`, `auto`, `currentColor`, `inherit`, quarter turns), fails. Name the file and declaration |
| **No primitives** in components | No `var(--p-` outside the token build and the library's token pages |
| **Owned token groups** | For each `var(--c-<group>-…)` in a file, the group's owner is that component or `shared` |
| **Every token read** | Every generated custom property appears in some style, script or token alias |
| **Stale output** | Run the token build with `--check`; also for icons and fonts if generated |
| **Tiers** | Parse imports: a fundamental imports no component; a compound no compound; a layout no layout; views import only layouts and components |
| **Sealed fundamentals** | A fundamental's props have no `class` or `style` |
| **Docs and stories** | Each component has the doc comment with summary, `@tier`, at least one `@a11y`; every prop has a comment; a story exists with at least one example; no orphan story |
| **Size limit** | A component file over its limit fails, naming it |
| **Views carry no styles** | No `<style>` or style attribute in the views folder |
| **Contrast** | Resolve every text role against every surface in every context: ≥ 4.5:1; outlines, focus ring, checked fills ≥ 3:1; the more-contrast context ≥ 7:1 for muted text |
| **Hover is an enhancement** | Every `:hover` selector is inside `@media (hover: hover)` and has an `:active` twin |
| **Breakpoints** | Every width `@media` uses a breakpoint token's value; no rem literal in `matchMedia` or `sizes` |
| **No global escapes** | `:global` or unscoped styles only in the named allow-list of components that style markup they didn't write |
| **Scripts per instance** | Client scripts set up instances through the shared helper and pass a signal to global listeners |
| **Copy** | See the `ui-copy` skill's mechanical rules |

And in the browser (end-to-end):

- axe in light, dark and more contrast on the library and every layout;
- no horizontal scroll at 320, 360 and 430 px wide and on a phone on its side;
- targets at least 44 px;
- a screenshot per component state looked at once, then held by the anatomy test.
