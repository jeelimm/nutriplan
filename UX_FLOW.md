# NutriPlan — UX Flow Document

Generated from codebase analysis. Last updated: 2026-04-16.

---

## Screen Inventory

| Step | Component | File | Description |
|------|-----------|------|-------------|
| 0 | `Onboarding` | `components/onboarding.tsx` | Multi-step wizard collecting body stats, goal, diet, cuisine, and ingredient preferences. Contains two entry paths: Quick Estimate and InBody/Precision. |
| 1 | `MealPlanConfig` | `components/meal-plan-config.tsx` | Shows computed calorie/macro targets, lets user pick meals-per-day, then triggers meal plan generation. |
| 2 | `DailyView` | `components/daily-view.tsx` | 7-day plan dashboard. Shows daily calories/macros, meals list, goal timeline, grocery list (inline view). Contains inline "Edit profile" modal and "Regenerate" confirm modal. |
| 3 | `GroceryList` | `components/grocery-list.tsx` | Full-week grocery list grouped by category with check-off and copy-to-clipboard. Navigated to from `app/page.tsx` via `currentStep === 3`. |
| 4 | `SettingsScreen` | `components/settings-screen.tsx` | App preferences (dark mode, language, unit system), profile quick-edit (goal, activity, diet, cuisines, body stats), plan regeneration, and data reset. |
| — | `MealSwapSheet` | `components/meal-swap-sheet.tsx` | Bottom sheet overlay rendered inside `DailyView`. Shows 3 AI-generated swap candidates with macro diffs. Not a full screen — a drawer. |
| — | `GroceryItemRow` | `components/grocery-item-row.tsx` | Individual row component used inside both `GroceryList` and the inline grocery view in `DailyView`. |
| — | `ThemeProvider` | `components/theme-provider.tsx` | Wraps the app for dark/light mode context. No UI. |

**Root controller:** `app/page.tsx` — renders all screens by toggling `currentStep` (0–4). Steps 0 and 1 use `display: block/none`; steps 2–4 use conditional rendering. A floating Settings FAB is visible on steps 0–3.

---

## User Flows

### Flow 1 — Onboarding: Quick Estimate Path

The Quick Estimate path estimates body fat % and muscle mass from visible body type, so users don't need lab results.

1. App loads → `currentStep === 0` → `Onboarding` renders at step `"quick-estimate"`.
2. User enters: **sex**, **weight**, **height**, **age**, **body type** (lean / average / athletic / heavy-set).
3. User taps "Use quick estimate" → `applyQuickEstimate()` runs:
   - Looks up `quickEstimateMap[sex][bodyType]` → derives estimated `bodyFat %` and `muscleMass`.
   - Sets `firstStep = "quick-estimate"`, advances to `step = "activity"`.
4. **Activity level step** — user picks one of 4 activity levels.
5. **Goal step** — user picks Lose Fat / Gain Muscle / Lean Recomposition.
6. **Target weight step** (conditional):
   - If goal is "lose-fat" or "recomposition": shows target weight input + weight-loss pace selector (Steady / Moderate / Aggressive).
   - User can skip this step entirely.
7. **Cuisine step** — user picks up to 2 cuisine preferences (Western, Korean, Japanese, Chinese, Mediterranean, Asian Fusion).
8. **Diet type step** — user picks Keto / High Protein / Balanced / Intermittent Fasting.
9. **Ingredient mode step** — user picks "Recommend ingredients" (budget presets) or "Choose my own".
10. **Ingredients step**:
    - If "recommend": user picks a budget preset (Low ~$50/wk, Medium ~$80/wk, High ~$120/wk) → ingredients auto-selected.
    - If "custom": user browses catalog by category tabs (Protein / Carbs / Fats / Vegetables), or searches. If a search term isn't in the catalog, `fetchIngredientViaClaude()` calls `/api/claude-nutrition` (see API Calls note below).
    - Minimum valid selection: 2 proteins + 1 carb + 1 fat.
11. User taps "Build my plan" → `handleComplete()`:
    - Calls `calculateMacros()` to compute `dailyCalories` and `macros`.
    - Calls `setUserProfile()` → Zustand store updated, persisted to localStorage.
    - Clears `localStorage["nutriplan-onboarding-draft-v3"]`.
    - Calls `setCurrentStep(1)` → advances to `MealPlanConfig`.

**Draft persistence:** Every state change in onboarding writes to `localStorage["nutriplan-onboarding-draft-v3"]`. On mount, the draft is rehydrated — so a browser refresh mid-onboarding resumes where the user left off.

