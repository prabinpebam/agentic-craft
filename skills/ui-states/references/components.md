# States by component

Each component whose value can change, with its rest, pending, confirmed and failed states, its scope and its lock. Timings are the skill's: pending at once, pending and confirmed together at least `duration.confirm-min` (200 ms) even for an instant save, a slower save pending until it ends.

Shared anatomy:

- **Commit colour:** a semantic colour token (for example `color.commit`) for "this is being saved", distinct from focus and from error, at 3:1 against its background.
- **Trailing slot:** a fixed box at the inline end of a field, the size of an icon, holding the spinner, the tick or the error icon in turn, so nothing shifts.
- **Tick:** a green tick in a circle (`color.success`), drawn by a short stroke animation (`duration.base`); with reduced motion it appears without drawing.
- **State attribute:** the component reads its state from one attribute set by the task tracker (`perceived-performance`), for example `data-busy="on|done|failed"`, and styles each with its own tokens.

## Text field and input, blur-commit

The value is saved when the field loses focus (or on Enter for a single-line field), with no Save button.

| State | What shows |
|---|---|
| Rest | The stored value |
| Editing | Normal focus ring; nothing is saved while typing |
| Pending | The border takes the commit colour; the field is momentarily locked (`aria-disabled`, input ignored, focus not moved); if the save outlasts the 200 ms beat, a small spinner in the trailing slot |
| Confirmed | The green tick in a circle animates in, in the trailing slot, inside the field on the right; the border returns to rest; the tick fades after the beat |
| Failed | Error border and icon in the trailing slot; the person's value stays in the field; a line below says what happened, with **Retry** and **Revert** (to the stored value) |
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
| Pending | A spinner replaces the switch, in the switch's own box, for at least the 200 ms beat; the switch is locked |
| Confirmed | The switch returns showing the new value |
| Failed | The switch shows the stored value again, an error icon beside it, and a line with what happened and Retry |

- A switch whose effect is slow (it starts a long operation) confirms the setting at once and shows the operation's own progress separately.

## Checkbox

Like the switch: a spinner replaces the box for the beat, then the new state. In a list of checkboxes saved one by one, each is its own scope; in a form with a Save button, a checkbox is just a field.

## Radio group and segmented control

The group holds one value, so the group is the scope.

| State | What shows |
|---|---|
| Pending | A spinner inside the chosen option (in place of the radio's dot, or beside the segment's label); the whole group locked |
| Confirmed | The selection moves to the chosen option |
| Failed | The selection stays on the stored option; an error and Retry beside the group |

- **Keyboard and screen readers:** arrow keys select a radio as they read it, so a group saved on its own commits when focus leaves the group, or 500 ms after the last arrow key, never on each press. A click or a tap commits at once.
- A segmented control that only switches what's shown (a view filter, a tab) isn't a saved value and has no commit states.

## Select and dropdown

Choosing closes the list; the trigger then behaves like a blur-commit text field: the chosen label, the commit border, the lock, the trailing slot spinning if needed, then the tick. A failure puts the stored label back in the trigger, with the error below. A combobox commits on choosing or on blur, never on each keystroke. A native select moved by arrow keys while closed commits when focus leaves it, like a radio group. A multi-select list commits with its own Save and Cancel, or when it closes, never on each tick.

## Slider

- **Dragging** echoes the value locally (the thumb and the value label) at the frame rate; nothing is saved.
- **On release** (or 500 ms after the last arrow key), the value is committed: the value label shows a small spinner, the slider locks, then a tick beside the value for the beat.
- **Failed:** the thumb returns to the stored value, with an error and Retry.

## Buttons and calls to action

For an explicit save, update, publish or send.

| State | What shows |
|---|---|
| Pending | A spinner in place of the button's icon (or before its label); the label in the present tense ("Saving…"); its width fixed; locked against a second press |
| Confirmed | A tick and the past tense ("Saved") for about 1.5 s (long enough to read; never under the 200 ms beat), then rest |
| Failed | The button returns to rest; the error shows at the scope the button acts on (its section's message bar, or a pill for background work) |

- A destructive action confirms first (`ui-copy`) or offers Undo after; never both missing.
- An action that navigates away when it succeeds doesn't need a confirmed state; the new view is the confirmation.

## List and row actions

Rename, move, delete, archive, star, reorder: each row is its own scope.

| Action | Pending | Confirmed | Failed |
|---|---|---|---|
| Inline rename | Like a blur-commit field, inside the row | The row's tick | Like a field: value kept, Retry, Revert |
| Star, pin, mark | A spinner replaces the toggle icon | The new icon | The old icon, an error mark on the row, Retry |
| Delete, archive, move away | Optimistic: the row leaves at once, and a pill offers Undo; or pessimistic for anything costly: the row dims, its action slot spins, its actions lock | The row is gone; the pill with Undo (auto-dismiss, since Undo is also in history or a shortcut) | The row comes back in place, marked with the reason and Retry; a hard-dismiss pill if the row isn't visible |
| Reorder | Optimistic: the row moves at once | Nothing more | The row returns to its place, with the reason |
| Bulk action | Each affected row shows its own pending; a progress line with the count ("Moving 12 of 40…") | A pill with the count | Partial success (see the error model) |

## File and upload

- **Each file is a row:** name, size, a progress bar with its percentage, the current step ("Uploading · Processing · Checking"), and Cancel.
- **Confirmed:** each row's tick; the drop area stays usable for more files throughout.
- **Failed:** the row stays, with the reason in words, Retry and Remove; other files carry on; a summary counts both ("8 uploaded, 1 couldn't be").
- **Cancelled:** the row says so and offers to start again; already-uploaded files are kept unless the person chose to undo them.

## Long, multi-step operations

Anything over about 1 s with named stages: import, export, publish, sync, migrate, install, generate.

- **Where:** in place if the person is watching it (a panel, a row, a dialog's body); in the product's task list and ending in a pill when they can leave it. It never blocks unrelated work.
- **Progress:** an overall percentage when the total is known, or an indeterminate bar when it isn't; never both bars at once.
- **Step text:** one subtle line under the progress (secondary style, small), naming the step as it runs, updated as fast as the work moves and as fast as it stays legible ("Reading 214 files… · Resolving links… · Writing index… · Compressing 3 of 9…"). Technical names are welcome here; the line exists to show life, not to be studied. A Details disclosure may list the steps done.
- **Cancel** always, when the work can stop safely; it says what will be kept or rolled back.
- **Confirmed:** a tick in place and the result; a pill with Open when the person moved on.
- **Failed:** the step that failed named, what completed kept, Retry from that step, and Details with the technical record (copyable).
