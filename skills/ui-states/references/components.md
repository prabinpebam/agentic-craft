# States by component

Each component whose value can change, with its rest, pending, confirmed and failed states, its scope and its lock. Timings are the skill's commit track: pending in the next frame and held at least `duration.confirm-min` (200 ms) or until a slower save ends, then confirmed, fully shown, at least `duration.confirm-min`; the lock ends when confirmed begins.

Shared anatomy:

- **Commit colour:** a semantic colour token (for example `color.commit`) for "this is being saved", distinct from focus and from error, at 3:1 against its background.
- **Trailing slot:** a fixed box at the inline end of a field, the size of an icon, holding the spinner, the tick or the error icon in turn, so nothing shifts.
- **Tick:** a green tick in a circle (`color.success`, at 3:1 against the field), drawn by a short stroke animation (`duration.base`), then held fully drawn for at least `duration.confirm-min` before it fades; with reduced motion it appears without drawing. The tick is decorative (`aria-hidden`); its text twin is a polite, named announcement ("Project name saved").
- **The same element throughout:** pending never unmounts or replaces the focusable element. A spinner that "replaces" a control is drawn inside the control's own box; the element keeps its role, name and focus, with `aria-disabled="true"` and `aria-busy="true"` while pending.
- **State attribute:** the component reads its state from one attribute set by the task tracker (`perceived-performance`): `data-busy="ack|on|done|failed"`. A commit goes straight to `on`; `ack` is for loads still inside their delay.

## Room for a mark or border-as-spinner

Choose by space, not by control type. This placement rule overrides the inline examples below when a control has no room.

| Space | Pending | Confirmed | Failed |
|---|---|---|---|
| **Room for a mark** (a field with free space at the inline end, a list row) | An inline spinner in a reserved slot | A tick in that slot | An error icon with Retry and the message |
| **No room** (segments of a segmented control, chips, small icon buttons, tiles, swatches, compact pills) | The element's own border becomes the spinner: an arc sweeping around its shape and radius, without replacing its content | The border turns the success colour for at least `duration.confirm-min` (200 ms) | The border turns the danger colour; Retry plus the message goes in the nearest place with room, never squeezed inside the element |

- **Timing:** pending starts in the next frame and holds at least `duration.confirm-min` (200 ms), or until the save ends; then the success border or tick holds at least `duration.confirm-min`. Locks end when confirmed begins.
- **Reduced motion:** a dashed or held border, no sweep; the same timing.
- **Accessibility:** `aria-busy="true"` while pending, the same status announcement as the inline case, and focus stays on the element. Keep its focus ring distinct from the state border. Border patterns or nearby status words convey the state beyond colour; a failure's nearby message is associated with the control.
- **Tokens:** reuse semantic commit, success and danger colours and the component's border width and radius tokens; arc length and sweep duration, if specified, are component tokens, never literal values in components.

## Text field and input, blur-commit

The value is saved when the field loses focus (or on Enter for a single-line field), with no Save button.

| State | What shows |
|---|---|
| Rest | The stored value |
| Editing | Normal focus ring; nothing is saved while typing |
| Pending | The border takes the commit colour; the field is momentarily locked (`aria-disabled`, input ignored, focus not moved); an inline spinner in the trailing slot |
| Confirmed | The green tick in a circle animates in, in the trailing slot, inside the field on the right; the border returns to rest and the field accepts input again; the tick fades after the beat |
| Failed | Error border and icon in the trailing slot; the person's value stays in the field; a line below says what happened, with **Retry** and **Revert** (to the last confirmed value); announced with `role="alert"` when focus has moved on, never by pulling focus back |
| Invalid | Validation runs before the save: error border, the reason below, nothing saved, the field stays editable and keeps the value |

- An unchanged value on blur saves nothing and shows nothing.
- Pressing Escape while editing restores the stored value without saving.
- A field that saves on every keystroke (a search box, a live filter) isn't a commit; it echoes and follows `perceived-performance`.
- Sensitive or hard-to-reverse values (a password, an address others will use, anything with a cost) use explicit save, never blur-commit.

## Text field and input, explicit save

The values are saved together by a Save button (a form, a dialog, a settings section).

| State | What shows |
|---|---|
| Dirty | The section marks unsaved changes (a dot on its title, "Unsaved changes" near Save); Save is enabled |
| Pending | Save is pending (see Buttons); the section's inputs are locked, because an edit now would be lost or ambiguous |
| Confirmed | Save shows a tick and "Saved"; each field that changed shows its tick for the beat; the section is clean |
| Failed | A message bar at the top of the section with what happened and Retry; each failing field marked with its reason; every value kept; focus moves to the message bar or the first failing field |

- Leaving a dirty section asks to save, discard or stay; it never discards silently.

## Switch

| State | What shows |
|---|---|
| Pending | A spinner replaces the switch, in the switch's own box, for at least the 200 ms beat; the switch element stays focused and locked, `aria-checked` still the stored value; under reduced motion a static busy mark |
| Confirmed | The switch returns showing the new value; `aria-checked` changes now |
| Failed | The switch shows the stored value again, an error icon beside it, and a line with what happened and Retry |