---

### Flow 2 — Onboarding: InBody / Precision Path

For users who have exact body composition measurements (e.g., InBody scanner results).

1. App loads → `Onboarding` at `"quick-estimate"` step.
2. User taps "Enter exact body stats" → `setStep("body")`, `setFirstStep("body")`.
3. **Body stats step** — user enters exact **weight**, **body fat %**, **muscle mass**, plus **sex** and **unit system** (metric/imperial). All fields validated before advancing.
4. Steps 4–10 are identical to Quick Estimate (activity → goal → target weight → cuisine → diet → ingredients).
5. "Back" from activity step returns to `"body"` step (not `"quick-estimate"`) because `firstStep === "body"`.
6. `handleComplete()` same as Quick Estimate path.

---

### Flow 3 — Meal Plan Generation

Triggered at the end of onboarding and from MealPlanConfig.

1. `MealPlanConfig` renders (step 1):
   - Shows `userProfile.dailyCalories` and macro breakdown from Zustand.
   - User adjusts **meals per day** (2 / 3 / 4 / 5) — live-recomputes macro display.
   - Optional: user can adjust calorie targets inline.
2. User taps "Build my week" → `handleComplete()` in `MealPlanConfig`:
   - Calls `setMealPlanConfig({ dietType, mealsPerDay })`.
   - Recalculates targets via `calculateNutritionTargets()` and calls `setUserProfile()` with updated values.
   - Calls `setCurrentStep(2)` — navigates to `DailyView` immediately.
   - Calls `generateMealPlan()` (async, runs after step change).
3. `DailyView` renders loading state (`isGeneratingMealPlan === true`):
   - Rotating messages every 3 seconds.
   - After 45 seconds, shows a "this is taking longer than usual" warning.
4. `generateMealPlan()` in Zustand (`lib/meal-store.ts`):
   - POSTs to `/api/generate-meal-plan` with full profile payload.
   - On success: maps Claude JSON → internal `DayPlan[]` / `Meal[]` structures.
   - Runs `validateMealPlan()` — if invalid, sets error state and `weekPlan = []`.
   - On failure: sets validation error, shows retry UI.
5. On success → `DailyView` renders the 7-day plan.

**Error state:** If generation fails, `DailyView` shows a "Plan needs another try" panel with "Try again" (re-calls `generateMealPlan`) and "Back to plan setup" (goes to step 1).

---

### Flow 4 — Meal Swap

1. In `DailyView`, each meal card has an "Swap" button (ArrowLeftRight icon).
2. User taps Swap → `setSwapTarget({ meal, dayIndex, mealIndex })` → `MealSwapSheet` opens (bottom sheet).
3. `MealSwapSheet` mounts → `useEffect` triggers on `isOpen`:
   - POSTs to `/api/swap-meal` with `currentMeal`, `mealSlot` (breakfast/lunch/dinner), and `userProfile`.
   - Shows loading spinner.
4. API returns up to 3 candidate meals (validated to ±15% of current meal macros).
5. Each candidate shows name, kcal/macro summary, and color-coded macro diffs vs. current meal.
6. User taps a candidate → `handleSelect()`:
   - Calls `swapMeal(dayIndex, mealIndex, newMeal)` in Zustand → updates `weekPlan` and recalculates day totals.
   - Shows Sonner toast: "Meal updated" + "Grocery list adjusted".
   - Closes the sheet.
7. User can tap "Keep current meal" to dismiss without changes.

---

### Flow 5 — Settings / Profile Update

**Via Settings screen (step 4):**

1. User taps the Settings FAB (bottom-right, visible on steps 0–3) → `setCurrentStep(4)`.
2. `SettingsScreen` renders. Two modes:
   - **No profile yet** (pre-onboarding): Only shows Appearance / Language / Measurement System prefs.
   - **Profile exists** (post-onboarding): Shows full profile + plan settings.
3. Available updates without regeneration:
   - **Appearance**: dark/light mode toggle → `setAppPrefs({ darkMode })` → immediate effect.
   - **Language**: EN / 한국어 → `setAppPrefs({ language })`.
   - **Measurement system**: Metric / Imperial → `setAppPrefs({ unitSystem })`.
   - **Goal**: Pick new goal → `updateNutritionTargets({ goal })` → recalculates calories/macros immediately.
   - **Activity level**: Same as goal — immediate recalculation.
   - **Diet type**: Same — immediate recalculation.
   - **Cuisine preferences**: Up to 2, immediate update.
