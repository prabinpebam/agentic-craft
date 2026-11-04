# Sources and trade-offs

The research behind `ui-states`, and where its rules deliberately differ from common guidance.

## Sources

**Response time and progress**

- Nielsen Norman Group, [Response times: the 3 important limits](https://www.nngroup.com/articles/response-times-3-important-limits/): 0.1 s feels instant, 1 s keeps the flow of thought, 10 s holds attention; past 10 s, show progress and an estimate.
- Nielsen Norman Group, [Progress indicators make a slow system less insufferable](https://www.nngroup.com/articles/progress-indicators/): a looped indicator for 2 to 10 s, a percent-done indicator past 10 s; people wait longer and are more satisfied when they see dynamic progress.
- Nielsen Norman Group, [Skeleton screens 101](https://www.nngroup.com/articles/skeleton-screens/): skeletons for full-page loads; spinners and bars for actions.
- Nielsen Norman Group, [Indicators, validations and notifications](https://www.nngroup.com/articles/indicators-validations-notifications/): status shown in context, notifications for events away from it.
- Material Design 3, [Progress indicators](https://m3.material.io/components/progress-indicators/guidelines): determinate when the amount is known, indeterminate otherwise.
- Apple Human Interface Guidelines, [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) and [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback): prefer determinate progress, keep indicators moving, describe the work, and give feedback in place.
- Microsoft Fluent 2, [Spinner](https://fluent2.microsoft.design/components/web/react/core/spinner/usage) and [ProgressBar](https://fluent2.microsoft.design/components/web/react/core/progressbar/usage).
- Carbon, [Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/): an inline spinner in place of what it replaces, with active, finished and error states; the finished (tick) state shows for 1.5 s; the triggering control is disabled while it runs. Carbon, [Loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/).

**Saving and inline feedback**

- GitHub Primer, [Saving](https://primer.style/product/ui-patterns/saving/) and [Loading](https://primer.style/product/ui-patterns/loading/) patterns: start with explicit saving; never mix automatic and explicit saving in one form; keep the person's data in the form when a save fails; prefer explicit saving for text inputs, checkbox and radio groups and selects, because arrow keys and screen readers can select an option just by reading it.
- Material Design 3, [Switch](https://m3.material.io/components/switch/guidelines) and [Text fields](https://m3.material.io/components/text-fields/guidelines): a switch's effect is immediate; a field's error replaces its supporting text and colours its outline.
- Fluent 2, [Field](https://fluent2.microsoft.design/components/web/react/core/field/usage): validation messages tied to the field, with success, warning and error states.

**Notifications**

- Material Design 3, [Snackbar](https://m3.material.io/components/snackbar/guidelines): short updates at the bottom of the screen that disappear or stay until the person acts; one at a time; two lines at most.
- Fluent 2, [Toast](https://fluent2.microsoft.design/components/web/react/core/toast/usage): confirmation, progress and communication toasts; timed dismissal after 7 s when there's no action, paused on hover; conditional dismissal for progress; a close button only when the content can be found again elsewhere; never for critical messages (use a message bar or a dialog). Fluent 2, [MessageBar](https://fluent2.microsoft.design/components/web/react/core/messagebar/usage).
- Atlassian, [Flag](https://atlassian.design/components/flag/usage): bottom of the screen, newest on top of a stack; never auto-dismiss a critical warning or error; never mix dismissible and non-dismissible flags in one stack; avoid dead ends. Atlassian, [Banner](https://atlassian.design/components/banner/usage) and [Inline message](https://atlassian.design/components/inline-message/usage).
- Carbon, [Notifications pattern](https://carbondesignsystem.com/patterns/notification-pattern/): task-generated notifications in the region the person is working in; toasts without actions may auto-dismiss, toasts with actions persist until dismissed; banners for system-level states.
- GitHub Primer, [Notification messaging](https://primer.style/product/ui-patterns/notification-messaging/): banners and inline messages for feedback near the action; toasts avoided for accessibility.
- Shopify Polaris, [Toast API](https://shopify.dev/docs/api/app-home/latest/apis/user-interface-and-interactions/toast-api) and [Banner](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/banner): short, non-critical confirmations versus persistent, actionable messages.

**Errors**

- Nielsen Norman Group, [Error-message guidelines](https://www.nngroup.com/articles/error-message-guidelines/): visible near the problem, in plain words, constructive, preserving input.
- Nielsen Norman Group, [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): H1 visibility of system status, H5 error prevention, H9 recognise, diagnose and recover from errors.
- Apple Human Interface Guidelines, [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts): use sparingly, for important information that needs a decision.
- Carbon, [Notification](https://carbondesignsystem.com/components/notification/usage/) and Polaris, [Banner](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/banner): inline and section-level errors with an action.

**Accessibility**

- WCAG 2.2, [4.1.3 Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): results, waiting states, progress and errors announced without taking focus.
- WCAG 2.2, [2.2.1 Timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): time limits can be turned off, adjusted or extended.
- WCAG 2.2, [1.4.1 Use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [1.4.11 Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [2.3.3 Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [3.3.1 Error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [3.3.3 Error suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html).
- WAI-ARIA, [`aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy), [`status` role](https://www.w3.org/TR/wai-aria-1.2/#status) (polite), [`alert` role](https://www.w3.org/TR/wai-aria-1.2/#alert) (assertive), [`aria-disabled`](https://www.w3.org/TR/wai-aria-1.2/#aria-disabled) (focusable while disabled); the APG [Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).
- MDN, [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

**Optimistic and pessimistic updates, and flicker**

- React, [`useOptimistic`](https://react.dev/reference/react/useOptimistic): show the expected result at once and fall back when the action fails.
- The delay-before-showing and minimum-display patterns behind `perceived-performance`'s 300 ms delay and 500 ms minimum: an indicator that appears and vanishes within a few hundred milliseconds reads as a glitch.

**Empty states**

- Nielsen Norman Group, [Designing empty states in complex applications](https://www.nngroup.com/articles/empty-state-interface-design/): a totally empty container leaves people unsure whether it's loading, failed or filtered out; use empty states to show system status, teach, and offer a direct path to the key task.
- Material Design 2, [Empty states](https://m2.material.io/design/communication/empty-states.html): its communication guidance on what a container shows when it has no content.
- GitHub Primer, [Empty states](https://primer.style/product/ui-patterns/empty-states/) and [Blankslate](https://primer.style/product/components/blankslate/): different primary text for never used, temporarily empty and failed; one primary action; error empty states never playful.
- Carbon, [Empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/): no-data, user-action (no results, completion) and error-management types; empty states appear in the space of the missing content; quiet actions when several show at once; text only when space is short; an empty table's state replaces the table so a screen reader doesn't read its headers first.
- Atlassian, [Empty state](https://atlassian.design/components/empty-state/usage): for a new board, a cleared inbox or no search results; a header, a reason and what to do next; one call to action; illustrations neutral or humorous, never negative, alt text only when meaningful.
- Shopify Polaris, [Empty state](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/empty-state): says why a page, list or table has nothing and what to do; inside a table it spans every column; for empty lists, empty tables, unconfigured features and filtered results.
- Fluent 2, [Skeleton](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage): skeletons hint at structure for loads over a second, animate (wave or pulse) and use `aria-busy`; Fluent 2 has no dedicated empty-state component.
- web.dev, [Cumulative layout shift](https://web.dev/articles/cls): reserve space so content arriving doesn't move what's around it.
- WCAG 2.2, [1.1.1 Non-text content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html): decorative images are hidden from assistive technology.

## Where these rules differ from common guidance

| Rule here | Common guidance | Why the rule stands, and its cost |
|---|---|---|
| A committed change shows pending and confirmed for at least 200 ms, with no delay before showing, even when the save is instant | Delay indicators (about 300 ms) so fast actions show nothing and nothing flickers | Flicker is an indicator of unpredictable length. A fixed 200 ms beat that always ends in a tick reads as "done", and it answers the question "did that save?", which a silent instant save leaves open. The cost: at most 200 ms during which that one control is locked. Loads and redraws keep the delay. |
| Single values save on their own (blur-commit) with the 200 ms confirmation, beside explicit Save for values that belong together | Primer: start with explicit saving, and prefer it for text inputs, checkbox and radio groups and selects | Settings that stand alone shouldn't need a Save button the person hunts for; the confirmation answers Primer's worry that a person can't tell whether it saved. Primer's other risks are handled: a radio group, a native select and a slider moved by arrow keys commit when focus leaves them or after a pause, never on each arrow press; sensitive values (a password, anything that's hard to take back) always use explicit save; and the two patterns never mix in one section. |
| A field is momentarily locked while it saves | Never block input (`perceived-performance`) | The lock covers only the committed control, after its edit ended (blur), for the beat or the save, with focus kept; the rest of the app stays usable, so no typing is lost. |
| A switch shows a spinner, then the new value (pessimistic) | Material: a switch takes effect immediately; many products flip it optimistically | The value shown is the stored value: no switch is shown on that later turns out off. The 200 ms floor keeps it quick. Structural list actions (delete, move, reorder) stay optimistic, with Undo or rollback. |
| The notification pill allows three lines in exceptional cases | Material: snackbars at most two lines; Polaris: a few words | A partial success or an error's reason sometimes needs the count and the cause together; one line stays the norm, and more goes behind Details. |
| A global toast-like pill exists at all | Primer avoids toasts for accessibility | The pill is never the only home of anything essential, errors don't auto-dismiss, timers pause and can be turned off, and in-place states come first. |
| Step text may use technical step names | `ui-copy`: no developer words before the person chooses them | The step line is subtle and fleeting; its job is to show steady life, which specific, fast-changing names do best. Headlines, errors and buttons still follow `ui-copy`. |
| A "Saved" label holds about 1.5 s | Carbon's finished state: 1.5 s | Compatible: 200 ms is the floor for any confirmation; words need reading time. |
| An empty state keeps the content's wrapper at its minimum size | Carbon: the empty state replaces the element (an empty table loses its headers) | The wrapper (frame, heading, toolbar, filters) stays so the layout holds and the way out stays in reach; what's inside is replaced. Column headers stay only when sorting or filtering makes them useful, and the message comes first in reading order either way. |
| A silhouette of the expected content | Most systems use an illustration or icon | A silhouette previews the real shape and costs no illustration; it must be static, faint and paired with words so it's never read as a loading skeleton. Illustrations remain fine at view and app scope. |
| A quirky message when there's nothing else to say | Primer and Atlassian: playful only where it fits, never for errors | Same limit here: playful only for first use, cleared and all-done states, never for no results, no access or failures, and never instead of a reason. |
