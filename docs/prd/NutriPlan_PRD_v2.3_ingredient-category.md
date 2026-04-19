# NutriPlan_PRD_v2.3_ingredient-category

## 1. Problem
Users who search for ingredients not in the built-in catalog lose those ingredients silently — the AI assigns unmapped categories (`dairy`, `fruit`, `other`) that don't correspond to any onboarding tab, making the ingredient invisible after it's added.

## 2. User story
As a user adding a custom ingredient, I want to choose its category myself (Protein / Carb / Fat / Vegetable), so that the ingredient always appears in the correct onboarding tab.

## 3. Scope (MVP)
- After `fetchIngredientViaClaude` resolves, before the ingredient is pushed to `ingredientCatalog`, show a small category-picker UI inline.
- Picker offers exactly four choices: **Protein**, **Carb**, **Fat**, **Vegetable**.
- User must tap one choice to confirm; no default is pre-selected.
- Confirmed category overrides the AI's `category` field entirely.
- Ingredient is pushed to `ingredientCatalog` only after the user picks a category.

## 4. Out of scope
- AI-suggested default / pre-selection (pure user choice only).
- Editing category of existing catalog ingredients.
- Any change to how built-in catalog ingredients are displayed or categorized.
- Persisting user-added ingredients across sessions.
- Multi-select or custom category text input.

## 5. Acceptance criteria
1. Given a user searches a term not in catalog and Claude returns a result, when the result arrives, then a category picker is shown before any ingredient is added.
2. Given the picker is shown, when the user has not yet tapped a category, then the confirm action is unavailable (disabled or absent).
3. Given the user taps "Protein", when they confirm, then the ingredient appears in the Protein tab.
4. Given the user taps "Carb", when they confirm, then the ingredient appears in the Carb tab.
5. Given the user taps "Fat", when they confirm, then the ingredient appears in the Fat tab.
6. Given the user taps "Vegetable", when they confirm, then the ingredient appears in the Vegetable tab.
7. Given the picker is shown, when the user dismisses / cancels, then no ingredient is added to the catalog.

## 6. UX notes
- Render the picker as a **segmented button row** (4 equal-width segments: Protein | Carb | Fat | Vegetable) — consistent with existing pill/tab style in onboarding.
- Show it inline below the search result card, not as a modal or bottom sheet.
- Selected segment: filled background using `bg-primary` (Tailwind semantic — no hardcoded hex).
- Unselected segments: outlined, same border radius as other onboarding controls.
- Below the segment row, show a single confirm button ("Add [ingredient name]") that is `disabled` until a segment is selected.
- Cancel: tapping ✕ on the search result card or a small "Cancel" text link dismisses without adding.
- Mobile-first: segments min height 44px.

## 7. Technical constraints
- All changes confined to `components/onboarding.tsx`. No new files unless a sub-component is needed (place in same file or `components/ui/`).
- Do NOT modify `ingredientCatalog` push logic for built-in ingredients — only the `fetchIngredientViaClaude` post-processing path.
- AI's returned `category` field must be discarded. `IngredientItem.category` written to `ingredientCatalog` must come exclusively from user selection.
- Use `cn()` from `lib/utils.ts` for class composition.
- No new packages.
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }`.

## 8. Risks / open questions
- Locate exact call site of `fetchIngredientViaClaude` in `onboarding.tsx` before inserting state.
- Picker introduces a new async UI state (waiting for user category choice) inside what was fire-and-forget — confirm it doesn't conflict with existing search/loading states.
- If user changes search query while picker is open, pending ingredient must be discarded cleanly.