4. **Body stats update (inline):**
   - User expands the "Body stats" collapsible section.
   - Enters weight / body fat % / muscle mass.
   - Taps "Save body stats" → `handleBodyStatsSave()` → validates inputs → `updateNutritionTargets()` → shows "Saved" confirmation for 3 seconds.
5. **Full profile redo:**
   - "Update my profile" button → `setCurrentStep(0)` → returns to Onboarding.
6. **Regenerate plan:**
   - "Regenerate my plan" button → `handleRegenerate()`:
     - `setCurrentStep(2)` → navigates to DailyView.
     - Calls `generateMealPlan()`.
7. **Clear all data:**
   - `window.confirm()` dialog → `clearAllData()` + `localStorage.removeItem("meal-plan-storage")` → resets to step 0.
8. Back navigation → returns to step 2 (DailyView) if onboarding complete, step 0 otherwise.

**Via "Edit profile" modal in DailyView (step 2):**

1. User taps "Edit profile" button in `DailyView` header → `openEditProfileModal()` pre-fills local state from `userProfile`.
2. Modal allows editing: profile name, weight, body fat %, muscle mass, unit, activity level, goal, cuisine preferences.
3. "Save changes" → `handleSaveProfile()`:
   - Validates fields.
   - Calls `calculateMacros()` → gets new calories/macros.
   - Calls `setUserProfile()`.
   - Closes edit modal, opens regenerate confirm modal.
4. Regenerate confirm modal: "Yes, regenerate" → `handleRegenerateFromProfile()` → calls `generateMealPlan()`. "No, keep current" → dismisses.

---

### Flow 6 — Grocery List View

**Full-week grocery list (step 3):**

1. From `DailyView`, user taps the "Shopping list" button → `setCurrentStep(3)`.
2. `GroceryList` renders: aggregates ingredients from all 7 days, deduplicates, and groups by category.
3. Categories sorted by item count descending. Each category shows an icon, label, item count badge.
4. User taps items to check them off (local `useState` — not persisted).
5. "Copy list" button → `navigator.clipboard.writeText()` with formatted plain-text list.
6. Back button → `setCurrentStep(2)` → returns to DailyView.

**Daily grocery list (inline in DailyView):**

1. In `DailyView`, user taps "Today's shopping list" → `setShowGroceryList(true)`.
2. Inline view renders (same screen, same step) using `currentDay` ingredients only.
3. "Back to meal plan" → `setShowGroceryList(false)`.
4. "Copy list" → clipboard copy of today's ingredients only.

---

## Navigation Map

```
                        ┌─────────────────────────────┐
                        │       app/page.tsx           │
                        │  (controls currentStep 0-4)  │
                        └─────────────────────────────┘
                                      │
               ┌──────────────────────┼──────────────────────────┐
               │                      │                          │
        step=0 │               step=4 │(FAB)              step=4 │(FAB)
               ▼                      ▼                          │
       ┌──────────────┐      ┌────────────────┐                 │
       │  Onboarding  │      │ SettingsScreen  │◄────────────────┘
       │(multi-step   │      │                │
       │ wizard)      │      │ - "Back to      │
       └──────┬───────┘      │   dashboard"   │
              │              │   → step=2     │
    handleComplete()         │ - "Update       │
    setCurrentStep(1)        │   profile"     │
              │              │   → step=0     │
              ▼              └────────────────┘
    ┌──────────────────┐
    │  MealPlanConfig  │ ◄── "Back to onboarding" → step=0
    │   (step=1)       │
    └────────┬─────────┘
             │
    generateMealPlan() +
    setCurrentStep(2)
             │
             ▼
    ┌──────────────────────────────────────────────────────┐
    │                   DailyView (step=2)                  │
    │                                                       │
    │  ┌─────────────┐     ┌──────────────────────────┐   │
    │  │ Day selector│     │ Edit Profile modal        │   │
    │  │ Mon-Sun tabs│     │ (local modal, same screen)│   │
    │  └─────────────┘     └──────────────────────────┘   │
    │                                                       │
    │  ┌──────────────┐    ┌────────────────────────────┐  │
    │  │ Meal cards   │    │ MealSwapSheet (bottom sheet)│  │
    │  │ [Swap] btn   │───►│ /api/swap-meal             │  │
    │  └──────────────┘    └────────────────────────────┘  │
    │                                                       │
    │  "Back to plan        "Shopping list" → step=3        │
    │   setup" → step=1                                     │
    │                                                       │
    │  "Today's list" → inline GroceryList view            │
    │  (showGroceryList=true, still step=2)                 │
    └──────────────────────────────────────────────────────┘
             │
    "Shopping list" button
             │
             ▼
    ┌──────────────────┐
    │   GroceryList    │ ◄── "Back to meal plan" → step=2
    │    (step=3)      │
    │  Full-week view  │
    └──────────────────┘
```

