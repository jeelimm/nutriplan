# NutriPlan_PRD_v3.1_fix-protein-targets

## 1. Problem
Protein targets in `lib/nutrition.ts` are below evidence-based ranges for fat loss and ketogenic dieters (e.g. `lose-fat` + `keto` returns 1.4 g/kg LBM, and the global minimum clamp is 1.2 g/kg LBM), so users in a caloric deficit are at meaningful risk of avoidable muscle loss while following NutriPlan.

## 2. User story
As a NutriPlan user in a deficit, I want my computed protein target to reflect current sports-nutrition evidence so my plan preserves lean mass.

## 3. Scope (MVP)
- Raise `proteinGPerKgLbm()` values for `lose-fat` across all diet types to evidence-based ranges (Helms 2014 / ISSN 2017).
- Raise `proteinGPerKgLbm()` value for `gain-muscle` + `keto` to match the general muscle-gain floor (1.8 g/kg LBM).
- Raise the protein floor clamp inside `calculateNutritionTargets()` from `1.2 × LBM` to `1.6 × LBM`. Max clamp stays at `2.2 × LBM`.
- Newly generated plans (and any in-app recalculation via Edit Profile) reflect the new values immediately.
- No new UI strings, no new screens, no API route changes.

## 4. Out of scope
- Force-recomputing macros for existing persisted `userProfile` rows on app load (a `PROFILE_VERSION` bump would invalidate stored plans — keep it at 3).
- Changing `gain-muscle` defaults outside the keto branch (already evidence-based).
- Changing `recomposition` defaults (already 1.8 — within range).
- Changing carb/fat split logic in `splitRemainingCarbsFatKcal()`.
- Localized warning copy or any user-facing notice that the protein target moved.

## 5. Acceptance criteria
1. Given a user with `goal = "lose-fat"` and `dietType = "keto"`, When `calculateNutritionTargets()` runs, Then `macros.protein` is computed using **1.8** g/kg LBM (not 1.4) before clamping.
2. Given a user with `goal = "lose-fat"` and `dietType` in `["balanced", "intermittent-fasting", "high-protein"]` or undefined-default, When `calculateNutritionTargets()` runs, Then the per-kg multiplier returned by `proteinGPerKgLbm()` is **1.8** for balanced/IF/default and **2.2** for high-protein.
3. Given a user with `goal = "gain-muscle"` and `dietType = "keto"`, When `proteinGPerKgLbm()` runs, Then it returns **1.8** g/kg LBM (not 1.6).
4. Given any user whose `LBM × proteinPerKg` falls below `LBM × 1.6`, When `calculateNutritionTargets()` clamps, Then the final `proteinG` is at least `Math.round(LBM × 1.6)` (and still at most `LBM × 2.2`).
5. `proteinGPerKgLbm("gain-muscle", "balanced") === 1.8` and `proteinGPerKgLbm("recomposition", "high-protein") === 2.0` — both remain unchanged.
6. Existing persisted user profiles continue to load without migration errors (PROFILE_VERSION stays at 3; no field shape change in `UserProfile`).
7. `npm run build` passes with zero TypeScript or lint errors.

## 6. UX notes
Pure backend / nutrition-math fix. No visible UI changes. The new numbers will surface the next time the user (a) regenerates the meal plan or (b) edits profile (Edit Profile modal in `daily-view.tsx`) and triggers a recalc.

## 7. Technical constraints
- Stack: Next.js 16.2, React 19, TypeScript, Tailwind v4, shadcn/ui, Zustand, Anthropic SDK.
- **The ONLY file edited** is `lib/nutrition.ts`. Specifically:
  - `proteinGPerKgLbm(goal, dietType)` — update return values for the `lose-fat` branch and the `gain-muscle` + `keto` sub-branch only.
  - `calculateNutritionTargets()` — replace the literal `1.2` in `const minProteinG = Math.round(lbmForFormula * 1.2)` with `1.6`. Leave the `2.2` max clamp untouched.
- **Do NOT** bump `PROFILE_VERSION` in `lib/meal-store.ts` (currently `3` after the recovery-mode feature). Existing persisted profiles must continue to load with their stored `macros.protein` values.
- **Do NOT** edit: `lib/meal-store.ts`, any `app/api/*` route, `components/*`, `lib/meal-validator.ts`, `lib/grocery.ts`. Their inputs/outputs are unchanged.
- **Do NOT** change exports or function signatures of `proteinGPerKgLbm` or `calculateNutritionTargets` — only the numeric literals inside them.
- `prompts.json` wrapper structure required: `{ "feature": "fix-protein-targets", "branch": "feature/fix-protein-targets", "prompts": [...] }`.

## 8. Risks / open questions
- Existing persisted plans will retain their old (lower) protein numbers until the user manually regenerates or saves the Edit Profile modal. Decision: accept this — silent retro-recomputation could surprise users mid-week. The next meal-plan regen picks up the new numbers automatically.
- The `lose-fat` + high-protein bump (2.0 → 2.2) could push some lean users into very high per-meal protein gram counts. The existing `2.2 × LBM` max clamp already caps this — so this is a no-op in practice for that cohort. Verify mentally before committing.
- No telemetry on previous protein adherence rates, so this is a deliberate evidence-based default change, not data-driven tuning.
