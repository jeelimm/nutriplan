# NutriPlan PRD v2.0 — fix-nutrition-route

**Date:** 2026-04-18
**Version:** v2.0
**Slug:** fix-nutrition-route

---

## 1. Problem

Users who search for a custom ingredient not in the built-in catalog receive a silent 404 error because `app/api/claude-nutrition/route.ts` was never created, making the AI ingredient lookup feature completely broken at the call site in `components/onboarding.tsx`.

## 2. User Story

As a user during onboarding, I want to look up a custom ingredient via AI so that I can include foods not in the built-in catalog in my meal plan.

## 3. Scope (MVP)

- Create `app/api/claude-nutrition/route.ts` accepting `{ ingredient: string }` POST body
- Return per-100g nutrition data: `{ name, category, calories, protein, carbs, fat, cost }`
- Use Anthropic SDK with `claude-haiku-4-5-20251001`, `max_tokens: 300`, 20-second `Promise.race` timeout
- Apply defensive parsing for alternate Claude response shapes (`macros.protein` vs `protein`, camelCase vs snake_case, nested vs flat)
- Return `{ error, details }` with status 500 on any failure

## 4. Out of Scope

- Any changes to `components/onboarding.tsx` or other existing files
- Caching or deduplicating ingredient lookups
- Batch ingredient lookup support
- Frontend error state changes
- Ingredient category validation beyond string coercion

## 5. Acceptance Criteria

1. Given `POST /api/claude-nutrition` with `{ ingredient: "spirulina" }`, when called, then it returns `{ name, category, calories, protein, carbs, fat, cost }` with all numeric fields as numbers.
2. Given the route file exists, when `npm run build` runs, then the build passes with no TypeScript errors.
3. Given `ANTHROPIC_API_KEY` is missing, when the route is called, then it returns `{ error, details }` with status 500.
4. Given Claude returns `{ macros: { protein: 20 } }` instead of `{ protein: 20 }`, when parsed, then the route extracts `protein: 20` correctly.
5. Given Claude returns `snake_case` field names (`body_fat`, `net_carbs`), when parsed, then the route maps them correctly.
6. Given Claude takes longer than 20 seconds, when the timeout fires, then the route rejects with `{ error, details }` and status 500.
7. Given `cost` is absent from Claude's response, when parsed, then it defaults to `0`.

## 6. UX Notes

Backend/bug fix only. No UI changes required.

## 7. Technical Constraints

- **File to create:** `app/api/claude-nutrition/route.ts` (Next.js 16.2 App Router)
- **SDK:** `import Anthropic from "@anthropic-ai/sdk"`
- **Model:** `claude-haiku-4-5-20251001` | **max_tokens:** 300
- **Runtime export:** `export const maxDuration = 60`
- **System prompt:** `"Output strict JSON only."`
- **Timeout:** `Promise.race` with 20s reject — same pattern as the other two routes
- **API key:** `process.env.ANTHROPIC_API_KEY` — never hardcoded
- **Error response shape:** `{ error: string, details: string }` with HTTP 500
- **Defensive parsing:** handle `macros.protein`, `macros.carbs`, `macros.fat` vs flat fields; camelCase vs snake_case; default all numeric fields to 0 if absent
- **Do NOT modify** any other file — only create the new route
- **prompts.json wrapper:** `{ feature, branch, prompts: [...] }`

## 8. Risks / Open Questions

- `cost` is not a standard nutrition field — Claude may return `null`, `0`, or omit it entirely. Default to `0`.
- Claude may return `category` values that don't match the catalog's category names — coerce to string, no strict validation needed.
- The `name` Claude returns may differ slightly from the search query (e.g. "Spirulina powder" vs "spirulina") — preserve Claude's name as-is.
