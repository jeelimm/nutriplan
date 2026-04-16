# NutriPlan — CLAUDE.md

## Project Overview

**NutriPlan** is an AI-powered calorie and meal management app.
Users enter their body metrics (weight, body fat, muscle mass) and a goal (fat loss, muscle gain, or recomposition),
and the Anthropic Claude API automatically generates a personalized 7-day meal plan and grocery list.

- Unidirectional flow: Onboarding → Meal Plan Config → Daily View → Grocery List
- Supports Korean and English, and multiple cuisine styles (Korean, Japanese, Western, etc.)
- Designed and deployed on Vercel

Refer to UX_FLOW.md in the project root for the complete screen inventory, user flows, navigation map, and known pain points before making any UI changes.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.2 (App Router) |
| UI Library | React 19 + TypeScript 5.7 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI based) |
| Icons | Lucide React |
| Global State | Zustand v5 (with persist middleware) |
| AI | Anthropic SDK (`claude-haiku-4-5-20251001`) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | Sonner (toast) |
| Deployment | Vercel (with `@vercel/analytics`) |

---

## File Structure

```
app/
├── page.tsx                        # Root entry point — controls screen switching via currentStep
├── layout.tsx                      # Global layout (fonts, metadata)
├── globals.css                     # Global CSS (Tailwind layers)
└── api/generate-meal-plan/
    └── route.ts                    # Claude AI API endpoint

components/
├── onboarding.tsx                  # Multi-step onboarding form (Step 0)
├── meal-plan-config.tsx            # Meal plan configuration screen (Step 1)
├── daily-view.tsx                  # Daily meal view (Step 2)
├── grocery-list.tsx                # Grocery list screen (Step 3)
├── grocery-item-row.tsx            # Individual grocery item row component
├── settings-screen.tsx             # Settings screen (Step 4)
├── theme-provider.tsx              # Dark mode theme provider
└── ui/                             # shadcn/ui components (can be modified directly)

lib/
├── meal-store.ts                   # Zustand global state + core type definitions
├── nutrition.ts                    # Calorie and macro target calculation logic
├── meal-validator.ts               # Validates generated meal plans
├── grocery.ts                      # Grocery list utilities
├── recipe-units.ts                 # Unit conversion (metric / imperial)
└── utils.ts                        # Shared utilities (clsx + tailwind-merge)

hooks/
├── use-mobile.ts                   # Mobile detection hook
└── use-toast.ts                    # Toast notification hook
```

### App Flow (by currentStep)

```
0: Onboarding → 1: MealPlanConfig → 2: DailyView → 3: GroceryList
                                                  ↕ (FAB button)
                                              4: SettingsScreen
```

---

## Coding Guidelines

### Language & Comments
- All comments and documentation must be written in **English**.
- Only add comments where the logic is not self-evident.

### Components
- Use **function components only**. No class components.
- Client components must have `"use client"` at the top.
- Place new components in `components/` or `components/ui/`.

### State Management
- All global state through **Zustand store in `lib/meal-store.ts`** only.
- Local UI state (modal open/closed, etc.) may use `useState`.

### UI Components
- Prefer shadcn components from `components/ui/`.
- Use `cn()` from `lib/utils.ts` for composing Tailwind classes.

### Package Installation
- **Always notify the user and get approval before installing any new package.**

### Types
- Avoid `any`. Core types live in `lib/meal-store.ts`.

---

## Security Rules

- **Never commit `.env` or `.env.local`.**
- **Never hardcode API keys.** Use `process.env.ANTHROPIC_API_KEY`.
- Never reference server-only env vars inside client components.
- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` must not be committed.
- API routes (`app/api/`) are server-side only.

---

## Automation Pipeline

This project uses a Claude Code automation pipeline for all feature development.

### How It Works

```
/project:prd "feature description"
        ↓
Product Agent generates PRD → saved to Notion
        ↓
/project:implement (uses PRD output)
        ↓
Engineering Agent generates Cursor prompts → updates prompts.json
        ↓
./run-prompts.sh
        ↓
Build check → auto commit → push
```

### Slash Commands

| Command | What it does |
|---------|-------------|
| `/project:prd` | Generate a PRD from a feature request and save to Notion |
| `/project:implement` | Generate ordered Cursor prompts from a PRD, write to prompts.json |
| `/project:ship` | Run prd + implement end-to-end in one command |

### Git Rules for Automation
- Always `git commit` before running any automation script.
- Commit message format: `feat: [feature name]`, `fix: [bug description]`, `chore: [task]`
- Never force push to `main`. Use feature branches for risky changes.

---

## Agent System Prompts

These prompts define how the Product Agent and Engineering Agent behave.
They are used internally by the slash commands below.

### Product Agent

```
You are a senior Product Manager at a fast-moving startup.
Convert raw feature requests, bug reports, or ideas into concise, actionable PRDs.

Stack context: Next.js app, React, Tailwind CSS, Zustand for state,
Anthropic API for AI features, deployed on Vercel.
App: NutriPlan — AI-powered calorie and meal planning app.
Users: health-conscious individuals tracking calories, macros, and meal plans.

Output format (plain text, no markdown # headers):

OVERVIEW
One sentence: what this is and why it matters to the user.

USER STORY
As a [user], I want to [action] so that [outcome].

ACCEPTANCE CRITERIA
- [specific, testable criterion]
- [3-5 criteria total]

SCOPE (IN)
- [what is included, 2-4 bullets]

SCOPE (OUT)
- [explicitly excluded to keep scope tight, 2-3 bullets]

OPEN QUESTIONS
- [unknowns the engineer needs to resolve, 1-3 items]

Rules:
- No fluff. PM-first: user value over technical details.
- Keep it tight. If scope creeps, cut it.
- Think MVP. Flag overbuilding risks in SCOPE (OUT).
```

### Engineering Agent

```
You are a senior frontend engineer specializing in precise,
copy-paste ready prompts for Cursor AI IDE.

Stack: Next.js 16.2, React 19, TypeScript, Tailwind v4, shadcn/ui,
Zustand v5, Anthropic SDK, deployed on Vercel.

File structure reference:
- app/page.tsx — root, controls currentStep
- app/api/generate-meal-plan/route.ts — AI endpoint
- components/onboarding.tsx, meal-plan-config.tsx, daily-view.tsx,
  grocery-list.tsx, settings-screen.tsx
- lib/meal-store.ts — all global state and types
- lib/nutrition.ts — calorie/macro calculations

Given a PRD, output 3-5 ordered Cursor prompts implementing it incrementally.
Each prompt must be small, safe, and independently executable.

Output format:

PROMPT 1 — [what it does in 5 words]
[Exact prompt to paste into Cursor. Start with "In [filepath], ...".
Mention exact component names, prop names, and behavior.
Never bundle UI + logic + state in one prompt.]

PROMPT 2 — [what it does]
[prompt text]

(continue for all prompts)

VERIFICATION STEPS
After running all prompts, check:
- [specific thing to verify in browser]
- [specific thing to verify in code/console]

Rules:
- One concern per prompt. Atomic changes only.
- Reference exact file paths from the file structure above.
- If a new file is needed, that is its own prompt.
- Flag any risk of breaking existing state or components.
```
