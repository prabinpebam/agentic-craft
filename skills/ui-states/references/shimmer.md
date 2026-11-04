# Shimmer (skeleton) loading for views and sections

A view or section whose content has a known shape loads as a skeleton: placeholder shapes in the real layout, with a light that passes across them a few times. It says "your content is coming, and this is where it will be" without a spinner in the middle of the page.

## When to use which indicator

| Indicator | Scope | Use when |
|---|---|---|
| **Shimmer skeleton** | View, section, card, list, table | Loading content whose shape is known (rows, cards, a profile, a document) |
| **Spinner** | Component or field | A small, short wait without a content shape: a control saving, a trailing slot, a button (the component states in [components](components.md)) |
| **Progress bar, steps** | Operation | Long or multi-step work where progress can be measured or named |
| **Nothing** | Any | The content arrives before the indicator delay; it's simply drawn |

- Never a skeleton for things that aren't content: buttons, inputs, switches, menus, notifications, dialogs themselves (a dialog's contents may be skeletons).
- A shape that can't be known (a free-form answer, a search across unknown kinds) uses a spinner or progress with words, not an invented skeleton.

## Shape: the real wrapper, the real layout

- **Same wrapper, same minimum size** as the populated content and as its [empty state](empty-states.md): loading, empty and populated all fill one box, so nothing shifts as the content arrives (cumulative layout shift of zero for that region).
- **Mimic the layout,** not the details: a row is an icon block and two lines; a card is a tile and two lines; a profile is a round picture and two lines. Leave out badges and small decorations.
- **Lines look like words:** a few fixed widths (full, long, medium, short) varied down a list, never identical bars.
- **The right count:** as many placeholder items as are likely to arrive, or as fill the visible area; never more than the visible area.
- **Known parts stay real.** Headings, labels, toolbars, column headers and navigation that don't depend on the data render as themselves at once; only the data is a skeleton.
- **Placeholder shapes are a primitive** (line, tile, avatar), sized by component tokens; views compose them, never draw their own.

## Timing

| Moment | Rule |
|---|---|
| Before showing | No skeleton for the first 300 ms (`duration.indicator-delay`); content that arrives in time is drawn directly. The view's frame and known parts show at once |
| Once shown | At least 500 ms (`duration.indicator-min`), so it never flashes. This is the load track; the 200 ms commit beat is for values the person changed, not for loads |
| The shimmer | One pass of about 1.5 s (`duration.shimmer`), a few passes (`count.shimmer-passes`, about 3), then the placeholders stand still: motion stays under 5 s (WCAG 2.2.2 Pause, Stop, Hide) |
| Past the motion | Placeholders stand still; the region's one status line carries the wait in words ("Loading your projects…") |
| Past 10 s | Say it's taking longer than usual, keep the placeholders, offer Cancel or Retry |
| Timeout | At a defined limit (the operation's own, often 15 to 30 s), stop and hand the region to the [error model](errors.md); a skeleton never stays forever |

## Progressive swap

- **Each section swaps in when its own data is ready,** complete, replacing its placeholders in place. Sections don't wait for the slowest, and a section never fills piecemeal item by item while the person reads it.
- **Keep the old content when there is some.** A refresh or a re-filter keeps the current content (marked as updating after 300 ms, `perceived-performance`'s stale-while-updating) and swaps when the new is complete; a skeleton is for a first load or a new item, not for every refresh.
- **Fetch together where possible,** so skeletons resolve in one swap rather than a cascade; when staggered, the shimmer of all visible placeholders stays in sync.
- **An empty or failed result replaces the placeholders** with the empty state or the error at that scope, never "No items" while loading.

## Animation

- **What moves:** a soft highlight gradient passes across each placeholder in the reading direction (left to right; right to left in right-to-left languages). The placeholder's own shape and colour never repaint.
- **How:** a transform-only overlay (`translateX`) on each placeholder, linear or standard easing, `duration.shimmer`, a finite iteration count, then none. Placeholders in one region move together.
- **Colours are tokens:** a fill, an edge and a highlight for the skeleton component, in light, dark and more contrast; the highlight is subtle, never a flash.
- **Reduced motion:** no shimmer at all, the placeholders static (a static shape is enough; a slow opacity pulse is acceptable only if the product's motion rules allow it).
- **Forced colours:** a plain system-colour shape (for example `GrayText`), no gradient.

## Accessibility

- **The region is busy:** `aria-busy="true"` on the loading view or section until its content is in, then removed.
- **Placeholders are hidden:** each skeleton shape is `aria-hidden="true"`, not focusable, with no accessible name.
- **One status, said once:** the region carries one status in words ("Loading your projects…"), visible or in the polite live region, announced once at the start; the content's arrival is announced only when it isn't where focus is or the wait was long.
- **Focus stays put:** loading never moves focus; a control in a loading region keeps its accessible name and says it's loading if focused.

## Skeleton versus empty-state silhouette

They both preview the content's shape, so they must never be confused:

| | Loading skeleton | Empty-state silhouette |
|---|---|---|
| Means | Content is on its way | Nothing here yet; this is what would appear |
| Fill | Solid neutral placeholders in the full layout | Faint, low-contrast outline or fill, a few items fading out |
| Motion | A shimmer for a few passes, then still | Never |
| Words | One status about the wait; no message or action in the placeholders | A reason and a next action, always |
| Region | `aria-busy="true"` | Not busy; the message is read normally |
| Ends | Replaced by content, the empty state or the error | Replaced by the first content |
