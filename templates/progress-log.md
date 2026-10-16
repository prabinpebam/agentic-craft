# Progress log and handoff

## The log

A file outside the repository (so it never lands in a commit), one line per meaningful step:

```
YYYY-MM-DD HH:MM [attended|unattended] <stage or task>: <what happened>; <evidence>; <next>
2026-01-31 14:05 [unattended] stage 3: setup flow builds; unit 42 pass, e2e "first run" 3/3; merging
2026-01-31 14:20 [unattended] stage 3: merged a1b2c3d, deploy green; starting 3.4
```

## The handoff (end of an unattended stretch)

```
## Done (with evidence)
- <what a person can do now> — <tests, runs, commits>

## In progress
- <what, how far, the branch>

## Waiting on you
- <decision / account / credential> — options: A (recommended) …, B …; working default in use: …

## Try first
1. <the one thing to open or run, and what you should see>

## Not checked
- <what was deliberately skipped, and why>
```
