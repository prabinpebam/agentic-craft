# Empty states

An empty container is a state to design, not an absence. Left bare, it breaks the layout meant for the populated content and leaves the person guessing whether it's loading, broken or simply empty.

## The layout rule

- **The same wrapper.** The empty state renders inside the wrapper the content uses: the card, the panel, the list frame, the table frame, the grid tile. Its border, background, heading and toolbar stay where they are; only the content area changes.
- **The wrapper's own minimum size.** Each wrapper that can be empty defines a minimum width and height as component tokens (for example `c.card.min-height`, `c.list.min-height`, `c.panel.min-inline-size`), chosen for its populated content. The empty state holds that size; the wrapper never collapses to the height of one line of text.
- **No layout shift when content arrives.** The first item replaces the empty state in place, with neighbours unmoved (cumulative layout shift of zero for that region). Content leaving (the last item deleted) returns the empty state in place, the same way.
- **The skeleton, the silhouette and the content share one box.** Loading (skeleton), empty (silhouette and message) and populated all occupy the wrapper at its minimum size, so the sequence loading → empty or loading → content never jumps.
- **Controls that fix it stay.** A list's search box, filters and Add button remain visible in the empty state; they're how the person gets out of it.

## Silhouette versus loading skeleton

Both preview the shape of the expected content, so they must never be mistaken for each other. The silhouette is faint, never moves, and always comes with a reason and an action; the loading skeleton is solid, shimmers for a few passes, carries only a status about the wait, and marks its region busy. The full comparison is in [shimmer loading](shimmer.md#skeleton-versus-empty-state-silhouette).

A silhouette is optional, one way to show what's expected; the message isn't optional.

## Kinds of empty state

| Kind | Shows | Call to action | Playful message? |
|---|---|---|---|
| **First use, never populated** | What will appear here and what it's for; a silhouette of the first items | The one action that creates or imports the first item; a secondary "Learn how" link at most | Yes: welcoming and light |
| **Cleared by the person** | That it's clear, and where the items went (archive, trash) | Undo while the window lasts; Open archive | Yes: a brief, quirky line is fine |
| **No results from a search or filter** | The query and the active filters, named ("No projects match "budget" in Archived") | Clear filters, Edit search, Search everywhere; suggestions for near matches | No: plain and useful |
| **No permission or access** | That it exists but isn't visible to this person, why when known, and who controls access | Request access, Switch account, Go back | No |
| **Offline or failed to load** | An error at this scope ([error model](errors.md)): what happened, what was kept (cached items shown if any), what still works | Retry, Reconnect, Details | No; and never shown as "empty", which would be a lie |
| **All done, zero as success** | The achievement ("All caught up", "No problems found"), with when it was last checked | None needed; an optional next place to go | Yes: a short celebration, once |

- **When there's nothing else to say,** a light, quirky line beats a blank. It still never replaces the reason when there is one.
- **Never playful about a failure, a permission, or a search the person needs.** Those are plain.
- **One primary action at most;** several empty widgets on one screen use quiet (tertiary) actions so the screen doesn't fill with primary buttons.
- **Don't fake emptiness.** An unknown state (still loading, failed) is never shown as "No items".

## By scope

| Scope | Size of the empty state | Contents |
|---|---|---|
| **App** (the very first run, nothing set up) | The main content area, with the app's frame and navigation present | What the product does here, the first step, a silhouette of the main view; never a blank window |
| **View** | The view's content area; header, navigation and tools present | Heading, reason, one action, optional illustration or silhouette |
| **Section or card** | The card at its minimum size | A short line and a quiet action; a small silhouette if it fits; no large illustration |
| **Component** (a menu, a picker, a dropdown, a side list) | The component's own minimum size | One line ("No recent files") and, if useful, one action ("Browse…") |
| **List or table cell** | The cell | A dash or a few words ("No due date", "—" with an accessible name "None"); never an illustration |
| **Table** | The table frame at its minimum height; toolbar and filters kept | One message row spanning every column, or the frame's content area replaced when there are no columns to show yet |

Many empty containers at once (a new dashboard) stay quiet: text and silhouettes, no repeated illustrations, and one primary action on the screen.

## Accessibility

- **Announce only what the person caused.** A search or filter that ends empty announces its result through the polite live region ("No results for "budget""); a view opened empty isn't announced, since its heading and message are read in order.
- **Silhouettes are decorative:** `aria-hidden="true"` (or an empty `alt`), out of the tab order. An illustration that carries meaning gets alternative text; a decorative one gets none.
- **Read the message, not the frame.** Put the empty message where a screen reader meets it first: in a table, a single row whose cell spans every column, with the column headers kept only when the toolbar's sort or filter makes them useful; otherwise the message replaces the table body and headers.
- **Focus:** after the person clears a list (deleting the last item), focus moves to the empty state's action or heading, never to the document's start.
- **Contrast:** the silhouette may be faint because it's decorative; the message and action meet text contrast (4.5:1) and controls 3:1.

## Copy

Follow `ui-copy`'s empty-state row: what will be here, and the one action to start. Headline names the state ("No projects yet", "No projects match "budget"", "All caught up"); the line below gives the reason and the next step; the button is a verb ("Create a project", "Clear filters"). A quirky line is fine where the table above allows it, in the product's own voice, and never at the expense of the reason.
