# NutriPlan — CLAUDE.md

## Project Overview

**NutriPlan** is an AI-powered calorie and meal management app.
Users enter their body metrics (weight, body fat, muscle mass) and a goal (fat loss, muscle gain, or recomposition),
and the Anthropic Claude API automatically generates a personalized 7-day meal plan and grocery list.

- Unidirectional flow: Onboarding → Meal Plan Config → Daily View → Grocery List
- Supports Korean and English, and multiple cuisine styles (Korean, Japanese, Western, etc.)
- Designed and deployed on Vercel

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

public/                             # Static assets
styles/                             # Additional style files
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
- All comments and documentation should be written in **English**.
- Only add comments where the logic is not self-evident. Do not add comments to obvious code.

### Components
- Use **function components only**. Class components are not allowed.
- Client components must have the `"use client"` directive at the top of the file.
- Place new components in `components/` or `components/ui/` depending on their role.

### State Management
- All global state must be managed **exclusively through the Zustand store in `lib/meal-store.ts`**.
- When new state is needed, add the types and actions to `meal-store.ts`.
- Local UI state (e.g., modal open/closed) may use `useState`.

### UI Components
- For common UI elements (buttons, inputs, cards, etc.), **prefer shadcn components from `components/ui/`**.
- If a needed component does not exist in shadcn, add it to `components/ui/`.
- Use the `cn()` helper from `lib/utils.ts` for composing Tailwind classes.

### Package Installation
- **Always notify the user and get approval before installing any new package.**
- Do not add new packages if the existing dependencies can solve the problem.

### Types
- Avoid using `any`. If unavoidable, add a comment explaining why.
- Core domain types (`UserProfile`, `Meal`, `DayPlan`, etc.) are defined and managed in `lib/meal-store.ts`.

---

## Important Notes

### Security
- **Never commit `.env` or `.env.local` files.**
- **Never hardcode API keys in source code.** Always reference them via environment variables (e.g., `process.env.ANTHROPIC_API_KEY`).
- Never reference server-only environment variables (e.g., `ANTHROPIC_API_KEY`) directly inside client components.

### General
- `node_modules/`, `.next/`, and `tsconfig.tsbuildinfo` should not be committed.
- API routes (`app/api/`) are server-side only. Keep all sensitive logic inside them.
- The meal generation model is currently `claude-haiku-4-5-20251001`. To change it, update the `model` field in `route.ts`.
