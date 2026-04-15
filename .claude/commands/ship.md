# /project:ship

Run the full pipeline end-to-end: PRD generation → Cursor prompts → prompts.json update.

## Usage
```
/project:ship "your feature request or bug description"
```

## Instructions for Claude Code

This command chains /project:prd and /project:implement in sequence.

Steps:
1. Run Product Agent (same as /project:prd) on the user's input
   - Output the full PRD to terminal
   - Save to Notion (or skip if unavailable)

2. Run Engineering Agent (same as /project:implement) on the PRD output
   - Output all Cursor prompts to terminal
   - Write to prompts.json

3. Print final summary:

```
PIPELINE COMPLETE
─────────────────────────────
PRD:        [PRD] {feature name} — {date}
Notion:     Saved / Skipped
Prompts:    {N} prompts written to prompts.json
Next step:  ./run-prompts.sh
```

## Example

```
/project:ship "make Quick Estimate the default onboarding path"
```

This will:
- Generate a full PRD for the feature
- Save it to Notion
- Generate 3–5 Cursor prompts
- Write them to prompts.json
- Print instructions to run ./run-prompts.sh

## When to use which command

| Command | Use when |
|---------|----------|
| `/project:prd` | You want to review the PRD before coding starts |
| `/project:implement` | You already have a PRD and just need Cursor prompts |
| `/project:ship` | You trust the process and want to go fast |

## After completing all code changes

Stage and commit locally only.
Run: git add -A && git commit -m "..."
Do NOT run git push under any circumstances.