# NutriPlan PRD v2.2 — fix-duplicate-ingredient

**Date:** 2026-04-18
**Version:** v2.2
**Slug:** fix-duplicate-ingredient

---

## 1. Problem

Users who click "Look up with AI" more than once for the same ingredient trigger React duplicate key warnings and see the ingredient list appear broken because `ingredientCatalog.push()` in `fetchIngredientViaClaude()` runs unconditionally on every successful API call.

## 2. User Story

As a user, I want to click "Look up with AI" multiple times for the same ingredient so that it is added once and stays selected without causing UI errors.

## 3. Scope (MVP)

- Guard `ingredientCatalog.push()` with a `.some()` check so the same ingredient name is never pushed twice
- `addIngredientFromSearch(data.name)` continues to run on every success (so repeat clicks still keep the ingredient selected)

## 4. Out of Scope

- Refactoring `ingredientCatalog` from a module-level `const` to `useState`
- Modifying `app/api/claude-nutrition/route.ts` or any other file
- Case-insensitive deduplication (exact name match is sufficient for now)
- Debouncing or disabling the button during in-flight requests

## 5. Acceptance Criteria

1. Given "grass-fed butter" is looked up twice, when both calls succeed, then `ingredientCatalog` contains exactly one entry named "grass-fed butter".
2. Given "grass-fed butter" is already in `ingredientCatalog`, when the user clicks "Look up with AI" again, then `addIngredientFromSearch("grass-fed butter")` still runs and the ingredient remains selected.
3. Given the fix is applied, when `npm run build` runs, then it passes with no TypeScript errors.
4. Given any ingredient lookup succeeds, when the ingredients list renders, then the browser console produces zero "Encountered two children with the same key" React warnings.

## 6. UX Notes

No UI changes. No copy changes.

## 7. Technical Constraints

- **File to edit:** `components/onboarding.tsx` only
- **Change:** In `fetchIngredientViaClaude`, wrap the `ingredientCatalog.push({...})` block (currently around line 803) with:
  ```ts
  if (!ingredientCatalog.some((item) => item.name === data.name)) {
    ingredientCatalog.push({ ... })
  }
  ```
- Keep `addIngredientFromSearch(data.name)` **outside** the if block — it must always execute
- Do NOT modify the `.push()` arguments — only wrap them
- Do NOT refactor `ingredientCatalog` to `useState`
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }`

## 8. Risks / Open Questions

- Name comparison is case-sensitive — if Claude returns "Grass-Fed Butter" vs "grass-fed butter" on two calls, dedup will miss it. Acceptable for now per out-of-scope decision.
- `addIngredientFromSearch` behavior on repeat calls should be verified — it should be idempotent (ingredient already selected = no-op or re-select).
