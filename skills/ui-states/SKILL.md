---
name: ui-states
description: Use when adding or changing anything whose value can change, that loads, that can fail or that can be empty - a field, a switch, a choice, a slider, a save button, a list or bulk action, drag to reorder, an upload, a long operation, a toast or snackbar, a spinner or skeleton, an error message, an empty list. Decides where each loading, saving, success, error and empty state lives (app, view, section, component or field), what it looks like, its timing and what it announces - every committed change confirmed for at least 200 ms, shimmer skeletons for views and sections, one bottom notification pill (auto-dismiss or hard-dismiss, one line, three at most), errors that keep input and always offer a recovery, and empty states in the content's own wrapper that say why and what to do.
---

# UI states: every change confirmed, every failure recoverable

A person who changes something must see that it took. Rename a project in settings and see nothing happen, and they go looking for a Save button that isn't there. Every value that can change has a pending, a confirmed and a failed state, shown on the thing that changed; every failure says what happened and offers a way back; every container that can be empty says why.

This file is the contract; the detail is in the references: [components](references/components.md), [errors](references/errors.md), [notification pill](references/notification-pill.md), [shimmer loading](references/shimmer.md), [empty states](references/empty-states.md), [focus, announcements and motion](references/accessibility.md), [enforcement](references/enforcement.md), and [sources and trade-offs](references/sources.md). The wait's class, the load patterns and the status line belong to `perceived-performance`; the words to `ui-copy`; the components and their tokens to `design-system`.

## The rules

These hold even where common guidance differs; each trade-off is in [sources](references/sources.md#where-these-rules-differ-from-common-guidance).

1. **Every committed change is confirmed where it happened.** A component whose value can change has pending, confirmed and failed states built in, on the component, not only in a status line or a notification.
2. **Confirmation shows for at least 200 ms, even when the save is instant.** Pending shows at once and holds at least 200 ms (or until a slower save ends); then the confirmed state holds at least 200 ms. The beat is deliberate and always the same, so it reads as "done", never as flicker.
3. **Scope the state to the smallest independent unit.** Lock and show only what the change affects and what a concurrent edit could corrupt. Everything else stays usable. Blocking the whole app is extremely rare and needs a written reason.
4. **Show what's happening: steps, and a percentage when it's known.** Step text is subtle (small, secondary, beside the work), never prominent; the more granular and rapidly changing, the better. Technical step names are welcome there.
5. **One notification pill, at the bottom.** For outcomes that aren't visible where the person is. It's auto-dismiss or hard-dismiss, one line normally and at most three in exceptional cases.
6. **Errors are scoped like loading, transparent, and always recoverable.** Each error shows at the scope it affects, says what happened, why, what was kept and what to do, and offers at least one recovery action. Input is never lost.
7. **Be true.** "Saved" and the green tick mean stored where it's going. An optimistic state is allowed only when a failure puts it back and says so.
8. **Empty is never left empty.** An empty state fills the same wrapper the content uses, at that wrapper's defined minimum width and height, so the layout holds. It always says why it's empty and what to do to see the content, or a light, quirky message if there's nothing else to say. A subtle silhouette of the expected content is one way to show it.

## How to apply it

For every element that can change, load, fail or be empty:

1. **Name the event:** a *commit* (the person changed a value), a *load* (data arriving), an *operation* (long or multi-step work), an *outcome* away from where the person is, or *empty*.
2. **Choose the scope** (below): the smallest unit the event affects and a concurrent edit could corrupt.
3. **Choose the pattern:** the component's states ([components](references/components.md)); for a load, a shimmer skeleton for a view or section of known shape, a spinner at component or field scope; for an outcome away from view, the pill.
4. **Apply the timing track** (below) through the tokens.
5. **Design failure, empty and recovery at the same scope** ([errors](references/errors.md), [empty states](references/empty-states.md)).
6. **Write the words and the announcements:** the copy slots, the focus rule and the live region (below).

## Choosing the scope

Ask of every change: **what does it affect**, and **can another edit, made before it lands, corrupt it or be corrupted by it?** Start at the smallest scope; widen only for a real conflict.

| Scope | Use when | Locked while pending | Where the state shows |
|---|---|---|---|
| **Field** | One value saved on its own (a name, a URL, a number) | That field | Its border, its trailing slot, the line below it |
| **Component** | One control's value (a switch, a choice group, a slider, a row's action) | That control (a radio or segmented group as one) | The control itself, in its own box |
| **Section** | Values that must be valid or saved together (a form with a Save button) | The section's inputs and its action | The section's action and a message bar at its top |
| **View** | The view's data is being replaced (opening, refreshing, switching item) | Nothing the person is using; content swaps when ready | The view's content area; header and navigation stay live |
| **App** | The ground under everything changes (switching account or data store, restoring a backup, migrating data) | Everything, with a reason | A full-window state with steps and a percentage |

