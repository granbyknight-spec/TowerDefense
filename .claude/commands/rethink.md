# /rethink

Stop a token-expensive approach and find a more efficient one.

**Usage:** `/rethink` — invoke when you notice a task is burning tokens or about to stall

---

## What this skill does

Runs a structured checklist to diagnose why the current approach is expensive,
then proposes a leaner alternative before any more tokens are spent.

---

## Instructions

When invoked, immediately do the following — **do NOT continue the previous approach**:

### Step 1 — Diagnose (output this block)

```
RETHINK TRIGGERED
=================
Current task: [describe what was being attempted]
Expensive pattern detected: [pick one or more]
  [ ] Enumerating N items individually (N = ?)
  [ ] Long sequential reasoning before output
  [ ] Single agent doing work that could be parallel
  [ ] Verbose per-item output when compact form would work
  [ ] Repeated reads/searches that could be cached
  [ ] Large file read when only a section was needed
```

### Step 2 — Apply compression strategies

Work through these in order — use the first one that applies:

**A. Default + Exceptions**
If the output is mostly one value with some exceptions, express it that way.
- Example: "All cells are GRASS (0) except these zones: ..."
- Savings: reduces 832 cells to ~20 zone descriptions

**B. Zones / Regions**
If items cluster spatially or logically, describe the cluster, not each item.
- Example: "WALL rows 11-12, cols 0-6" instead of 14 individual cell entries
- Apply to: grids, file ranges, coordinate sets, repeated patterns

**C. Parallel subagents**
If the task has independent parts, split it. Each agent does one job and returns
a compact result to the orchestrator.
- Example: one agent reads the image → returns zone list; another reads ChapterData → returns spawn positions
- The orchestrator combines results mechanically, no re-analysis needed

**D. Sample + Extrapolate**
If a pattern repeats, analyze a representative sample and apply the rule.
- Example: analyze one row of tiles, confirm the pattern holds, then stamp it across all similar rows

**E. Grep/Glob first**
If searching for something specific, use a targeted tool call instead of reading
whole files. A Grep for "mapGrid" finds the exact line; reading all of ChapterData.js wastes tokens.

**F. Compact output format**
Strip reasoning from the output itself — put it in a brief preamble, then output
numbers/values only with no inline commentary per item.

### Step 3 — Propose the new approach

```
REVISED APPROACH
================
Strategy: [which compression strategy from above]
New process:
  1. [step]
  2. [step]
  ...
Expected output size: [rough estimate, e.g. "~30 lines of zone descriptions vs 832 cells"]
Trade-offs: [anything lost vs original approach, e.g. "less granular — may need manual review of 3 uncertain zones"]
```

### Step 4 — Confirm and proceed

Ask the user:
> "Does this revised approach work, or do you want to adjust it before I continue?"

Wait for confirmation, then execute the revised approach from scratch.

---

## Notes

- This skill is also a standing instruction — you should trigger it yourself whenever
  you notice the red flags in CLAUDE.md's "Token Budget" section, without waiting
  for the user to type `/rethink`
- The goal is to **stop before** the stall, not after — if you estimate the current
  approach will produce >200 lines of analysis, that's the trigger
- When in doubt: zones beat cells, parallel beats sequential, compact beats verbose
