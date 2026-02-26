# /sfexpert

Run the Shining Force Expert improvement cycle N times autonomously.

**Usage:** `/sfexpert [N]` — e.g. `/sfexpert 2` runs the full cycle twice. Default N=1.

**Zero user input required.** All decisions are made autonomously. If a genuine design
impasse arises, an Opus Game Designer agent is spun up to resolve it.

---

## What this skill does

For each of N iterations:
1. **SFExpert Review** — Opus agent audits the codebase and finds 10+ ranked improvements
2. **Architect Plan** — Senior architect agent reads the review and produces a parallel execution plan
3. **Dev Sprints** — Up to 4 parallel coding agents execute the plan (one file each)
4. **Review Gate** — Opus code review agent checks all diffs; FAIL → fix bugs inline; PASS → next iteration

---

## Instructions

When invoked, execute the following **exactly**, replacing `$ARGUMENTS` with the argument
passed (default 1 if none). Run the full loop `N = parseInt($ARGUMENTS || '1')` times.

---

### BEFORE THE FIRST ITERATION

Run these commands to build context:

```bash
git log --oneline -30
cat CLAUDE.md
```

Extract from git log the list of already-implemented features (commit messages summarise
what was done). This becomes the **"already done" exclusion list** passed to the SFExpert
agent in every iteration so it never re-suggests completed work.

---

### PER-ITERATION LOOP (repeat N times)

#### PHASE 1 — SFExpert Opus Review

Launch a **background** Task agent with `subagent_type: "Bash"`, `model: "opus"`.

Prompt template (fill in `{ALREADY_DONE}` from the exclusion list built above,
and update it after each iteration from the new commits):

```
You are a Shining Force / Fire Emblem GBA expert reviewing "Puppy Force", a Phaser 3
browser tactics game (dogs vs cats, 7 chapters). Find improvements to make it feel
MORE like a classic SF/FE game.

## Already implemented — DO NOT suggest these:
{ALREADY_DONE}

## Files to read:
- /home/user/TowerDefense/js/pf/Config.js
- /home/user/TowerDefense/js/pf/Unit.js
- /home/user/TowerDefense/js/pf/scenes/BattleScene.js
- /home/user/TowerDefense/js/pf/scenes/UIScene.js
- /home/user/TowerDefense/js/pf/scenes/VictoryScene.js
- /home/user/TowerDefense/js/pf/ChapterData.js
- /home/user/TowerDefense/js/pf/EnemyAI.js

Read all files. Then output a prioritised improvement list:
- CRITICAL: bugs or game-breaking issues
- MAJOR: missing core SF/FE features with high player-feel impact
- MINOR: polish, balance, QoL

For each item include: description, affected file(s), function/line numbers, concrete fix.
Find at least 10 items total. Rank by player-feel ROI.
```

Wait for this agent to complete before Phase 2.

---

#### PHASE 2 — Architect Plan

Launch a **foreground** Task agent with `subagent_type: "Plan"` (or `"Bash"` with Opus model).

Prompt template (fill in `{REVIEW_OUTPUT}` with the Phase 1 result):

```
You are a senior game architect. You have received a Shining Force expert review of
"Puppy Force". Your job: produce a parallel execution plan for implementing the
improvements in this sprint.

## Review output:
{REVIEW_OUTPUT}

## Constraints:
- Max 4 parallel coding agents per sprint
- Each agent owns EXACTLY one file — no two agents touch the same file simultaneously
- Items that touch the same file must be batched into one agent's spec
- CRITICAL items must be included; pick as many MAJOR items as fit within 4 agents
- MINOR items fill remaining agent slots if space allows

## Output format:
For each agent produce:
  Agent N → file: <path>
  Changes:
    - [item ID] <exact description of change, function name, line range, what to add/change/delete>
    - ...

Also flag any design decision that is genuinely ambiguous. These will be resolved
before coding begins.

Keep specs concrete enough that a coding agent can work from them with NO additional
context. Include relevant line numbers from the review.
```