- **Lock only what conflicts, only while pending.** A Save button locks its section's fields; toggling one switch locks that switch, not its neighbours. The lock ends when the confirmed state begins.
- **Never lock continuous text.** A document or long text that autosaves while the person types is never locked and gets no tick per save; its state is the status line's ([components](references/components.md#document-and-long-text-autosave)).
- **App-level blocking needs a written reason** in the spec, naming the corruption it prevents.
- **Background work has no visible scope.** It shows where the product keeps tasks (if any) and ends in a notification pill.

## Timing: one model, three tracks

| Track | For | Starts | Holds | Ends |
|---|---|---|---|---|
| **Commit** | A value the person changed: field, switch, choice, slider, Save button, row action | Pending in the next frame, no delay | Pending at least `duration.confirm-min` (200 ms), or until a slower save ends; steps past 1 s; past 10 s, say it's taking longer and offer Cancel or keep waiting | Confirmed, fully shown, at least `duration.confirm-min`; a label in words ("Saved") about `duration.confirm-read` (1.5 s); failed until resolved |
| **Load** | Data arriving: a view, a section, a list, a region | Nothing for `duration.indicator-delay` (300 ms); content that beats it is drawn directly | At least `duration.indicator-min` (500 ms) once shown; a shimmer of `count.shimmer-passes` × `duration.shimmer` (3 × 1.5 s), then still; past 10 s, say so | The content, the empty state or the error at that scope; at its timeout, the error |
| **Outcome** | The notification pill | When the outcome is known | Auto-dismiss: `duration.notice` (6 s) for one line, `duration.notice-long` (8 s) for two or three, paused on hover, focus and while the window is in the background; hard-dismiss: until closed or resolved | Removed, or updated in place by a newer message on the same subject |

- **Two channels, two clocks.** The changed control's own state never waits; the product's status line ("Saving…", `perceived-performance`) keeps the load delay. A commit that also redraws a region runs both: the control on the commit track, the region on the load track.
- **Within 100 ms** every action shows something (`perceived-performance`); the commit track's next-frame pending meets it.
- **Percentages only from a real total** (bytes, items, steps); show both steps and a percentage when both are known; never a fake one.
- **Arrow keys never commit on each press:** a radio group, a closed select and a slider commit when focus leaves or after `duration.commit-pause` (500 ms) without a key.
- Timings are tokens, never literals in components.

**Decisions and trade-offs.** Pending and confirmed each hold the 200 ms beat, rather than sharing it: under a shared beat a switch's spinner could show for a frame, which is the flicker the rule exists to stop, and a switch's spinner must hold at least 200 ms. The cost is about 400 ms of feedback for an instant save; the lock covers only the pending half. The commit track skips the 300 ms load delay because the person just acted and is looking at the control; loads keep it.

## States by component

These patterns are fixed; the [component reference](references/components.md) covers every control.

**Room for a mark:** inline spinner, tick, or error icon with Retry. **No room:** the element's own border becomes the spinner, an arc sweeping around its shape and radius; then a success border for the 200 ms beat, or a danger border with Retry and the message in the nearest place with room, never squeezed inside. Reduced motion: dashed or held border, no sweep. Same `aria-busy` and announcements; focus stays on the element. [Controls and detail](references/components.md#room-for-a-mark-or-border-as-spinner).

| Component | Pending | Confirmed | Failed |
|---|---|---|---|
| **Text field, blur-commit** | The border takes the commit colour; the field is momentarily disabled (`aria-disabled`); an inline spinner in the trailing slot | A green tick in a circle animates in on the right, inside the field | Error border and icon; the person's value kept; a message below with Retry and Revert |
| **Switch, checkbox** | A spinner replaces the switch in its own box, at least 200 ms; the same focusable element stays, locked | The control shows the new value | The stored value again, an error icon and Retry |
| **Button, call to action** | A spinner in place of its icon, the label in the present tense ("Saving…"), its width fixed, locked | A tick and the past tense ("Saved") | Back to rest; the error at the section's scope |
| **Long, multi-step operation** | Subtle step text that changes as each step runs, a percentage when known, Cancel | A tick in place, or a pill if the person moved on | The failing step named, what completed kept, Retry from that step |

**Explicit save or save on change.** Save a value on its own (blur-commit) when it stands alone and is easy to change back. Use an explicit Save when values must be valid together, or a change is costly, slow, sensitive, seen by others or needs review. Never mix the two in one section.

