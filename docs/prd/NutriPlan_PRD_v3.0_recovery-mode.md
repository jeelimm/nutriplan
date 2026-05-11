# NutriPlan_PRD_v3.0_recovery-mode

## 1. Problem
Users who skip meals or entire days currently have no way to mark deviations, so the Daily View's calorie/macro totals silently misrepresent what they actually ate — they lose trust in the numbers and abandon the plan after the first off-day.

## 2. User story
As a user following my NutriPlan, I want to mark each meal as eaten or skipped (or skip the whole day in one tap), so that my daily macro totals reflect reality and I can choose how to recover from a deviation.

## 3. Scope (MVP)
- Each meal card in Daily View shows a tappable status pill cycling **Planned → Eaten → Skipped → Planned**.
- An **"I skipped today"** button in the Daily View header sets every meal for the active day to Skipped in one tap (with confirm dialog).
- Daily macro totals (cal/P/C/F) recompute live and show "Eaten X / Target Y" — only meals with status `eaten` contribute to consumed totals.
- When the active day has ≥1 Skipped meal AND consumed kcal is >200 kcal short of target, a **Recovery Nudge** card appears offering "Redistribute over remaining days this week" (info-only, no plan mutation) or "Accept and move on" (dismiss).
- Meal statuses and skipped-day state persist across sessions via Zustand persist.

## 4. Out of scope
- Editing portion size / partial-eat (e.g. "ate half").
- Auto-regenerating a replacement meal when one is Skipped.
- Modifying the grocery list to remove ingredients of Skipped meals.
- Push notifications / scheduled reminders.
- Historical analytics, streaks, weekly recap.

## 5. Acceptance criteria
1. Given Daily View shows the active day, When I tap a meal's status pill, Then it cycles `planned → eaten → skipped → planned` and the pill label + color updates immediately.
2. Given any meal status changes, When the daily totals render, Then `Eaten` totals sum macros from meals whose status is `eaten` only (Skipped and Planned both excluded from consumed line).
3. Given I tap **"I skipped today"** and confirm the dialog, Then every meal for the active day is set to `skipped` and the consumed totals drop to 0.
4. Given ≥1 meal today is `skipped` AND consumed kcal is >200 kcal below target, When Daily View renders, Then a Recovery Nudge card appears with two buttons: "Redistribute over remaining days" and "Accept and move on".
5. Given I tap **Redistribute**, Then the nudge expands to show a per-day kcal/protein bump suggestion across days with index `> selectedDay` in this week; the underlying `weekPlan` macros are NOT mutated.
6. Given I close and reopen the app, When I return to Daily View, Then every meal's status is preserved (verify via `meal-plan-storage` localStorage key).
7. Given a meal has status `eaten` or `skipped`, When I successfully swap it for a new meal, Then the replacement meal's status resets to `planned`.

## 6. UX notes
- **Status pill** — bottom-right of each meal card, 24 px height, fully rounded, text-xs font-medium:
  - Planned: bg `#F1F5F2`, text `#26603F`, label "Planned" / "예정"
  - Eaten: bg `#26603F`, text `#FFFFFF`, Lucide `Check` icon, label "Eaten" / "먹었어요"
  - Skipped: bg `#FCEBEA`, text `#B23A48`, Lucide `X` icon, label "Skipped" / "건너뜀"; also strikethrough the meal name only (not macros).
- **"I skipped today" button** — top-right of Daily View header, shadcn `Button variant="outline" size="sm"`, Lucide `CalendarX` icon, label "I skipped today" / "오늘 다 건너뛰었어요". Triggers shadcn `AlertDialog` with body "Mark all of today's meals as skipped?" / "오늘 식사를 모두 건너뜀으로 표시할까요?" — actions Cancel / Confirm.
- **Daily totals strip** — change current totals row to two lines: `Eaten {x} kcal / Target {y} kcal` with progress bar (`#26603F` fill on `#F1F5F2` track). Macros: `P {x}/{y}g  C {x}/{y}g  F {x}/{y}g`.
- **Recovery Nudge card** — mounted directly above the meal list, only when condition in AC 4 met. Background `#F1F5F2`, left border 4 px `#26603F`, Lucide `Sparkles` icon. Headline: "You're {gap} kcal short today" / "오늘 {gap} kcal 부족해요". Two `Button variant="outline" size="sm"` stacked on mobile, side-by-side on `sm:` breakpoint.

## 7. Technical constraints
- Stack: Next.js 16.2 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui (`AlertDialog`, `Button`, existing `Card`), Zustand v5 with persist, Lucide React.
- **Core types — `lib/meal-store.ts`**:
  - Add `export type MealStatus = "planned" | "eaten" | "skipped"`.
  - Extend `Meal` with `status: MealStatus` (default `"planned"`).
  - Add store actions: `setMealStatus(dayIndex: number, mealIndex: number, status: MealStatus)`, `cycleMealStatus(dayIndex, mealIndex)`, `skipDay(dayIndex)`, `resetDayStatuses(dayIndex)`.
- **Profile / weekPlan migration** — bump `PROFILE_VERSION` from `2` to `3`. Add a `migrate()` branch that, for every meal in persisted `weekPlan`, sets `status = "planned"` if missing. Do NOT discard the existing plan.
- **Swap reset** — inside the existing `swapMeal()` action, the new meal must be inserted with `status: "planned"` regardless of prior state. Touch only this single line of logic.
- **Daily View — `components/daily-view.tsx`** is the only screen file edited. Render status pill on each meal card; render "I skipped today" button + `AlertDialog` in the header; recompute consumed totals from `meals.filter(m => m.status === "eaten")`; mount `<RecoveryNudge />` above the meal list.
- **Recovery Nudge** — new file `components/recovery-nudge.tsx`. Pure presentational component, reads from store. Math computed inline (no new lib helper).
- **i18n** — every new user-facing string supports English default + Korean (`language === "ko"`) following the existing inline-ternary pattern already used in `daily-view.tsx`.
- **prompts.json wrapper** — must be `{ "feature": "recovery-mode", "branch": "feature/recovery-mode", "prompts": [...] }`. Plain array breaks `run-prompts.sh`.
- **Do NOT modify**: `app/api/*`, `components/grocery-list.tsx`, `components/meal-swap-sheet.tsx`, `components/onboarding.tsx`, `lib/nutrition.ts`.

## 8. Risks / open questions
- "Remaining days this week" = days with index `> selectedDay` through `6` in the current `weekPlan` array. If `selectedDay === 6`, the Redistribute option is hidden (only "Accept and move on" shown).
- "I skipped today" hard-overrides individually-Eaten meals — yes, set all to `skipped`. Reversible per-meal afterward via the cycling pill.
- Planned meals do NOT contribute to consumed totals. The gap between Eaten and Target is the visual point. Target stays visible as a ghost number / progress max.