- A switch whose effect is slow (it starts a long operation) confirms the setting at once and shows the operation's own progress separately.
- **Decisions and trade-offs:** the spinner is a fixed rule of this skill and stays; it's drawn inside the switch element rather than swapped for a separate spinner element, because removing the focused element sends keyboard focus to the start of the page.

## Checkbox

Like the switch: a spinner replaces the box for the beat, then the new state. In a list of checkboxes saved one by one, each is its own scope; in a form with a Save button, a checkbox is just a field.

## Radio group and segmented control

The group holds one value, so the group is the scope.

| State | What shows |
|---|---|
| Pending | A spinner in place of the radio's dot; a compact segment's own border becomes the spinner; the whole group locked |
| Confirmed | The selection moves to the chosen option; a compact segment's success border holds for the beat |
| Failed | The selection stays on the stored option; a compact segment's border turns the danger colour; the message and Retry beside the group |

- **Keyboard and screen readers:** arrow keys select a radio as they read it, so a group saved on its own commits when focus leaves the group, or after a pause following the last arrow key (`duration.commit-pause`, 500 ms), never on each press. A click or a tap commits at once.
- A segmented control that only switches what's shown (a view filter, a tab) isn't a saved value and has no commit states.

## Select and dropdown

Choosing closes the list; the trigger then behaves like a blur-commit text field: the chosen label, the commit border, the lock, the trailing slot spinning, then the tick. A failure puts the last confirmed label back in the trigger, with the error below. A native select moved by arrow keys while closed commits when focus leaves it, like a radio group. A multi-select list commits with its own Save and Cancel, or when it closes, never on each tick.

## Combobox and async search

Two waits in one control: finding options (a load) and choosing one (a commit).

- **Typing** echoes at once and never locks. Option fetches start after a short pause in typing (a debounce, a token), and only the latest query's results are shown; a slower answer to an older query is dropped.
- **Finding options** follows the load track inside the open list: the previous results stay while new ones load (marked as updating past the delay); a first load past the delay shows a small spinner and "Searching…" in the list, not a skeleton.
- **Results** announce their count politely once they settle ("12 results"), not on every keystroke.
- **Nothing found** is an empty state inside the list: the query named, and a way on (Create "…", Search everywhere) when there is one.
- **A failed search** is an error inside the list with Retry; the typed text is kept.
- **Choosing** commits like a select: on choosing or on blur, never on each keystroke or each highlighted option.

## Date and time pickers

- Moving through the calendar grid by arrow keys or paging months highlights, never commits.
- A date commits when the person chooses one (click, tap, Enter) or, typed into the field, on blur after it parses; the trigger then shows the commit states like a field.
- An invalid or out-of-range typed date is a field validation error, the typed text kept; nothing is saved.
- A range commits when both ends are chosen, as one commit.

## Slider

- **Dragging** echoes the value locally (the thumb and the value label) at the frame rate; nothing is saved.
- **On release** (or after `duration.commit-pause` following the last arrow key), the value is committed: the value label shows a small spinner, the slider locks, then a tick beside the value for the beat.
- **Failed:** the thumb returns to the last confirmed value, with an error and Retry.

## Buttons and calls to action

For an explicit save, update, publish or send.

