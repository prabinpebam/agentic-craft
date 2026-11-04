# Focus, announcements and motion

What happens to keyboard focus and to screen-reader announcements after every change, and how motion and colour are handled. The skill's summary is in [SKILL.md](../SKILL.md#focus-and-announcements).

## After each kind of change

| After | Focus | Announced |
|---|---|---|
| A blur-commit (confirmed or failed) | Stays where the person moved it; never pulled back | Confirmed: polite, named ("Project name saved"); failed: `role="alert"`, since it's away from focus |
| An Enter-commit, a switch, a choice, a button | Stays on the same element, kept in place and locked with `aria-disabled`, never `disabled` or unmounted | Polite: the outcome, not the pending, unless the save passes 1 s |
| An explicit save that failed | The section's message bar, or the first failing field | Read from focus |
| A row removed (delete, archive, move) | The next row, else the previous, else the empty state's action | Polite, with Undo's shortcut if there is one |
| A rollback (a removed row comes back) | Unchanged, unless focus was lost, then the restored row | `role="alert"`, with the reason |
| A load, a long operation | Never moved | One polite status at the start and at the end; step text and percentages are not live (a progress bar's `aria-valuetext` carries them) |
| A pill appears | Never moved; a shortcut reaches the pill region | Polite for info, success and progress; `role="alert"` for errors |

## Live regions

- **One polite live region** (`role="status"`) for confirmations and progress, and one assertive (`role="alert"`) for failures, both in the page before anything is announced; text added to a region that's just been created is often not read.
- **`role="alert"` interrupts,** so it's only for a failure the person must know now and that isn't where their focus is: a blur-commit that failed after they moved on, a rollback, a background failure, an error pill. A failure at the focused control is announced politely.
- **Commits announce the outcome, not the pending,** named ("Project name saved"); the pending is announced only if it passes 1 s. Rapid commits coalesce into one announcement.
- **A field error at focus** uses `aria-invalid="true"` and `aria-describedby` (the message below), and is also announced politely once, since a description that changes while focused isn't read on its own.
- **Progress** is not live: step text changes too fast to read aloud. A progress bar carries `aria-valuenow` (and `aria-valuetext` with the step), and the start and the end are announced once.
- **Loads** mark only their region `aria-busy="true"`, only while loading, with one status said once.

## Locks never drop focus

- Lock with `aria-disabled="true"` and ignore input, never with the `disabled` attribute, which removes the control from the tab order and, if it's focused, sends focus to the start of the page.
- Never unmount or replace the focused element while it's pending. A spinner that replaces a switch or a button's icon is drawn inside the same element, which keeps its role, name and focus.
- A locked control still shows its focus ring and still meets contrast; it says it's busy (`aria-busy="true"`) if focused.

## Not colour alone

- The commit colour has the spinner or tick as its twin; the error colour an icon and words (WCAG 1.4.1).
- The tick shape is the visual cue; its text twin is the announcement, and the icon itself is `aria-hidden`.
- Borders, ticks and icons reach 3:1 against their background (1.4.11); many stock greens don't on white, so the success token is checked.

## Motion

- **Reduced motion changes motion, not timing.** The 200 ms beats still hold; the tick appears without drawing; a spinner becomes a static busy mark (with the words or announcement carrying the state); the pill fades instead of sliding; the shimmer doesn't run; a failed drag snaps back instead of animating.
- **No layout shift:** a spinner, tick or icon takes the box of what it replaces; a button keeps its width.
