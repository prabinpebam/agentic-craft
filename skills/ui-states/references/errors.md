# The error model

Errors follow the same scopes as loading. Every error is shown where it happens, says honestly what happened, and leaves the person a way forward with nothing they typed lost.

## Transparent: four parts

Every error message answers, as far as is known:

1. **What happened**, in the person's words ("Couldn't save the project name").
2. **Why**, when it's known ("You're offline", "The file is open in another program", "The server took too long"). Never invent a reason; "We don't know why yet" plus Details is honest.
3. **What was kept**: their input, the steps that completed, the files that went through ("Your text is kept", "12 of 14 files were copied").
4. **What to do**: the recovery as an action button, not as advice.

Technical detail (codes, paths, the raw response, the failing step) goes behind **Details**: shown on request, selectable and copyable, so a person can paste it into a report. It's never the headline and never hidden from someone who asks.

## By scope

| Scope | Presentation | Keeps working |
|---|---|---|
| **Field** | Error border, an icon in the trailing slot, the message below the field tied with `aria-describedby`, `aria-invalid="true"`; the value stays in the field | Everything else |
| **Component** | The control shows the stored value again; an error icon beside it and a one-line message with Retry | Everything else |
| **Section** | A message bar at the top of the section with the four parts and the action; failing fields marked too; focus moves to the bar after an explicit save | The rest of the view |
| **View** | The content area shows the error in place, keeping whatever loaded ("Showing what was loaded at 10:42. Couldn't refresh. Retry"); the header, navigation and other views stay live | The rest of the app |
| **App** | Only when nothing can work (storage unavailable, the app can't start): a full-window state with the four parts, what's safe, Retry, Details and Report; never a blank or white window | Nothing, so say why and what's safe |
| **Background** | A hard-dismiss notification pill with the action, also recorded where the product keeps tasks or history | Everything |

- **Validation before a save** is a field error, shown on blur or on submit, never while the person is still typing a first attempt. On submit, focus moves to the first field in error, and a section message bar counts them when there are several.
- **Several errors at once** are summarised at the widest scope they share, and each is still marked where it is.

## Recovery: every error has at least one

| Action | Use when | Does |
|---|---|---|
| **Retry** | The cause may be passing (network, a busy service, a lock) | Runs the same action again with the same input; a success clears the message |
| **Undo** | A change completed and its effect was unwanted | Restores the earlier state and confirms it |
| **Revert** | A save failed and the person wants the stored value back | Puts the stored value into the control; their attempt is offered to copy first if it was long |
| **Edit** | The input caused it (invalid, too large, a duplicate name) | Focuses the field, with the reason beside it |
| **Details** | Always available for a system failure | Shows the technical record, copyable |
| **Report** | The failure is a defect, not the person's input | Opens a prepared report with the technical record; nothing private is sent without the person seeing and agreeing |
| **Reconnect, sign in again** | Access or connection was lost | Restores it and resumes the waiting work |
| **Keep mine, take theirs, compare** | A conflict | See Conflict below |
| **Cancel** | The person would rather stop | Stops safely and says what was kept or rolled back |

- **Automatic retry** for transient failures, with growing intervals, shown as pending ("Retrying in 5 s… Retry now"); after a few attempts, stop and show the error with Retry.
- **Dismiss alone isn't recovery.** A message whose only action is Close is information, not an error; if anything was lost or still needs doing, it needs a real action.
- **No dead ends:** an error never leaves the person on a screen with no way back to their work.

## Input is never lost

- A field keeps the person's value through a failed save, a failed validation and a retry.
- A form keeps every value through a failed submit; a dialog doesn't close on failure.
- Work in progress is kept locally before it's sent, so a crash or a closed window can offer it back.
- A refresh or a conflict never replaces what the person is typing (`perceived-performance`).

## The other outcomes

**Success.** Confirmed in place (the tick, the new value, the result). A pill only when the result isn't visible where the person is. Never celebrate a routine save.

**Partial success.** Say both counts in one line ("18 of 20 imported. 2 couldn't be"), keep what succeeded, mark each failure in place with its reason, and offer Retry for the failures only. It's a hard-dismiss pill or a section message bar, never a success tick.

**Offline.** A banner at the scope it affects (usually the app's, but not blocking) says what still works and what happens to changes ("Offline. Changes are kept on this device and sync when you're back"). Changes made offline show a distinct "saved on this device" state, not the green tick, which means stored where it's going. When the connection returns, the queued changes sync with their own progress and the banner goes.

**Conflict.** Something else changed the same thing first. Never overwrite either version silently. Keep the person's version, show what differs, and offer Keep mine, Take theirs, or Compare (and Keep both where the data allows). The conflict stays marked until resolved.

**Cancelled.** Not an error and not styled as one. Say what was done and what was kept or rolled back ("Cancelled. 12 of 40 files were copied and kept"), return the controls at once, and offer to start again.

**Taking longer than usual.** Past 10 s with no progress, say so plainly, keep the progress visible, and offer Cancel or keep waiting; never silently spin forever.