**One commit in flight per control.** A control is locked while its commit is pending, so it can't send a second; across controls, a later response never overwrites a newer value, and a failure rolls back to the last confirmed value, not to the value before the person's first edit ([errors](references/errors.md#concurrency-and-ordering)).

## Loading: shimmer for views and sections

[Shimmer (skeleton) loading for views and sections](references/shimmer.md): placeholders in the real layout with a soft light passing across them.

- **Which indicator:** a shimmer skeleton for views and sections whose shape is known, in the real wrapper and layout (no layout shift); a spinner at component or field scope, or when the shape can't be known; steps or a progress bar for long operations.
- **Spinner placement:** inline with room, otherwise the element's own border. Placement changes neither timing track.
- **Timing:** no skeleton for the first 300 ms, at least 500 ms once shown; about three passes, then still; at its timeout, the error at that scope. Never shimmer forever.
- **Progressive:** each section swaps in complete when its own data is ready; a refresh keeps the old content.
- **Motion and access:** with reduced motion, no shimmer; `aria-busy="true"` on the region, placeholders `aria-hidden`, one status said once.

## The notification pill

One global pill at the bottom of the window, for outcomes not visible where the person is: background work finished, a change that left the view (with Undo), a failure with no visible home, a partial success. Never for a field's save (its tick says it) or a validation error (it belongs on the field). [Full spec](references/notification-pill.md).

- **Auto-dismiss** for information the person can do without, whose action is also reachable elsewhere; **hard-dismiss** for errors, warnings that need a decision, partial success and any action that exists nowhere else.
- **One line normally; at most three.** Longer goes behind Details.
- **Several at once:** a message on the same subject updates its pill in place; repeats coalesce with a count; at most three visible, the rest queued with errors first; an auto-dismiss timer starts only when its pill is visible.

## Errors and recovery

Errors follow the same scopes as loading: **transparent** (what happened, why if known, what was kept, what to do) and **recoverable** (Retry, Undo, Revert, Edit, Reconnect, Keep mine or Take theirs; Details alongside). Input is never lost: through a failed save, a retry, a conflict, a closed window or going offline. The [error model](references/errors.md) covers each scope, concurrency, and the partial-success, offline, conflict, cancelled and slow states.

## Empty states

A bare space breaks the layout meant for the content and leaves the person asking whether it's loading, broken or done. Rule 8 holds at every scope down to a table cell; the [kinds and scopes](references/empty-states.md) set the tone (playful only for first use, cleared and all done) and the action. A silhouette is static, faint and decorative, never a shimmer; an unknown state (loading, failed) is never shown as "No items".

## Focus and announcements

[Full detail](references/accessibility.md).

- **Focus stays where the person put it.** A lock never moves it: the same element stays, locked with `aria-disabled`, never `disabled` or unmounted. A blur-commit's result never pulls focus back. Focus moves only when its element goes (a removed row: the next row, else the previous, else the empty state's action) or after an explicit save fails (the section's message bar or the first failing field).
- **Announce outcomes, not every step:** one polite live region (`role="status"`) for confirmations ("Project name saved", coalesced) and the start and end of loads and operations; `role="alert"` only for a failure the person must know now and that isn't where their focus is. Step text is not live.
- **Not colour alone:** inline marks or border patterns and nearby status words carry the state as well as colour; outcomes have named announcements; borders and marks reach 3:1.
- **Reduced motion changes motion, not timing:** the beats hold; nothing draws, slides or shimmers.

## Copy

The words follow `ui-copy`: pending in the present tense ("Saving…"), confirmed in the past ("Saved"), step text as the step's own name (technical words welcome in this subtle line only), errors as what happened, why, what was kept and the action, pills as one fact and one optional action.

## Making it enforceable

Test the mechanical rules ([the checks](references/enforcement.md)): the beats with an instant save, the focused element kept through pending, out-of-order responses, the pill's dismissal and queue, empty and loading fixtures in their own wrappers, and no full-window block outside a written list.

## Review checklist

- [ ] Every value that can change has pending, confirmed and failed states on the component itself
- [ ] Pending holds at least 200 ms and confirmed at least 200 ms, even for an instant save; the lock ends when confirmed begins
- [ ] Room for a mark: inline spinner, tick, error icon with Retry; no room: own-border arc, success/danger border, recovery nearby, no sweep under reduced motion, same focus and announcements
- [ ] The scope is the smallest independent unit; continuous text is never locked; any app-level block has a written reason
- [ ] Field: commit-colour border, momentary lock, green tick in a circle animating in on the right
- [ ] Switch and checkbox: a spinner replaces the control for at least 200 ms, focus kept on the same element
- [ ] Steps or a percentage wherever known; the step line subtle and not live
- [ ] One commit in flight per control; a late response never overwrites a newer value
- [ ] Pill at the bottom: the right dismissal, one line (three at most), queued past three, never the only home of something essential
- [ ] Every error scoped, transparent, with at least one recovery action; input kept
- [ ] Partial success, offline, conflict, cancelled and slow states designed
- [ ] Focus and announcements follow the table; reduced motion keeps the beats and drops the motion
- [ ] Views and sections of known shape load as a shimmer skeleton in the real wrapper, after 300 ms, at least 500 ms, a few passes then still, never forever
- [ ] Every empty state sits in the content's own wrapper at its minimum size and says why and what to do; playful only for first use, cleared and all done; a silhouette never shimmers

Status that's visible (H1), errors that say how to recover (H9) and preventing errors (H5) are the [usability heuristics](../craft/references/usability-heuristics.md) this skill carries most; check them with the rest when the view is reviewed.
