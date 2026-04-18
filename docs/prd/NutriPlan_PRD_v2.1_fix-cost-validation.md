# NutriPlan PRD v2.1 — fix-cost-validation

**Date:** 2026-04-18
**Version:** v2.1
**Slug:** fix-cost-validation

---

## 1. Problem

Users who search for a custom ingredient via AI during onboarding always see an alert error because `fetchIngredientViaClaude()` in `components/onboarding.tsx` (line 801) treats `cost: 0` as an invalid response — but Claude legitimately returns `0` when it cannot estimate ingredient cost.

## 2. User Story

As a user, I want to look up a custom ingredient by name during onboarding so that it is added to my selection even when Claude cannot estimate its cost.

## 3. Scope (MVP)

- Change the validation on line 801 to only require `name` and `category` to be non-empty strings
- Change the `cost` assignment on line 810 from `cost: data.cost` to `cost: Number(data.cost) || 0`

## 4. Out of Scope

- Modifying `app/api/claude-nutrition/route.ts`
- Changing the `ingredientCatalog.push` pattern or structure
- Frontend error message copy changes
- Any other file besides `components/onboarding.tsx`
- Caching or deduplication of ingredient lookups

## 5. Acceptance Criteria

1. Given Claude returns `{ name: "grass-fed butter", category: "Fat", calories: 717, protein: 0.9, carbs: 0, fat: 81, cost: 0 }`, when user clicks "Look up with AI", then the ingredient is added to the catalog and marked selected.
2. Given Claude returns `{ name: "갈비살", category: "Protein", calories: 250, protein: 22, carbs: 0, fat: 17, cost: 0 }`, when user clicks "Look up with AI", then the ingredient is added successfully.
3. Given Claude returns a response with no `cost` field at all, when parsed, then `cost` defaults to `0` and no error is thrown.
4. Given Claude returns `{ name: "", category: "Fat", cost: 0 }`, when parsed, then `throw new Error("Invalid response")` is still triggered (empty name is still invalid).
5. Given Claude returns `{ name: "chia seeds", category: "", cost: 5 }`, when parsed, then `throw new Error("Invalid response")` is still triggered (empty category is still invalid).
6. Given `npm run build` runs after the change, then it passes with no TypeScript errors.

## 6. UX Notes

No UI changes. The alert message on failure is unchanged.

## 7. Technical Constraints

- **File to edit:** `components/onboarding.tsx` only
- **Line 801 — change from:**
  ```ts
  if (!data.name || !data.category || !data.cost) throw new Error("Invalid response")
  ```
  **To:**
  ```ts
  if (typeof data.name !== "string" || !data.name.trim() || typeof data.category !== "string" || !data.category.trim()) throw new Error("Invalid response")
  ```
- **Line 810 — change from:**
  ```ts
  cost: data.cost,
  ```
  **To:**
  ```ts
  cost: Number(data.cost) || 0,
  ```
- Do NOT touch any other line in the function or file
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }`

## 8. Risks / Open Questions

- `IngredientOption` type may declare `cost` as `number` (non-optional) — after the change, `Number(data.cost) || 0` always satisfies that type, so no TypeScript issue expected.
- The `ingredientCatalog` mutation is a known side effect — do not refactor it here per PRD scope.
