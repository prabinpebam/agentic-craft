---
name: perceived-performance
description: Use when adding or changing anything a person waits on (a save, a load, a sync, a refresh, an upload, a first start). Classifies the wait (instant, responsive, waiting, long), picks the feedback pattern, and holds the rules - never block or lose input, keep the old view until the new one is ready, one honest status, never a silent wait.
---

# Perceived performance: feedback a person can trust

Speed is felt, not measured. A 1.5 s save that shows "Saving…" at once and "Saved" after feels faster than a 0.8 s save with no sign of life. Every action gets the feedback its wait deserves, and none gets more.

## Four classes of wait

After Nielsen's response-time limits (0.1 s, 1 s, 10 s) and the Doherty threshold (~400 ms).

| Class | Wait | What the person sees |
|---|---|---|
| **Instant** | < 100 ms | The result itself. No indicator |
| **Responsive** | 100 ms – 1 s | An inline state change ("Saving…" → "Saved"), shown only if the wait passes 300 ms. Never a spinner that flashes |
| **Waiting** | 1 – 10 s | An indicator that names the work ("Updating the preview…"), the old view kept, the controls usable |
| **Long** | > 10 s | Steps with progress and elapsed time, in the background, cancellable or leavable, a note when done |

## Principles, in order when they conflict

1. **Never block input, never lose it.** Typing is echoed locally, never by a round trip. A refresh never replaces a field, text or a selection in use; if it would, it waits and says why.
2. **Acknowledge within 100 ms.** Every action changes something visible at once (the pressed control, the selection, a placeholder). That acknowledgement stands in for a slower result.
3. **Keep the old view until the new one is ready.** Never blank a region or a page to redraw it; swap when the new content is complete (double-buffering); mark the old one as updating only past 300 ms.
4. **Say what's happening in one place, and show it where it happens.** One status line is the source of truth for saving, updating, background work and failures; the thing being worked on shows its own sign too (a busy button, a pending row, a region updating). Nothing works without a visible sign.
5. **Be true.** "Saved" means it's stored. An optimistic view is allowed only when a failure puts it back and says so.
6. **Match the indicator to the wait.** None for instant; delayed for responsive; named for waiting; steps and time for long.
7. **Preserve context.** Scroll position, focus, the open tab, the selection and what's expanded survive every refresh.
8. **Fail loudly, recover quietly.** A failure says what happened and what to do, keeping the person's input; a retry that works just clears the message.

## Patterns

| Pattern | Use when | How it shows |
|---|---|---|
| Direct echo | Typing, selecting, toggling | The control's own state |
| Save state | Any change written | Unsaved → Saving… (after 300 ms) → Saved, "just now"; failures stay until fixed |
| Optimistic placeholder | A structural change (add, move, delete) | Shown at once; the real redraw replaces it in place; a refusal puts it back and says why |
| Stale while updating | A region redrawn after a change elsewhere | Old content stays; dimmed and "Updating…" only after 300 ms; new content swaps in complete |
| Double-buffered view | A heavy view must be redrawn | Built hidden, swapped when ready; scroll and selection carried over |
| Skeleton | Opening a view that takes over 1 s | Chrome at once; regions as skeletons in their real layout; content streams in |
| Media placeholder | A picture not loaded yet | Its exact box (no layout shift), a shimmer (still under reduced motion), fade in; never a broken icon |
| Named wait | 1–10 s of known work | "Preparing 118 pictures…", elapsed time after 3 s |
| Background task | Over 10 s, or work they needn't watch | A task with steps ("Checking · Committing · Pushing") and elapsed time; the screen stays usable |
| First-start notice | The first view after a cold start | A plain page at once saying what's being prepared, then the view |
| Prefetch on intent | Moving between views | Hover or focus fetches the next view; the click shows it at once |

## Rules for building

- **Declare the class** of every new wait, and use its pattern.
- **One task tracker** behind every wait: start a task naming the element it affects; the element shows its sign through a data attribute (`data-busy="ack|on|done"`), styled by its own component; timings are tokens (the 300 ms delay, the 500 ms minimum once shown, elapsed after 3 s).
- **Delay indicators 300 ms; keep them at least 500 ms once shown**, so nothing flickers.
- **Redraw only what a change affects** (named regions), from data or a fragment, never the whole view.
- **Never reload a view while the person is typing in it;** never move focus as a side effect.
- **Measure every wait** (`performance.measure`) with a target in the benchmark's budgets (`performance`).
- **Copy:** name the work in plain words; say the count when there is one; never "Loading…" alone; never apologise in a loop (`ui-copy`).
- **Accessibility:** the status line is a polite live region; announce the end of a wait, not each tick; honour reduced motion.

## Checklist for a new wait

- [ ] Class declared; pattern chosen
- [ ] Acknowledged within 100 ms
- [ ] Old view kept; input never blocked or lost
- [ ] Status line and the inline sign, both through the tracker
- [ ] Failure says what happened and keeps input; retry clears it
- [ ] Measured, with a target
- [ ] Reduced motion and screen reader checked
