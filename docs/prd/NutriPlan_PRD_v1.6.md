# NutriPlan_PRD_v1.6

## 1. Problem
Dark mode users cannot tell which day is selected in the DailyView day selector because `bg-primary/15` at 15% opacity over the dark card background (`oklch(0.23 0.012 155)`) produces near-zero contrast against unselected chips.

## 2. User Story
As a user in dark mode, I want the active day chip to have a clearly visible highlight so that I always know which day I am viewing.

## 3. Scope (MVP)
- Add a dark-mode-specific background to the selected day chip in `components/daily-view.tsx` that produces visible contrast.
- Keep the existing `border-primary` and `text-foreground` styles on the active chip in both modes.
- Light mode appearance remains unchanged.

## 4. Out of Scope
- Redesigning the day selector layout or chip dimensions.
- Changing unselected chip colors.
- Any settings screen or other component changes.
- Animation or transition changes.

## 5. Acceptance Criteria
1. Given dark mode is active, when a day chip is selected, its background is visibly distinct from unselected chips (higher contrast than current `bg-primary/15`).
2. Given light mode is active, the selected day chip appearance is pixel-identical to today's production behavior.
3. The `border-primary` border remains visible on the active chip in dark mode.
4. `npm run build` passes with no TypeScript errors after the fix.

## 6. UX Notes
- Current active state classes (light): `border-primary bg-primary/15 text-foreground shadow-[0_14px_26px_-24px_rgba(38,96,63,0.5)]`
- Fix: append `dark:bg-primary/30` (or `dark:bg-accent`) to the active state string — `dark:bg-primary/30` targets the active chip in dark mode specifically.
- Dark mode token reference: `--primary: oklch(0.72 0.13 151)` (lighter green); `--accent: oklch(0.3 0.018 150)` (dark greenish). Either works; `dark:bg-primary/30` is more consistent with the existing pattern.
- Target lines: `components/daily-view.tsx` ~497–502 inside the `cn()` call for the chip button.

## 7. Technical Constraints
- **Edit file:** `components/daily-view.tsx` only. Specifically the `cn()` className block for the active day chip (around line 500).
- No changes to `app/globals.css` required (but acceptable if the engineer prefers a CSS utility approach).
- Tailwind v4, dark mode via `.dark` class (not `media`).
- `prompts.json` wrapper structure: `{ feature, branch, prompts: [...] }`.
- No new packages.

## 8. Risks / Open Questions
- Opacity value (`/25` vs `/30` vs `/35`) may need visual tuning — start with `/30`.
- The hardcoded shadow `rgba(38,96,63,0.5)` is light-mode-tuned; consider adding `dark:shadow-none` or a dark-appropriate shadow if it looks off.
