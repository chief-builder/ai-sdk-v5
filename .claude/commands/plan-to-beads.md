# Convert Plan to Beads Issues

You have just created an implementation plan (either in plan mode or in conversation). Convert it to tracked beads issues with proper dependencies.

## Your Workflow

### Step 1: Identify the Plan
Look back in the conversation for the implementation plan. If no plan exists, ask the user to provide one or enter plan mode first.

### Step 2: Save the Full Plan
Save the complete plan to a markdown file:
- Location: `docs/plans/<feature-slug>-plan.md`
- Use kebab-case for the filename (e.g., `user-authentication-plan.md`)
- Include all implementation details, design decisions, and context

### Step 3: Extract Tasks
Parse the plan and identify:
- **Epic**: The overall feature/goal (if plan has multiple major components)
- **Tasks**: Individual actionable items
- **Dependencies**: Which tasks block others

### Step 4: Create Beads Issues
For each item, run `bd create` with appropriate flags:

```bash
# For the epic (if applicable)
bd create "Epic Title" --type=epic -d "Overview. Full plan: docs/plans/<slug>-plan.md"

# For each task
bd create "Task Title" \
  --type=task \
  --priority=<0-4> \
  -d "Brief description. See docs/plans/<slug>-plan.md#section for details" \
  --parent=<epic-id>  # if under an epic
```

### Step 5: Set Up Dependencies
After creating issues, link dependencies:

```bash
bd dep add <dependent-issue> <blocking-issue>
# Example: "Write tests" depends on "Implement feature"
bd dep add <test-issue-id> <feature-issue-id>
```

### Step 6: Verify
Run `bd list --status=open` to confirm issues were created, then `bd ready` to show the dependency graph.

## Priority Mapping
- P0: Critical/blocking
- P1: High priority
- P2: Normal (default)
- P3: Low priority
- P4: Backlog

## Type Mapping
| Plan Element | Beads Type |
|--------------|------------|
| Overall feature | `epic` |
| Major component | `feature` |
| Implementation step | `task` |
| Defect to fix | `bug` |
| Maintenance work | `chore` |

## Output Format
After creating issues, summarize:
1. Plan file location
2. List of created issues with IDs
3. Dependency graph (which blocks which)
4. What's ready to start (`bd ready` output)

## Example

Given a plan like:
```
1. Add user authentication
   1.1 Create user model
   1.2 Implement JWT service (needs user model)
   1.3 Add login endpoint (needs JWT)
   1.4 Add registration endpoint (needs JWT)
2. Write tests (needs all of above)
```

You would:
1. Save to `docs/plans/user-authentication-plan.md`
2. Create:
   - Epic: "Add user authentication"
   - Task: "Create user model" (parent: epic)
   - Task: "Implement JWT service" (parent: epic, depends on user model)
   - Task: "Add login endpoint" (parent: epic, depends on JWT)
   - Task: "Add registration endpoint" (parent: epic, depends on JWT)
   - Task: "Write authentication tests" (depends on login + registration)
3. Report the created structure
