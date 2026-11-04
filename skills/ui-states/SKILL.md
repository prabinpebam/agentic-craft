---
name: ui-states
description: Use when adding or changing anything whose value can change (a field, a switch, a choice, a slider, a save button, a list action, an upload, a long operation) or anything that can fail. Decides where a loading, saving, success or error state lives (app, view, section, component or field), how each component shows pending, confirmed and failed, the timing (every committed change confirmed for at least 200 ms, even when instant), subtle step and percentage progress, the bottom notification pill (auto-dismiss or hard-dismiss, one line, three at most), and the error model - scoped, transparent, never losing input, always with a way to recover.
---

# UI states: every change confirmed, every failure recoverable

A person who changes something must see that it took. Rename a project in settings and see nothing happen, and they go looking for a Save button that isn't there. Every value that can change has a pending, a confirmed and a failed state, shown on the thing that changed, and every failure says what happened and offers a way back.

## Where this sits

| Skill | Owns |
|---|---|
| `perceived-performance` | How long a wait is (its class), the patterns for loads and redraws (skeletons, stale while updating), never blocking input, the one status line |
| **`ui-states`** (this) | Where a state lives (its scope), what each component looks like pending, confirmed and failed, the 200 ms confirmation, step and percentage progress, the notification pill, errors and recovery |
| `ui-copy` | The words in every state |
| `design-system` | The states built into components, their timing and colour as tokens |

## The rules

These hold even where common guidance differs; the trade-offs are recorded in [sources](references/sources.md#where-these-rules-differ-from-common-guidance).

1. **Every committed change is confirmed where it happened.** A component whose value can change has pending, confirmed and failed states built in. The confirmation is on the component, not only in a status line or a notification.
2. **Confirmation shows for at least 200 ms, even when the save is instant.** A change that lands in 5 ms still plays its pending and confirmed states for 200 ms. A slower save keeps the pending state until it ends. The beat is deliberate and always the same, so it reads as "done", never as flicker.
3. **Scope the state to the smallest independent unit.** Lock and show only what the change affects and what a concurrent edit could corrupt. Everything else stays usable. Blocking the whole app is extremely rare and needs a written reason.
4. **Show what's happening: steps, and a percentage when it's known.** People mind not knowing more than waiting. Step text is subtle (small, secondary, beside the work), never prominent, and the more granular and rapidly changing it is, the better. Technical step names are welcome there.
5. **One notification pill, at the bottom.** For outcomes that aren't visible where the person is. It's auto-dismiss or hard-dismiss, one line normally and at most three in exceptional cases.
6. **Errors are scoped like loading, transparent, and always recoverable.** Each error shows at the scope it affects, says what happened, why, what was kept and what to do, and offers at least one recovery action. Input is never lost.
7. **Be true.** "Saved" means stored where it's going. An optimistic state is allowed only when a failure puts it back and says so (`perceived-performance`).

## Choosing the scope

Ask two questions of every change: **what does it affect** (its blast radius), and **can another edit, made before it lands, corrupt it or be corrupted by it?** Start at the smallest scope and widen only for a real conflict.

| Scope | Use when | Locked while pending | Where the state shows |
|---|---|---|---|
| **Field** | One value saved on its own (a name, a URL, a number) | That field | Its border, its trailing slot, the line below it |
| **Component** | One control's value (a switch, a choice group, a slider, a row's action) | That control (a radio or segmented group as one) | The control itself, in its own box |
| **Section** | Values that must be valid or saved together (an address, a form with a Save button, a connected pair) | The section's inputs and its action | The section's action and a message bar at its top |
| **View** | The view's data is being replaced (opening, refreshing, switching the item shown) | Nothing the person is using; content swaps when ready (`perceived-performance`) | The view's content area; its header and navigation stay live |
| **App** | The ground under everything changes (switching account or data store, restoring a backup, migrating data) | Everything, with a reason | A full-window state with steps and a percentage |

