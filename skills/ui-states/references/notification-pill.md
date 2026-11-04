# The notification pill

One global surface at the bottom of the window for outcomes the person can't see where they are. It's the product's toast or snackbar, kept to one shape, one place and two dismissal types.

## When to use it, and when not

| Use the pill for | Use instead |
|---|---|
| Background work finished or failed | |
| A change that removed something from view (deleted, moved, archived), with Undo | |
| A failure with no visible home (a sync, a scheduled job) | |
| A partial success | |
| A save of a field, switch or choice | Its own confirmed state (the tick) |
| A validation error | The field's error |
| A failure of the section or view the person is looking at | That scope's message bar |
| Something the person must decide before going on | A dialog |
| A standing condition (offline, read-only, signed out) | A banner at the scope it affects, removed when resolved |

A pill is never the only place for something essential: a result, a reason or an action in it is also reachable from the thing it's about, a task list, or history.

## Anatomy

1. **Status icon:** info, success, warning, error or progress (a spinner or a small bar), each with its own icon so colour is never alone.
2. **Message:** one fact. One line normally; **at most three lines** for the exceptional case (a partial success with its count, an error with its reason). Longer content goes behind Details, never a fourth line.
3. **Action (optional):** one verb (Undo, Retry, Open, Details); two at most when the second is Details.
4. **Close:** always on a hard-dismiss pill; optional on an auto-dismiss one.

Shape: a fully rounded pill for one line; the same radius token, so it reads as a rounded box, for two or three. Width fits its content up to a maximum (about 560 px), full width less the margins on narrow windows.

## Variants

| Variant | Typical message | Dismissal |
|---|---|---|
| Info | "Exported to Downloads. Open" | Auto |
| Success | "3 notes moved to Archive. Undo" | Auto (Undo is also in history or a shortcut) |
| Progress | "Publishing… Uploading 4 of 9" | Conditional: becomes success or error when the work ends |
| Warning | "Sync paused: the folder is read-only. Details" | Hard |
| Partial success | "18 of 20 pictures imported. 2 were too large. Show" | Hard |
| Error | "Couldn't publish. The server didn't answer. Retry" | Hard |

## Dismissal

- **Auto-dismiss:** about 6 s for one line and 8 s for two or three (`duration.notice`). The timer pauses while the pointer is over the pill, while focus is inside it, and while the window is in the background, then resumes. Only for messages the person can do without, whose action (if any) is also reachable elsewhere.
- **Hard-dismiss:** stays until the person closes it, takes its action, or the condition resolves (the work is retried and succeeds, the connection returns), which removes it with a short confirmation.
- A product setting can keep every pill until dismissed, for people who need more time (WCAG 2.2.1).

## Placement and stacking

- **At the bottom of the window,** centred over the main content, above any bottom bar, clear of the focused input and the primary action. Over a modal dialog, it sits above the dialog's backdrop.
- **One per subject:** a newer message about the same subject (the same task, the same file) updates the pill in place rather than adding one; repeats of one message coalesce with a count ("3 files deleted").
- **Stacking:** at most three pills visible, the newest nearest the bottom edge; beyond three, the oldest collapse into "+2 more". Auto-dismiss pills never stack above hard-dismiss ones, so a pill that times out never hides one that won't.
- **Motion:** slides up and fades in (`duration.base`), fades out; with reduced motion it only fades.

## Accessibility

- The pill region is a landmark with a name ("Notifications"), present in the page before any pill appears.
- Info, success and progress announce through a polite live region (`role="status"`); errors through `role="alert"`. A progress pill announces its start and its end, not each step.
- A pill never takes focus. Its actions are reachable by keyboard (a shortcut to the notifications region, and in the tab order), and Escape closes the focused pill.
- The message, the action and the close button each have accessible names; the close button says what it closes ("Close notification").
