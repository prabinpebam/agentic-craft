# Making it enforceable

Write tests for the mechanical rules of [ui-states](../SKILL.md), at the level the project already tests components. Each line is a check a test can make.

- every component whose value can change has fixtures for pending, confirmed and failed, in light, dark and more contrast;
- with a save that resolves at once, pending is visible for at least `duration.confirm-min`, then confirmed for at least `duration.confirm-min`, and the control accepts input again when confirmed begins;
- inline and no-room fixtures: the former shows spinner, tick or error icon; the latter sweeps its own border around its shape and radius, then shows success or danger, with Retry and the message nearby; reduced motion uses a dashed or held border, with no sweep, unchanged timing, focus, `aria-busy` and announcements;
- the focused control is the same element before, during and after pending (never unmounted), with `aria-disabled`, not `disabled`;
- with a save that fails, the control keeps the person's value, a recovery action is reachable by keyboard, and the failure is announced;
- two commits whose responses arrive out of order leave the newer value;
- pills: error and partial-success never auto-dismiss, text clamps at three lines, at most three visible with the rest queued (errors first), a timer starts only when its pill is visible and pauses on hover and focus;
- typing into continuous text that autosaves is never blocked and shows no tick per save;
- a rollback (a failed optimistic delete, move or reorder) restores the item in place and is announced;
- no full-window blocking state outside a written list of app-scope operations;
- every container that can be empty has an empty fixture in its own wrapper, at least its minimum size, with words and no shimmer, and its first content arrives with no layout shift;
- every view or section that loads has a loading fixture: placeholders in its wrapper, `aria-busy` on the region, placeholders `aria-hidden`, a finite shimmer (none under reduced motion), and a timeout that ends in the error state.