| State | What shows |
|---|---|
| Pending | A spinner in place of the button's icon (or before its label); the label in the present tense ("Saving…"); its width fixed; locked against a second press with `aria-disabled`, focus kept on it |
| Confirmed | A tick and the past tense ("Saved") for `duration.confirm-read` (about 1.5 s, long enough to read; never under the 200 ms beat), then rest |
| Failed | The button returns to rest; the error shows at the scope the button acts on (its section's message bar, or a pill for background work) |

- A destructive action follows [Destructive actions](#destructive-actions).
- An action that navigates away when it succeeds doesn't need a confirmed state; the new view is the confirmation.

## List and row actions

Rename, move, delete, archive, star, reorder: each row is its own scope.

| Action | Pending | Confirmed | Failed |
|---|---|---|---|
| Inline rename | Like a blur-commit field, inside the row | The row's tick | Like a field: value kept, Retry, Revert |
| Star, pin, mark | A spinner replaces the toggle icon | The new icon | The old icon, an error mark on the row, Retry |
| Delete, archive, move away | Optimistic: the row leaves at once, and a pill offers Undo; or pessimistic for anything costly: the row dims, its action slot spins, its actions lock | The row is gone; the pill with Undo (auto-dismiss, since Undo is also in history or a shortcut) | The row comes back in place, marked with the reason and Retry; a hard-dismiss pill if the row isn't visible |
| Reorder | See [Drag and reorder](#drag-and-reorder) | | |
| Bulk action | See [Multi-select and bulk actions](#multi-select-and-bulk-actions) | | |

- After a row leaves, focus moves to the next row, else the previous, else the empty state's action; a row that comes back on failure takes focus only if focus was lost.

## Drag and reorder

- **While dragging:** the item follows the pointer within a frame; a drop placeholder of the item's size shows where it will land, and the other items make room. Nothing is saved yet.
- **Keyboard:** a move command (a grab key, then arrows, or Move up and Move down actions) with each new position announced politely ("Moved to 3 of 8"); Escape cancels and puts the item back.
- **On drop:** optimistic: the item stays where it was dropped and its row shows a small pending mark in its action slot; nothing else locks, but the same item can't be dragged again until its move confirms.
- **Confirmed:** the mark goes; no tick or pill is needed, since the new order is the confirmation.
- **Failed:** the item animates back to its last confirmed place (instantly under reduced motion), marked with the reason and Retry; announced with `role="alert"`.
- **Concurrent:** if the list changed underneath (another person, another window), the move is applied to the current order or refused with the reason; never silently reverted.

## Multi-select and bulk actions

- **Selection** is local and never saved; the count of selected items shows beside the bulk actions ("12 selected").
- **Pending:** each affected row shows its own pending mark; a subtle progress line counts them ("Moving 12 of 40…"); rows not involved stay usable; the selection is locked only for the action's own items.
- **Confirmed:** the rows show the result (or leave, with focus moved as above); a pill with the count and Undo when they left the view.
- **Partial success:** what succeeded stays done; the items that failed stay selected and marked with their reasons, so Retry acts on the failures only ("18 of 20 moved. 2 couldn't be. Retry 2"); a hard-dismiss pill or a section message bar, never a success tick ([error model](errors.md#the-other-outcomes)).
- **Cancel** for a bulk action that runs long: what's done is kept and said ("Cancelled. 12 of 40 moved").

## Destructive actions

| The action can be… | Use | How |
|---|---|---|
| Undone (the item goes to trash, archive or history) | Undo, no confirmation | The action runs at once; a pill offers Undo; Undo stays reachable after the pill goes (a shortcut, trash or history). If it can't, the pill is hard-dismiss |
| Not undone (permanent delete, revoke, send, publish over) | A confirmation first | A dialog naming the thing and the consequence, its button repeating the verb (`ui-copy`); while the action runs, the button is pending and the dialog stays open; a failure shows inside the dialog with Retry; success closes it and confirms at the item's scope |

- Never both missing; never both for a reversible action (asking and then offering Undo is friction twice).
- An irreversible action applied to many items states the count in the confirmation ("Delete 12 projects permanently?").

## File and upload

- **Each file is a row:** name, size, a progress bar with its percentage, the current step ("Uploading · Processing · Checking"), and Cancel.
- **Confirmed:** each row's tick; the drop area stays usable for more files throughout.
- **Failed:** the row stays, with the reason in words, Retry and Remove; other files carry on; a summary counts both ("8 uploaded, 1 couldn't be").
- **Cancelled:** the row says so and offers to start again; already-uploaded files are kept unless the person chose to undo them.

## Long, multi-step operations

Anything over about 1 s with named stages: import, export, publish, sync, migrate, install, generate.

- **Where:** in place if the person is watching it (a panel, a row, a dialog's body); in the product's task list and ending in a pill when they can leave it. It never blocks unrelated work.
- **Progress:** an overall percentage when the total is known, or an indeterminate bar when it isn't; never both bars at once.
- **Step text:** one subtle line under the progress (secondary style, small), naming the step as it runs, updated as fast as the work moves and as fast as it stays legible ("Reading 214 files… · Resolving links… · Writing index… · Compressing 3 of 9…"). Technical names are welcome here; the line exists to show life, not to be studied. It isn't a live region: the progress bar's `aria-valuenow` and `aria-valuetext` carry the state, and the start and end are announced once. A Details disclosure may list the steps done.
- **Cancel** always, when the work can stop safely; it says what will be kept or rolled back.
- **Confirmed:** a tick in place and the result; a pill with Open when the person moved on.
- **Failed:** the step that failed named, what completed kept, Retry from that step, and Details with the technical record (copyable).

## Document and long-text autosave

A document, a message body or any long text the person types into continuously isn't a commit; it's a stream of edits.

- **Never locked, never a tick per save.** Typing is echoed locally and never waits; the momentary lock and the green tick are for discrete commits only.
- **Saved after a pause in typing** and on blur, on switching item and on closing, with the product's status line carrying the state (Unsaved → Saving… after the delay → Saved, `perceived-performance`).
- **Kept locally first,** so a crash, a closed window or going offline offers it back; offline, the status says "Saved on this device", never the plain "Saved".
- **Failed:** the text stays editable and kept; a message bar at the document's scope says what happened and offers Retry (with automatic retries meanwhile), and leaving or closing warns while changes are unsaved.
- **Conflict:** another copy changed underneath; never overwrite either; keep the person's version and offer Compare, Keep mine and Take theirs ([error model](errors.md#the-other-outcomes)).

**Decisions and trade-offs:** the field's momentary lock (a fixed rule) applies to a value whose edit has ended; applying it to continuous text would block typing, which `perceived-performance` forbids. So text that's still being written saves silently in the background, and the tick is kept for values the person has finished with.
