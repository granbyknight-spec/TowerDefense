# /task

Universal entry point for all work requests. Takes a description, plans parallel
execution, launches dev agents, runs a review gate, and reports.

**Usage:** `/task <description of what to do>`
**Example:** `/task Add a rescue mechanic — allied NPC units on the map that can be recruited mid-battle`

**Zero ambiguity required.** The description can be a one-liner or a paragraph.
Claude Code is the orchestrator — it never edits files directly, only assigns work
to subagents and integrates results.

---

## What this skill does

1. **Context Gather** — reads recent git history and any files referenced in the description
2. **Plan Parallelism** — identifies files/subsystems touched, assigns one agent per file
3. **Dev Sprint** — up to 4 parallel coding agents execute the plan (one file each)
4. **Review Gate** — Opus code review of all sprint diffs; FAIL -> fix inline; PASS -> done
5. **Report** — summary of commits landed and changes made

---

## Instructions

When invoked, execute the following **exactly**, replacing `$ARGUMENTS` with the
full task description passed by the user.

---

### PHASE 0 — Token Budget Check

Before doing anything else, evaluate the task description against CLAUDE.md's
token budget red flags:

- Will this touch >4 files? If so, split into Sprint A / Sprint B (max 4 agents each).
- Does the description imply enumerating a large list/grid? Apply zone/region thinking.
- Is the task actually trivial (1 file, <20 lines of change)? If so, skip the full
  orchestration — launch a single dev agent, run the review gate, and report.

If any red flag fires, run `/rethink` mentally (do NOT invoke the skill — just apply
the compression strategies internally) and adjust the plan before proceeding.

---

### PHASE 1 — Context Gather

Run these commands to build context:

```bash
git log --oneline -10
```

Then identify which files are likely touched by the task. Consult this registry first:

```
battle logic     → js/pf/scenes/BattleScene.js
UI / HUD         → js/pf/scenes/UIScene.js
unit stats       → js/pf/Unit.js, js/pf/Config.js
pathfinding      → js/pf/Pathfinding.js
enemy AI         → js/pf/EnemyAI.js
chapter maps     → js/pf/ChapterData.js
save/load        → js/pf/SaveManager.js
sprites/art      → js/pf/SpriteSheet.js
cutscenes        → js/pf/scenes/CutsceneScene.js
```

Only fall back to Grep/Glob for ambiguous cases. Read only the sections that matter
for planning — do NOT read entire files speculatively.

Produce a **context block** (internal, not shown to user):

```
TASK: $ARGUMENTS
FILES LIKELY TOUCHED: [list of file paths]
RECENT COMMITS: [last 10 one-liners from git log]
KEY CONTEXT: [any relevant code snippets, function signatures, state machine states]
```

---

### PHASE 2 — Parallelism Plan

From the context block, produce an execution plan:

```
EXECUTION PLAN
==============
Agent count: [1-4]

Agent 1 -> file: <absolute path>
  Changes:
    - <concrete description of what to add/change/delete, with function names and line ranges>

Agent 2 -> file: <absolute path>
  Changes:
    - ...

[Agent 3, 4 if needed]

Cross-file dependencies: [list any, or "none"]
Execution order: [all parallel | Agent 1 first, then 2+3 parallel | etc.]
```

Rules:
- **One agent per file.** Never two agents on the same file.
- If the task touches >4 files, split into Sprint A (agents 1-4) and Sprint B (agents 5+).
  Sprint B runs after Sprint A's review gate passes.
- If two changes touch the same file, batch them into one agent's spec.
- Cross-file dependencies (e.g., adding a config key in Config.js that BattleScene.js
  reads) must be handled by ordering: the defining agent runs first, consuming agents
  run after.
- If there are NO cross-file dependencies, all agents launch simultaneously.

---

### PHASE 3 — Parallel Dev Sprint

Launch all agents from the plan **simultaneously in a single message** (multiple
parallel tool calls). Each agent gets this prompt template:

```
You are a coding agent for "Puppy Force", a Phaser 3 browser tactics game (dogs vs cats).

## Your assignment
File: {FILE_PATH}
Changes:
{CHANGE_SPEC}

## Context
{RELEVANT_CONTEXT — snippets from Phase 1, not entire files}

## Rules
- Read the file first. Understand the existing patterns before editing.
- Make ONLY the changes described above. Do not refactor unrelated code.
- Preserve existing code style (indentation, naming conventions, comment style).
- Test your changes mentally: trace through the state machine if touching BattleScene.
- After editing, commit and push using this exact protocol:

  git add {FILE_PATH}
  git pull --rebase origin claude/puppy-force-game-BhoEA
  git commit -m "<descriptive message>

  https://claude.ai/code/session_01JbSz53KSzZD5x8azVY35Vc"
  git push -u origin claude/puppy-force-game-BhoEA

  # If push fails (403, conflict, etc): retry with pull --rebase, up to 4 times
  # Wait 2s, 4s, 8s, 16s between retries
  # If still failing after 4 retries: leave committed locally, report "not pushed"

- Do NOT touch any file other than {FILE_PATH}.
- Do NOT push to any branch other than claude/puppy-force-game-BhoEA.

## End your response with this block (required):
AGENT_RESULT
  status: SUCCESS | PARTIAL | FAILED
  file: {FILE_PATH}
  commit: <hash or "not pushed">
  lines_changed: <N>
  notes: <one line if any, else "none">
```

Wait for ALL agents to complete before Phase 4.

If any agent reports "not pushed", note it — the review gate will still check the
local commits and the orchestrator will push them after review.

---

### PHASE 4 — Opus Code Review Gate

Run `git log --oneline -8` to get the sprint commit hashes.

Note `{PRE_SPRINT_HASH}` = the commit hash just before Phase 3 began (from git log).

Launch a review agent with the following prompt:

```
You are an expert Phaser 3 / tactics game engineer doing a code review of a sprint
of changes to "Puppy Force" (browser Fire Emblem-style game, dogs vs cats).

Sprint commits: {COMMIT_HASHES}
Sprint summary: {TASK_DESCRIPTION_AND_WHAT_AGENTS_DID}

Read the full unified diff of this sprint:
  git diff {PRE_SPRINT_HASH}..HEAD

Then read full current files if needed for context.

Check for:
- Bugs, logic errors, null dereferences, off-by-one errors
- State machine violations (BS.IDLE / UNIT_SEL / UNIT_MOVED / TARGET_ATK /
  TARGET_HEAL / ANIMATING / ENEMY_TURN / VICTORY / DEFEAT)
- Uncleaned event listeners, tweens, graphics objects
- Dead code (features built but never called)
- Interactions between the new changes that could conflict
- Missing null guards on optional data (e.g., unit.weapon, tile.occupant)
- Config references that don't exist yet

Output:
  Overall: PASS or FAIL
  CRITICAL bugs (must fix — list with file:line and description)
  MEDIUM bugs (should fix — list with file:line and description)
  LOW/WARN items (note but don't block)
```

**If PASS:** Proceed to Phase 5.

**If FAIL:** Apply all CRITICAL and MEDIUM fixes directly:
- Edit the affected files inline
- Commit each fix with a descriptive message
- Push using the same retry protocol as Phase 3
- Do NOT re-run the full review — fix and move on

---

### PHASE 5 — Report

Output a summary to the user:

```
Task Complete
=============
Task: $ARGUMENTS
Agents used: [N]
Commits landed:
  - <hash> <message>
  - <hash> <message>
  ...
Review gate: PASS [or FAIL -> fixed]
Files changed:
  - <path> — <one-line summary of changes>
  - ...
```

If any commits were not pushed (from Phase 3 failures), push them now and note it.

---

## Guard rails

- **Never push to a branch other than** `claude/puppy-force-game-BhoEA`
- **Never touch** `index.html` or `main.js` unless a new scene file is being added
  (those files need script tag + scene registration — if needed, batch into one agent)
- **Max 4 agents per sprint** — overflow goes into Sprint B after Sprint A's review gate
- **If a coding agent's push keeps failing** after 4 retries: commit locally, report
  "committed but not pushed", continue — do not block the sprint
- **Token discipline:** if any phase is producing >200 lines of analysis before actual
  output, stop and apply /rethink compression strategies
- **No speculative refactoring.** Agents implement exactly what the plan says. If they
  notice something else that should change, they note it in their output — they do NOT
  change it
- **Cross-file ordering.** If Agent A defines something that Agent B consumes, Agent A
  must complete and push before Agent B starts. The orchestrator enforces this by
  launching them in the correct order, not simultaneously
- **Single-file trivial tasks** skip Phases 2-3 orchestration overhead — one agent,
  one commit, straight to review gate