---

## State Management

### Zustand Store (`lib/meal-store.ts`) — key: `meal-plan-storage`

Persisted to `localStorage` via `zustand/middleware/persist`. Only a subset is persisted (see `partialize`).

| Slice | Type | Persisted | Description |
|-------|------|-----------|-------------|
| `currentStep` | `number` (0–4) | No | Active screen index |
| `userProfile` | `UserProfile \| null` | Yes | All body metrics, goals, preferences, calorie/macro targets |
| `weekPlan` | `DayPlan[]` | Yes | 7-day generated meal plan |
| `mealPlanConfig` | `MealPlanConfig \| null` | No | `dietType` + `mealsPerDay` (rebuilt on rehydration) |
| `appPrefs` | `AppPrefs` | Yes | `language`, `unitSystem`, `darkMode` |
| `isGeneratingMealPlan` | `boolean` | No | Loading state for AI generation |
| `mealPlanValidation` | `MealPlanValidationResult` | No | Errors/warnings from plan validator |
| `selectedDay` | `number` (0–6) | No | Active day index in DailyView |
| `swapCandidates` | `SwapCandidate[]` | No | Temp candidates from swap API (unused in store currently — `MealSwapSheet` uses local state) |

**Rehydration logic** (`onRehydrateStorage`): On load, if `userProfile` exists → restore profile + rebuild `mealPlanConfig` + go to step 2 (or step 1 if no `weekPlan`). If no profile → step 0.

**Profile version:** `PROFILE_VERSION = 2`. `migrate()` normalizes the stored profile on version mismatch.

### localStorage Keys

| Key | Owner | Contents |
|-----|-------|----------|
| `meal-plan-storage` | Zustand persist | `appPrefs`, `userProfile`, `weekPlan` |
| `nutriplan-onboarding-draft-v3` | `Onboarding` component | All mid-onboarding form state (step, sex, weight, goals, cuisines, ingredients, etc.) — cleared on `handleComplete()` |

### Component-local State (not persisted)

| Component | Key local state |
|-----------|----------------|
| `DailyView` | `showGroceryList`, `expandedMeals`, `showEditProfileModal`, `showRegenerateConfirmModal`, inline edit fields (weight, bodyFat, etc.), `loadingMessageIndex`, `showLongWaitError`, `swapTarget` |
| `MealSwapSheet` | `candidates`, `loading`, `error` |
| `GroceryList` | `copied`, `checkedItems` (check-off state — lost on navigation) |
| `SettingsScreen` | `bodyStatsOpen`, `weightInput`, `bodyFatInput`, `muscleMassInput`, `bodyStatsError`, `bodyStatsSaved` |
| `MealPlanConfig` | `mealsPerDay`, `isGenerating` |

---

## API Calls

### `POST /api/generate-meal-plan`

| Field | Value |
|-------|-------|
| **Caller** | `generateMealPlan()` in `lib/meal-store.ts` |
| **Triggered from** | `MealPlanConfig.handleComplete()`, `DailyView.handleRegenerateFromProfile()`, `SettingsScreen.handleRegenerate()`, "Try again" error button in `DailyView` |
| **Payload** | `weight`, `bodyFat`, `muscleMass`, `unit`, `goal`, `dietType`, `activityLevel`, `mealsPerDay`, `dailyCalories`, `macros`, `selectedIngredients`, `unitSystem`, `language`, `cuisinePreference` |
| **What it does** | Calls Claude (`claude-haiku-4-5-20251001`) to generate 3 breakfast + 3 lunch + 3 dinner options, then enriches with Open Food Facts nutrition data (parallel lookups, 3000ms timeout), then builds a 7-day rotation |
| **Returns** | `{ days: DayPlan[] }` — each day has `day` (name), `meals[]` (name, calories, protein, carbs, fat, ingredients, recipe, `isEstimated: boolean`) |
| **Timeout** | Claude: 35s; OFF per lookup: 3s |
| **Error handling** | Returns `{ error, details }` with status 500 |

### `POST /api/swap-meal`

