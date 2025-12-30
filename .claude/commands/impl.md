---
description: Implementation mode with beads integration
---

# Implementation Mode with Beads

Arguments: $ARGUMENTS

## Step 1: Understand the Work

First, gather context about what we're implementing.

**If $ARGUMENTS provided**: Use that as the task description.
**If no arguments**: Ask the user:
- "What are you implementing today?"
- "Is there an existing beads issue for this work?"

## Step 2: Clarify Work Style

Ask the user about their preferred workflow:

1. **Single task focus**: Working on one issue at a time
2. **Parallel tasks**: Multiple related tasks simultaneously
3. **Exploration mode**: Investigating/spiking before committing to approach
4. **Bug hunt**: Fixing multiple small issues in one session

Based on their answer, adjust tracking strategy:
- Single task: One `in_progress` issue, strict focus
- Parallel: Multiple `in_progress` allowed, track in TodoWrite too
- Exploration: Create spike issue, file discovered issues as you go
- Bug hunt: Create umbrella issue or work through existing bug list

## Step 3: Set Up Tracking

Check existing beads status:
```bash
bd ready      # Available work
bd blocked    # Stuck items
bd stats      # Overall picture
```

Then either:
- **Link to existing issue**: `bd update <id> --status=in_progress`
- **Create new issue**: `bd create "Title" --type=task --priority=2 -d "Description"`

## During Implementation

### Golden Rule: File Discovered Issues Immediately

When you find something that's NOT your current task:

| Discovery | Command |
|-----------|---------|
| Bug | `bd create "Fix: [bug]" --type=bug --priority=1` |
| Tech debt | `bd create "Refactor: [what]" --type=chore --priority=3` |
| Missing feature | `bd create "Add: [feature]" --type=feature --priority=2` |
| Blocker | `bd create "Blocker: [what]" --type=task --priority=1` then `bd dep add <current> <blocker>` |
| Security issue | `bd create --type=bug --priority=0` + **FIX NOW** |

### Decision Points

When discovering issues, ask the user:
- "Found [issue]. Should I file it and continue, or address it now?"
- "This looks like scope creep. Want me to file it for later?"
- "This blocks our work. Should I switch focus?"

### Status Updates

Keep beads in sync with reality:
```bash
bd update <id> --status=in_progress  # Starting
bd close <id>                        # Completing
bd close <id> --reason="..."         # Closing with context
```

## Session Close Protocol

Before declaring work complete, ALWAYS run:

```bash
git status              # Review changes
git add <files>         # Stage code
bd sync                 # Sync beads state
git commit -m "..."     # Commit code
bd sync                 # Catch any new beads
git push                # Push to remote
```

## Quick Reference

```bash
# Find work
bd ready                           # What's available
bd show <id>                       # Issue details
bd list --status=in_progress       # Active work

# Track work
bd update <id> --status=in_progress
bd close <id>

# File discoveries
bd create "Title" --type=<type> --priority=<0-4> -d "..."
bd dep add <dependent> <blocker>

# Stay synced
bd sync
```

## Anti-Patterns

- Working without active issue tracking
- Finding issues but not filing them
- Scope creep without user approval
- Ending session without `bd sync` and `git push`
- Forgetting to close completed issues