- **Lock only what conflicts.** A save button locks its section's fields, because an edit during the save would be lost or ambiguous. Toggling one switch locks that switch, not its neighbours.
- **App-level blocking needs a written reason** in the spec, naming the corruption it prevents. "It was easier" isn't one.
- **Background work has no visible scope.** It shows in the place the product keeps tasks (if any) and ends in a notification pill.

## Timing

| Moment | Rule |
|---|---|
| Acknowledge | Within 100 ms the control shows its pending state (`perceived-performance`) |
| A committed change (field, switch, choice, slider, save button) | Pending at once, no delay; pending and confirmed together last **at least 200 ms**; a slower save stays pending until it ends, then confirms |
| A load or redraw (a view, a region, a list) | `perceived-performance`'s delay: no indicator for the first 300 ms, then at least 500 ms once shown |
| Words in a confirmation | A label that changes to words ("Saved") holds long enough to read, about 1.5 s; a tick alone may go after 200 ms |
| Steps | Show step text for any operation with two or more stages or likely to pass 1 s; update it as often as the work moves |
| Percentage | Show it when the total is known (bytes, items, steps); show both steps and percentage when both are known; never a fake percentage |
| Slow | Past 10 s with no progress, say it's taking longer than usual and offer to cancel or keep waiting |
| Notification pill | About 6 s for one line, 8 s for two or three; paused on hover, on keyboard focus and while the window is in the background |

Timings are tokens (`duration.confirm-min`, `duration.indicator-delay`, `duration.indicator-min`, `duration.notice`), never literals in components.

## States by component

Every component whose value can change has these states; the [component reference](references/components.md) has the full detail.

| Component | Pending | Confirmed | Failed |
|---|---|---|---|
| **Text field, blur-commit** | The border takes the commit colour; the field is momentarily disabled; a small spinner in the trailing slot when the save outlasts the beat | A green tick in a circle animates in on the right, inside the field | Error border and icon; the person's value kept; a message below with Retry and Revert |
| **Text field, explicit save** | Its section's Save button is pending; the fields are locked | The button shows a tick and "Saved"; each changed field shows its tick | The section's message bar and each failing field's message; values kept |
| **Switch, checkbox** | A spinner replaces the control in its own box | The control shows the new value | It shows the stored value again, with an error icon and a Retry |
| **Radio, segmented control** | A spinner in the chosen option; the group is locked | The selection moves to the chosen option | The selection stays on the stored option, with an error and a Retry |
| **Select, dropdown** | Like the text field: commit border, locked, the trailing slot spins | The tick in the trailing slot | Like the text field |
| **Slider** | Echoes while dragging; on release, the value label spins and the slider locks | A tick beside the value | The thumb returns to the stored value, with an error and a Retry |
| **Button, call to action** | A spinner in place of its icon, the label in the present tense, its width fixed, disabled | A tick and the past tense | Back to rest, with the error at the section's scope |
| **List or row action** | The row's action slot spins; the row's other actions lock | The row shows the result; a pill only if it left the view (with Undo) | The row is restored and marked, with its reason and a Retry |
| **File, upload** | Each file's row: progress, percentage, steps, Cancel | Each row's tick | The failed row stays, with its reason, Retry and Remove; the rest carry on |
| **Long, multi-step operation** | Subtle step text that changes as each step runs, a percentage when known, Cancel | A tick in place, or a pill if the person has moved on | The failing step named, what completed kept, Retry from that step |

**Explicit save or save on change.** Save each value on its own (blur-commit) when it stands alone and is easy to change back. Use an explicit Save when values must be valid together, a change is costly, slow, sensitive or seen by others, or a draft needs review. Never mix the two in one section.

## The notification pill

One global pill at the bottom of the window, for outcomes not visible where the person is: background work finished, a change that left the view, an undo window, a failure with no visible home. Never for a field's save (its tick says it) or a validation error (it belongs on the field). Full spec: [notification pill](references/notification-pill.md).

