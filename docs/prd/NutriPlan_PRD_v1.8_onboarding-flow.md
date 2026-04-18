# NutriPlan PRD v1.8 — onboarding-flow

## 1. Problem
New users stall mid-onboarding because the single-select steps look like persistent form widgets (styled radio cards that highlight but require a separate disabled→enabled CTA tap), making the flow feel like filling out a form rather than making a decisive choice.

## 2. User story
As a new user going through onboarding, I want to tap my choice and immediately see a clear call to action appear, so that each step feels like a decision I'm making rather than a form I'm filling out.

## 3. Scope (MVP)
- For all **single-select steps** (activity level, goal, diet type, body type in quick-estimate, ingredient-mode / "how to start"), hide the "Continue" CTA until an option is selected, then animate it into view (slide-up or fade-in).
- The CTA label should reflect the chosen option (e.g. "Continue — Lose Fat →", "Continue — Moderate →").
- The selection cards keep their existing active styling (green border/fill) so the selected state remains clear.
- The initial "How do you want to start?" screen (quick-estimate vs. body) should auto-advance immediately on tap (no CTA needed — these are navigation actions, not form selections).
- Weight loss pace and cuisine (multi-select) keep their current CTA behavior — they are not in scope.

## 4. Out of scope
- Changing the card visual design (layout, typography, colors) — existing `goalOptionButtonClass`, `activityOptionButtonClass`, `dietOptionButtonClass` CSS stays.
- Auto-advancing steps without a CTA (except the "how to start" screen).
- Cuisine step changes (multi-select with 1–2 limit, already has appropriate CTA).
- Ingredients step changes (multi-select with validation requirements).
- Target-weight step changes (has optional skip + input, not a selector step).

## 5. Acceptance criteria
1. Given user is on the Activity step and has not selected an option, the "Continue with this activity" CTA is not visible (display: none or height: 0).
2. When user taps an activity option, the CTA animates into view (transition ≥ 150ms) and is immediately tappable.
3. Given user is on the Goal step and has not selected a goal, the CTA is hidden; when they tap a goal card, the CTA appears with label "Continue — [Goal Name] →".
4. Given user is on the Diet step, same CTA hide/reveal behavior as activity and goal.
5. Given user is on the Quick Estimate body type sub-section, the "Set my targets" CTA is hidden until a body type is selected, then reveals.
6. Given user is on the Ingredient Mode step, the CTA is hidden until one of the two options is chosen, then reveals.
7. Given user is on the "How do you want to start?" entry screen, tapping "Quick Start" or "Precise Setup" immediately navigates without requiring a second CTA tap (already the case — verify no regression).
8. `npm run build` passes with no TypeScript errors.

## 6. UX notes
- CTA reveal animation: `transition-all duration-200` with `max-h-0 opacity-0 overflow-hidden` → `max-h-20 opacity-100` when selection is made. Use Tailwind conditional classes, not JS animation libraries.
- CTA label pattern: `"Continue — {label} →"` for activity/goal/diet. For body type: keep `"Set my targets"`. For ingredient-mode: `"Continue →"`.
- CTA container: wrap the existing `<OnboardingPrimaryCta>` in a `<div>` with the transition classes. Do not change the button itself or its existing `className` logic.
- Do NOT show a "nothing selected" placeholder or ghost button — the CTA simply does not exist in the DOM until selection.
- Mobile: the revealed CTA should not require scrolling — existing card lists are short enough. No sticky footer needed.

## 7. Technical constraints
- All changes are in `components/onboarding.tsx` — no other files need editing.
- Use existing `cn()` from `lib/utils.ts` for class composition.
- The `OnboardingPrimaryCta` component is at line ~361 in `onboarding.tsx` — wrap its call sites in each step, not the component definition itself.
- Steps affected and their current CTA location:
  - `activity` step: CTA at ~line 1607
  - `goal` step: CTA at ~line 1683
  - `diet` step: locate analogously (Step 6 of 8)
  - `quick-estimate` body type section: CTA "Set my targets" at ~line 1510
  - `ingredient-mode` step: locate analogously (Step 7 of 8)
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }`.

## 8. Risks / open questions
- The CTA reveal via Tailwind `max-h` transition requires a fixed `max-h` value — use `max-h-[72px]` to contain the button height without layout shift.
- Confirm the `ingredient-mode` step exists and has a single-select pattern before modifying it.
