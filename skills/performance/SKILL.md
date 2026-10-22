---
name: performance
description: Use when changing loading, rendering, data access, builds or bundles, when adding a wait a person feels, or before claiming anything is faster. A framework for benchmarking - one command, lab and field metrics, server spans, a committed baseline, noise-aware regression checks, budgets and targets.
---

# Performance: measured, tracked, kept

A performance claim is a comparison: this run against a baseline, on the same machine, with the noise accounted for. This skill sets up the measuring; `perceived-performance` decides what a person sees while they wait.

## The parts

1. **One benchmark command** that measures what people live with, end to end, on a fixture (never real data), and writes a run file (`perf/runs/<timestamp>.json`) with the machine, the commit and the data's size.
2. **Metrics a person feels,** named once, each with a precise start and end (below).
3. **Instrumentation that explains causes:** every server request timed to its last byte, with named spans for costly work, readable by the benchmark and in the browser's developer tools (`Server-Timing`).
4. **A committed baseline** (`perf/baseline.json`) and a **check** that fails on a regression beyond its noise allowance.
5. **Budgets** (enforced on every production build) and **targets** (the spec's goals, reported, not enforced; a met target becomes the baseline's floor).
6. **Field data** from real use, so the lab isn't the only witness.

## Metrics

Define each metric as **from → to**, from the person's point of view.

| Kind | Examples |
|---|---|
| Screens and pages | `ready` (drawn and usable: the one number a person feels), TTFB, FCP, LCP, CLS, TBT (long tasks over 50 ms), requests and bytes by type, DOM size, heap |
| Interactions | From the person's key or click (the last `pointerdown`/`keydown`) to the result: select, type-to-saved, save round trip, open a picker, add/move/delete shown, undo-to-saved, another tab updated |
| First visible sign | From the input to the first change on screen (`feedback-shown`): holds the 100 ms acknowledgement promise |
| Cold and warm | Cold: the first load after a start (compiles, caches empty). Warm: every later one. Report both |
| Server | Time per request kind, and spans for the expensive work (a content reload, an image transform, a process spawned, a validation) |

For public pages, use Web Vitals at the 75th percentile (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), on a desktop profile and a throttled phone profile (CPU ×4, ~10 Mbps, ~40 ms), each in an empty cache.

## Instrumentation

- Wrap costly server work in a `timed(name, fn)` helper that adds to the current request's spans and to the process's running totals; outside development it just runs the work.
- An endpoint returns recent requests and totals (`GET /…/perf?since=`), so the benchmark attributes each step's time.
- In the client, name every wait with `performance.measure('<area>:<name>')` so the benchmark and the Performance panel read the same thing.

## Tracking

- **Run:** medians, p75, min and max over N runs (5 is a good default); print targets met or not.
- **Compare:** `--compare perf/baseline.json` prints each metric against the baseline; `--check` exits non-zero when a metric is worse beyond **both** a relative and an absolute allowance (for example 20% and 75 ms for times, 10% and 10 KB for bytes, 10% and 2 for counts), so noise doesn't fail builds and real regressions do.
- **Save a new baseline only on purpose:** after an improvement lands, on the same machine, with nothing else heavy running, said in the commit. Keep old baselines that reports cite.
- **Budgets on every build:** bundle sizes per entry and per lazily loaded chunk, what must load before the first useful paint, and anything that must never load on a given page. A build over budget fails.

A starting `perf/budgets.json` is in `templates/perf-budgets.json` of this harness.

## Field data

Report LCP, INP and CLS from real visits with buffered `PerformanceObserver`s, once per page, with `sendBeacon` when the page is hidden; numbers and ratings only, never an address or a title on anything private; off the critical path (load the reporter on idle); honour the visitor's opt-outs.

## What needs a measurement

- **Benchmark evidence** (a comparison with the baseline): any claim that something is faster, and any change to the server, the data loader, image or media pipelines, a layout or a page's loading, before it counts as done.
- **Budgets:** a property of every production build; one over budget isn't done, including after a dependency or build change.
- **Neither** for copy or docs changes.

## Limits to state

Development isn't production (measure what people live with, and say which); one machine (compare like with like, and record it); noise (medians, allowances, nothing heavy running alongside); headless timings track real browsers closely but aren't identical.

## Changing performance

1. Measure the baseline. 2. Find the cause with spans, not guesses. 3. Fix the biggest cause. 4. Measure again, same machine, and compare. 5. Record before and after as the evidence beside the Definition of Done row. Change nothing visible for performance's sake without the product owner's agreement.
