# /project:implement

Generate ordered Cursor prompts from a PRD and write them to prompts.json.

## Usage

Option A — pipe from /project:prd output:
```
/project:implement (paste PRD text when prompted)
```

Option B — pass inline:
```
/project:implement "OVERVIEW: ... ACCEPTANCE CRITERIA: ..."
```

## Instructions for Claude Code

Act as the Engineering Agent defined in CLAUDE.md under "Agent System Prompts > Engineering Agent".
Use that system prompt exactly. The input is a PRD in the standard format.

Steps:
1. Read the PRD (from argument or ask user to paste it)
2. Generate 3–5 ordered Cursor prompts using the Engineering Agent format
3. Print all prompts to terminal
4. Write prompts to `prompts.json` in the project root in this exact format:

```json
{
  "prompts": [
    {
      "id": 1,
      "title": "short title of what this prompt does",
      "prompt": "In [filepath], ..."
    },
    {
      "id": 2,
      "title": "...",
      "prompt": "In [filepath], ..."
    }
  ]
}
```

5. Print: `prompts.json updated — ready to run ./run-prompts.sh`

## Notes
- Never bundle UI + logic + state in one prompt
- Each prompt must be independently executable
- If a new file is needed, make it its own prompt
- Reference exact file paths from CLAUDE.md file structure