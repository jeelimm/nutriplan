# NutriPlan PRD v1.9 — fix-onboarding-arrows

## 1. Problem
The onboarding CTA buttons added in v1.8 append a " →" arrow to labels (e.g. "Continue — Lose Fat →"), making them look visually noisy.

## 2. User story
As a user going through onboarding, I want clean button labels without trailing arrow characters, so that the UI looks polished.

## 3. Scope (MVP)
- Remove the " →" suffix from every onboarding CTA label added in v1.8.
- Affected labels: Activity step (~line 1622), Goal step (~line 1700), Diet step (~line 2021).

## 4. Out of scope
- Changing any other aspect of the button (style, animation, reveal behavior).
- Modifying non-onboarding buttons.

## 5. Acceptance criteria
1. The Activity step CTA reads "Continue — {ActivityName}" with no trailing arrow.
2. The Goal step CTA reads "Continue — {GoalName}" with no trailing arrow.
3. The Diet step CTA reads "Continue — {DietName}" with no trailing arrow.
4. `npm run build` passes with no TypeScript errors.

## 6. UX notes
Remove only the ` →` suffix. Keep the em-dash and the label name.

## 7. Technical constraints
- All changes in `components/onboarding.tsx` only.
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }` with each prompt as an object `{ id, description, prompt }`.

## 8. Risks / open questions
- None.