If the architect flags any ambiguous design decisions, resolve them NOW by launching
an **Opus Game Designer agent**:

```
You are an expert mobile tactics game designer (Shining Force, Fire Emblem GBA era).
You must make a clear, final decision on the following design question for "Puppy Force":

{DESIGN_QUESTION}

State your decision in one sentence and give a brief rationale (2-3 sentences max).
No hedging — pick the best option and commit to it.
```

Incorporate the designer's decision into the architect plan before proceeding.

---

#### PHASE 3 — Parallel Dev Sprint

Launch all agents from the architect plan **simultaneously in a single message**
(multiple Task tool calls). Each agent:
- `subagent_type: "Bash"`, run in background
- Owns exactly one file
- Gets the exact change spec from the architect plan
- Uses this push protocol:
  ```bash
  git add <file>
  git pull --rebase origin claude/puppy-force-game-BhoEA
  git commit -m "<descriptive message>\n\nhttps://claude.ai/code/session_01JbSz53KSzZD5x8azVY35Vc"
  git push -u origin claude/puppy-force-game-BhoEA
  # If push fails with 403: retry with pull --rebase up to 4 times (waits: 2s, 4s, 8s, 16s)
  ```

Wait for ALL agents to complete before Phase 4.

---

#### PHASE 4 — Opus Code Review Gate

Run `git log --oneline -8` to get the sprint commit hashes.

Launch a **foreground** Task agent with `subagent_type: "Bash"`, `model: "opus"`.

Prompt template (fill in `{COMMIT_HASHES}` and `{SPRINT_SUMMARY}`):

```
You are an expert Shining Force / Fire Emblem engineer doing a code review of a
sprint of changes to "Puppy Force" (Phaser 3 browser tactics game).

Sprint commits: {COMMIT_HASHES}
Sprint summary: {SPRINT_SUMMARY}

Read the diffs:
  git show <hash> -- <file>   (for each commit)

Then read full current files if needed for context.

Check for:
- Bugs, logic errors, null dereferences, off-by-one errors
- State machine violations (BS.IDLE / UNIT_SEL / UNIT_MOVED / TARGET_ATK / ANIMATING /
  ENEMY_TURN / VICTORY / DEFEAT)
- Uncleaned event listeners, tweens, graphics objects
- Dead code (features built but never called)
- Interactions between new features that could conflict

Output:
  Overall: PASS or FAIL
  CRITICAL bugs (must fix — list with file:line)
  MEDIUM bugs (should fix — list with file:line)
  LOW/WARN items
```

**If PASS:** Update the "already done" exclusion list with this iteration's commits.
Proceed to the next iteration (or finish if this was the last one).

**If FAIL:** Apply all CRITICAL and MEDIUM fixes directly (inline edits + commit + push),
then confirm the fixes before proceeding. Do NOT re-run the full review — just fix and move on.

---

### AFTER ALL ITERATIONS

Output a summary:
```
SFExpert Skill — Complete
=========================
Iterations completed: N
Commits landed: [list with hashes and one-line descriptions]
Items implemented: [bulleted list from all reviews]
Items deferred (MINOR not reached): [list if any]
```

---

## Guard rails

- **Never suggest or implement** anything already in the exclusion list
- **Never push to a branch other than** `claude/puppy-force-game-BhoEA`
- **Never touch** `index.html` or `main.js` unless a new scene file is being added
  (those files need script tag + scene registration — if needed, batch into one agent)
- **If a coding agent's push keeps failing** after 4 retries: commit the changes locally,
  report the file as "committed but not pushed", and continue — do not block the sprint
- **Max 4 agents per sprint** — if the review has more than 4 files worth of work,
  split into Sprint A and Sprint B within the same iteration, running Sprint B after
  Sprint A's review gate passes
