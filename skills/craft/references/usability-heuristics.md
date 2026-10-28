# Usability heuristics

Jakob Nielsen's ten usability heuristics (1994, revised 2020: [nngroup.com/articles/ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)) are the principles every flow and view is designed and reviewed against. They aren't a last polish. A flow is designed with them (`ground` §4), a view is assembled with them (`design-system`), its words follow them (`ui-copy`), and a Definition of Done names the evidence that each one that applies holds (`definition-of-done`).

Each heuristic below says what it asks, how it shows up in this practice, and what to look for when reviewing. Refer to them by number (H1 to H10) in specs, reviews and Definition of Done rows.

## H1. Visibility of system status

**Asks:** the person always knows what's happening, through feedback that comes in time.

- Every wait has a sign where it happens, matched to its class (`perceived-performance`). A save says saving, saved or failed, and "saved" is true.
- State that matters is shown, not inferred: what's selected, what's changed and not saved, what's private, what work in the background is doing.
- **Look for:** an action with no immediate acknowledgement; a status that can lie; a change of state only visible elsewhere.

## H2. Match between the system and the real world

**Asks:** the product speaks the person's language and follows real-world order, not the system's.

- Labels use the glossary's words for the person's concepts, never internal names, IDs or implementation terms (`ui-copy`).
- Things appear in the order the person thinks of them (the task flow's order), and icons mean what they mean elsewhere.
- **Look for:** a field named after a schema property; an error with a code and no words; steps in the order the data model needs.

## H3. User control and freedom

**Asks:** a clearly marked way out of anything done by mistake, without a long detour.

- Cancel, undo, back and close are always there. When something can't be reversed, nothing takes effect until the person confirms.
- Suggestions and automation propose; the person accepts, edits or dismisses, and typing over a suggestion wins.
- **Look for:** a dialog with no way out; an automatic change saved without a choice; a destructive action with one press and no undo.

## H4. Consistency and standards

**Asks:** the same words, controls and patterns mean the same thing everywhere, and platform conventions are followed.

- One component per job, from the design system's library; one term per concept, from the glossary.
- A pattern used in one place is reused, not reinvented, for the next case: how a suggestion is offered, where Save sits, how a list is reordered.
- **Look for:** two names for one thing; a second way to do what a component already does; a control that behaves unlike the platform's.

## H5. Error prevention

**Asks:** design that stops the problem from happening, before a good error message is needed.

- Constrain input (types, limits, choices instead of free text), give good defaults, and confirm only what's risky and irreversible.
- Validate before writing, never after. Explain what isn't possible yet instead of letting it fail.
- **Look for:** a limit enforced only on save; free text where a choice would do; a confirmation on everything (which teaches people to ignore it).

## H6. Recognition rather than recall

**Asks:** options, actions and information are visible or easy to find, so nothing has to be remembered from one place to the next.

- Put an action beside what it acts on, show the current value, and carry context across steps (what was chosen, where it came from).
- Shortcuts and hidden gestures are additions, never the only way.
- **Look for:** an instruction to remember a code or a name from another screen; an action reachable only by a key; a form that loses what was typed.

## H7. Flexibility and efficiency of use

**Asks:** shortcuts that speed up experienced people without getting in the way of new ones, and room to tailor frequent actions.

- Keyboard shortcuts, bulk actions, paste and drag where they fit, and sensible defaults that skip steps.
- An accelerator never replaces the plain way, and it can be found: a hint, a menu entry, a tooltip.
- **Look for:** a task repeated item by item with no way to do many; a shortcut nobody could find; a default that's wrong most of the time.

## H8. Aesthetic and minimalist design

**Asks:** every element earns its place. Anything rarely needed competes with what matters and lowers its visibility.

- Show what serves the current step and put the rest behind progressive disclosure. Offer an action only where it can succeed.
- Visual hierarchy comes from tokens and type styles, never decoration.
- **Look for:** a control shown where it can't work; repeated explanations; three actions of equal weight where one is primary.

## H9. Help people recognise, diagnose and recover from errors

**Asks:** error messages in plain words that say what went wrong and how to fix it, shown where the problem is.

- Name what happened, why if it's known, and the next step (try again, change this, sign in). Keep what the person typed.
- Use visual cues (the field marked, the message beside it) with a text twin for screen readers.
- **Look for:** "Something went wrong"; an error far from its cause; a failure that clears the form.

## H10. Help and documentation

**Asks:** the product works without docs, but help is there when it's needed, in context and focused on the task.

- Hints under fields, a short line saying what an action does, and a link to the fuller page where a concept is new.
- Help is about the person's task, in steps, never about the system.
- **Look for:** a new concept with no hint; help that's only on a separate site; documentation that describes the screen instead of the task.

## Using them

- **Designing a flow:** for each step, note which heuristics are at stake and the decision each one drove. A spec's views can carry a "Heuristics" note, for example: H1, a busy sign on the button; H3, nothing saved until Accept.
- **Reviewing a view or a change:** walk H1 to H10 and report each finding as `heuristic · where · what a person would experience · fix`. Order them by severity: blocks a task, slows or confuses it, cosmetic.
- **Defining done:** a view's Definition of Done has rows for the heuristics that matter most to it, with observable evidence: an end-to-end test that the failure line names the fix, a screenshot of the busy state, a test that typing dismisses a suggestion. A heuristic review by a second reader counts as evidence only when its findings are recorded.
- **When they conflict** (H7's shortcuts against H8's minimalism, H5's confirmations against H7's speed): decide for the promise the view serves, and write the decision down.
