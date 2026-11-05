# Sources and trade-offs

What the rules rest on, and where they bend.

## Sources

| Source | What it says | Rules |
|---|---|---|
| Edward Tufte, *The Visual Display of Quantitative Information* (Graphics Press, 1983; 2nd ed. 2001), [publisher's page](https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/) | The data-ink ratio: the share of a graphic's ink that presents data. "Above all else show the data"; maximise the data-ink ratio; erase non-data ink and redundant data ink, within reason. *Chartjunk*: decoration that carries no information (heavy grids, ornament, false depth) | 1, 2, 6 |
| NN/g, [Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/) (heuristic 8) | "Interfaces should not contain information which is irrelevant or rarely needed. Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility." Limit the amount of noise; clarity wins over visual flourish | 1, 6, 7, 8 |
| NN/g, [Signal-to-noise ratio](https://www.nngroup.com/articles/signal-noise-ratio/) | Relevant information is signal, irrelevant is noise; anything a person must process counts, including visual elements and animation; aim for a high ratio | 1, 5 |
| NN/g, [Proximity principle in visual design](https://www.nngroup.com/articles/gestalt-proximity/) | Items close together are seen as one group; proximity can overpower other cues such as colour or shape | 3 |
| NN/g, [The principle of common region](https://www.nngroup.com/articles/common-region/) | Items inside a boundary (a border or a background) are seen as a group, and a boundary overpowers proximity and similarity. So a boundary on each member of a group splits it into separate items: the opposite of what the group's own boundary says | 3, 4 |
| NN/g, [Ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Heuristic 4, consistency and standards: one look and behaviour per component across the product | 9 |
| Material Design 3, [Divider guidelines](https://m3.material.io/components/divider/guidelines) | "A divider is a thin line that groups content in lists and containers": a divider is a grouping device, so it's one mechanism for a boundary, not an extra on top of space or a border | 3, 4 |
| Material Design 3, [Elevation](https://m3.material.io/styles/elevation/overview) | "Elevation is the relative distance between two surfaces along the z-axis": a shadow says a surface is raised, so it belongs only on surfaces that are | 3, 4 |
| Fluent 2, [Elevation](https://fluent2.microsoft.design/elevation) | Elevation uses shadow and light to show distance between surfaces and to convey importance; a consistent light source and a few levels keep the hierarchy readable | 3, 4, 6 |
| W3C, [Understanding 1.4.11 Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Visual information *required to identify* a component or its state needs 3:1 against adjacent colours. "This success criterion does not require that controls have a visual boundary indicating the hit area": a control with visible text or a contrasting icon needs no border; a boundary is required "only when there is no other visual way to identify the presence of the control". A focus indicator is still required | 5, the floor |
| W3C, [Understanding 1.4.1 Use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | Colour is not the only visual means of conveying information or distinguishing an element | 2, the floor |

## Trade-offs

- **Discoverability against calm.** A bare control can be missed. The answer isn't a resting border on every member; it's the cheapest cue that makes the group findable (the group's own boundary, an icon that reads as pressable, a hover fill) and a boundary on the controls that are found by it (fields). WCAG's understanding notes that, for people with cognitive disabilities, delineating every control is a best practice; inside an enclosed group, the group's boundary and each member's hover and focus cues do that work. When research with people shows a bare control is missed, record it and add the one cue that fixes it.
- **Redundancy for accessibility.** Rule 2 allows two channels for one meaning so colour is never alone. That's the ceiling, not the target: a selected segment with a fill and a check is fine; with a fill, a check, a border and bold, it isn't.
- **Dense data.** Tables and editors with many rows may need row rules or zebra fills to be read at all; those are data ink, not noise. Record the decision and keep one mechanism.
- **Brand and expression.** A product may choose a distinctive look. Expression lives in the tokens (type, colour roles, radius, motion), applied the same way everywhere, not in extra marks on individual screens.
- **Thresholds are defaults.** Three strokes, four fills, two shadows and a depth of two fit most products. A project may set its own in its design-system rules; a review cites them.
