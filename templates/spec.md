# <Product or feature>: spec

<One paragraph: what this is, for whom, and why now.>

> **TL;DR.**
> - **The promise:** <one sentence>.
> - **Who:** <the people and agents it serves>.
> - **What a person can do:** <the three or four headline user-can statements>.
> - **How:** <the architecture in one line>.
> - **Riskiest assumption:** <A1, and the criterion that would confirm it>.
> - **Success:** <the headline rows of the [Definitions of Done](definition-of-done.md)>.
> - **Open:** <the decisions still to make, with their working defaults>.

## 1. The customer promise

<The one sentence.>

| # | Promise | What breaks it |
|---|---|---|
| P1 | | |
| P2 | | |

**Not promised (non-goals):** <…>

## 2. Scenarios and jobs to be done

| # | When I… | I want to… | So I can… | Serves |
|---|---|---|---|---|
| J1 | | | | P1 |

## 3. What a person can do

| # | A person can… | Jobs |
|---|---|---|
| U1 | | J1 |

## 4. Task flows

### 4.1 <Flow name> (U1, U2)

1. <Step, as the person experiences it.> *(wait: responsive; copy: "Saving…" → "Saved")*
2. <…>

**Branches:** <offline · already exists · cancelled half-way · refused · comes back later> — each with what the person sees and does next.

**Defaults:** <what's chosen for them, and where it can be changed later.>

**Agent path:** <the same flow as commands, with machine-readable output and exit codes for "a person must act".>

## 5. Views

| View | Layout | Serves | Regions and data |
|---|---|---|---|
| | | U1, U2 | |

## 6. Architecture

<Components, data, boundaries, security model, what runs where.>

## 7. Performance and waits

| Wait | Class | Pattern | Target |
|---|---|---|---|
| | responsive | Save state | ≤ 300 ms |

## 8. Copy

<New glossary terms; the words for every failure in the flows.>

## 9. Assumptions and risks

| # | Assumption or risk | Kind | Impact if wrong | Evidence today | Criterion | Cheapest check | Changes | Status |
|---|---|---|---|---|---|---|---|---|
| A1 | | Desirability · usability · feasibility · viability | High (P1) | None | | | | Open |

## 10. Decisions

| # | Question | Options | Recommendation | Decided |
|---|---|---|---|---|
| O1 | | | | Working default: … |

## 11. As built

<Where the build differs from this spec, and why. Updated in the same change as the code.>