- **Auto-dismiss** for information the person can do without, and for actions also reachable elsewhere (Undo is also a shortcut or in history).
- **Hard-dismiss** for errors, warnings that need a decision, partial success, and any message whose action exists nowhere else. It stays until closed or resolved.
- **One line normally; at most three** for the exceptional case (a partial success, an error's reason). Longer goes behind Details.
- **One at a time per subject:** a new message about the same subject updates the pill in place; hard-dismiss pills stack (at most three visible, then a count).

## Errors and recovery

Errors follow the same scopes as loading. Each one is **transparent** (what happened, why if known, what was kept, what to do) and **recoverable** (at least one action: Retry, Undo, Revert, Edit, Details, Report, Reconnect, or Keep mine and Take theirs). Input is never lost. The [error model](references/errors.md) covers presentation by scope, recovery actions, and the success, partial-success, offline, conflict and cancelled states.

## Accessibility and motion

- **Busy regions:** `aria-busy="true"` on the scope being updated, only that scope, only while pending.
- **Momentary lock keeps focus:** lock with `aria-disabled="true"` and ignore input, never with `disabled`, which drops keyboard focus.
- **Announcements:** one polite live region (`role="status"`) for confirmations and progress; announce the start and the end, not each step. `role="alert"` only for an error that needs attention away from focus. Field errors are tied with `aria-invalid` and `aria-describedby`. A live region exists before its text changes (WCAG 4.1.3).
- **Not colour alone:** the commit colour has the tick or spinner as its twin, the error colour an icon and words (1.4.1); borders, ticks and icons reach 3:1 contrast (1.4.11).
- **Timing adjustable:** auto-dismiss pauses on hover, focus and window blur; nothing essential lives only in an auto-dismissing pill; the product offers a way to keep notifications until dismissed (2.2.1).
- **Reduced motion:** the tick appears without drawing itself, the pill fades rather than slides, and a spinner slows or becomes a static busy icon with text. The 200 ms minimum still holds; step text still changes.
- **No layout shift:** a spinner, tick or icon takes the box of what it replaces; a button keeps its width.

## Copy

The words follow `ui-copy`. The slots: pending in the present tense ("Saving…"), confirmed in the past ("Saved"), step text as the step's own name ("Resolving references… · Writing 3 of 12…", technical words welcome in this subtle line only), errors as what happened, why, what was kept and the action ("Couldn't save the name. You're offline; your text is kept. Retry"), pills as one fact and one optional action.

## Making it enforceable

Write tests for the mechanical rules, at the level the project already tests components:

- every component whose value can change has stories or fixtures for pending, confirmed and failed, in light, dark and more contrast;
- with a save that resolves at once, the confirmed state is visible for at least `duration.confirm-min`;
- with a save that fails, the input keeps the person's value and a recovery action is focusable;
- a lock uses `aria-disabled`, and focus stays on the locked control;
- notification pills: error and partial-success variants never auto-dismiss, text is clamped to three lines, the timer pauses on hover and focus;
- no full-window blocking state outside a written list of app-scope operations.

## Review checklist

- [ ] Every value that can change has pending, confirmed and failed states on the component itself
- [ ] Confirmation lasts at least 200 ms, even for an instant save; nothing flickers
- [ ] The scope is the smallest independent unit; any app-level block has a written reason
- [ ] Field: commit-colour border, momentary lock, green tick in a circle animating in on the right
- [ ] Switch and checkbox: a spinner replaces the control momentarily
- [ ] Steps or a percentage wherever known; the step line subtle and live
- [ ] Notification pill at the bottom: the right dismissal, one line (three at most), never the only home of something essential
- [ ] Every error scoped, transparent, with at least one recovery action; input kept
- [ ] Success, partial success, offline, conflict and cancelled states designed, not left to chance
- [ ] Focus kept through locks; one polite live region; reduced motion honoured

Status that's visible (H1), errors that say how to recover (H9) and preventing errors (H5) are the [usability heuristics](../craft/references/usability-heuristics.md) this skill carries most; check them with the rest when the view is reviewed.