| Field | Value |
|-------|-------|
| **Caller** | `MealSwapSheet` component (direct `fetch`, not via Zustand) |
| **Triggered from** | When `MealSwapSheet` opens (`isOpen` effect) |
| **Payload** | `currentMeal` (full Meal object), `mealSlot` ("breakfast"/"lunch"/"dinner"), `userProfile` |
| **What it does** | Calls Claude to generate 3 alternative meals within ±15% of current meal macros, filtered through `validateSwapCandidate()` |
| **Returns** | `{ candidates: SwapCandidate[] }` — up to 3 candidates with name, calories, protein, carbs, fat, ingredients, instructions |
| **Timeout** | Claude: 35s |
| **Error handling** | Returns `{ error, details }` with status 400 or 500 |

### `POST /api/claude-nutrition` ⚠️ Missing Route

| Field | Value |
|-------|-------|
| **Caller** | `fetchIngredientViaClaude()` in `components/onboarding.tsx` |
| **Triggered from** | Onboarding ingredients step, when user searches for an ingredient not in the catalog |
| **Payload** | `{ ingredient: string }` |
| **Expected return** | `Partial<IngredientOption>` with `name`, `category`, `calories`, `protein`, `carbs`, `fat`, `cost` |
| **Status** | **Route file does not exist** (`app/api/claude-nutrition/route.ts` is missing). Calls will 404 and show `window.alert("We couldn't look up that ingredient right now.")` |

---

## Current Pain Points

### 1. Missing `/api/claude-nutrition` route
**File:** `components/onboarding.tsx:801`
The ingredient search fallback calls `fetch("/api/claude-nutrition")` but no `app/api/claude-nutrition/route.ts` exists. Any user who searches for a custom ingredient that isn't in the catalog gets a silent failure and an alert.

### 2. Grocery list check-off state is not persisted
**File:** `components/grocery-list.tsx:49`
`checkedItems` lives in local `useState`. Navigating away (back to DailyView, then returning to GroceryList) resets all checkboxes. Users lose their shopping progress.

### 3. DailyView "Back" goes to MealPlanConfig, not Onboarding
**File:** `components/daily-view.tsx:451`
"Back to plan setup" (`setCurrentStep(1)`) is a regression risk — pressing Back from DailyView triggers regeneration context without warning. There is no "are you sure?" guard when navigating back to step 1.

### 4. Ingredient mode selection is not editable after onboarding
There is no way to change selected ingredients from Settings or DailyView without re-doing the full onboarding flow. The ingredient list is part of `userProfile.selectedIngredients` but no screen surfaces it for post-onboarding edits.

### 5. `mealsPerDay` defaults to 3 in `handleComplete` regardless of MealPlanConfig
**File:** `components/onboarding.tsx:874`
`handleComplete()` in Onboarding hardcodes `mealsPerDay: 3` when creating the profile. The actual `mealsPerDay` selection only happens in `MealPlanConfig`. If a user skips or reloads between steps, they may get a 3-meal plan regardless of their intent.

### 6. No confirmation before regeneration from Settings
**File:** `components/settings-screen.tsx:207`
`handleRegenerate()` immediately triggers plan generation and navigates away without a confirm dialog. Changing goal or activity level in Settings silently recalculates targets but doesn't warn the user that their current week plan will be replaced.

### 7. "Edit Profile" modal in DailyView cannot edit diet type, meals-per-day, or ingredients
**File:** `components/daily-view.tsx:164–233`
The inline edit modal covers: name, weight, body fat %, muscle mass, unit, activity level, goal, and cuisines. Diet type and meals-per-day require going to `MealPlanConfig` (step 1). Ingredients require returning to Onboarding (step 0). This creates inconsistency — some profile fields are editable in-place, others are not.

### 8. Selected day resets on plan regeneration
**File:** `lib/meal-store.ts:389`
`selectedDay` is not persisted. After plan regeneration (which navigates to step 2), the day resets to 0 (Monday). If the user was viewing Thursday, they lose their position.

### 9. Onboarding draft key is hardcoded with version (`-v3`)
**File:** `components/onboarding.tsx:227`
`ONBOARDING_DRAFT_KEY = "nutriplan-onboarding-draft-v3"` — older drafts (v1, v2) accumulate in localStorage and are never cleaned up.

### 10. `GroceryList` accepts `selectedDay` prop but `app/page.tsx` never passes it
**File:** `components/grocery-list.tsx:42–43`, `app/page.tsx:31`
`GroceryList` supports a `selectedDay` prop for single-day view, but it's always rendered without it from the root — so step 3 always shows the full-week list. The single-day grocery view is only reachable through the inline DailyView path.
