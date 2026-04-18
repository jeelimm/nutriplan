# NutriPlan PRD v1.7 — fix-day-selector

## 1. Problem
Dark mode users cannot visually identify the selected day in the day-selector chip row because the active chip's background (`bg-primary/15`) is too faint against dark surfaces, making the highlighted state indistinguishable from unselected chips.

## 2. User Story
As a dark mode user on the Daily View, I want the selected day chip to have a clearly visible highlight, so that I always know which day I'm viewing at a glance.

## 3. Scope (MVP)
- Override the active chip background for dark mode with a higher-opacity primary tint (`dark:bg-primary/30`).
- Remove the decorative box-shadow from the active chip in dark mode (`dark:shadow-none`) since it doesn't render meaningfully on dark surfaces.
- Keep `border-primary` and `text-foreground` states intact for both modes.
- Change applies only to the active/selected state; unselected chip styles are unchanged.
- Fix lives in `components/daily-view.tsx` — no other files touched.

## 4. Out of Scope
- Redesigning the day-selector layout or chip dimensions.
- Adding animations or transitions beyond what already exists.
- Changing colors or styles in light mode.
- Adjusting hover/focus styles.
- Any changes to grocery-list.tsx or other day-display components.

## 5. Acceptance Criteria
1. Given dark mode is enabled, when the user views the Daily View, then the active day chip has a clearly visible green-tinted background (`bg-primary/30` opacity level).
2. Given dark mode is enabled, when the user taps a different day chip, then the newly selected chip immediately shows the highlighted background.
3. Given light mode is enabled, when the user views the Daily View, then the active chip background is unchanged (`bg-primary/15` with the existing drop shadow).
4. User can distinguish the active day chip from inactive chips in dark mode without any ambiguity.
5. `npm run build` passes with no TypeScript or Tailwind errors.

## 6. UX Notes
Active chip classes (daily-view.tsx, `idx === selectedDay` branch):
- Light: `border-primary bg-primary/15 text-foreground shadow-[0_14px_26px_-24px_rgba(38,96,63,0.5)]`
- Dark override: `dark:bg-primary/30 dark:shadow-none`
Primary color: `#26603F` (NutriPlan green, defined in Tailwind config).

## 7. Technical Constraints
- Stack: Next.js 16.2, React 19, TypeScript 5.7, Tailwind CSS v4, shadcn/ui.
- Active chip class string is in `components/daily-view.tsx` inside the `cn()` call on the button inside the day-selector scroll row (~line 497–501).
- Base chip styles (unselected) live in `.dashboard-day-chip` utility class in `app/globals.css` — do NOT modify that class.
- `prompts.json` wrapper: `{ feature, branch, prompts: [...] }`.

## 8. Risks / Open Questions
- Tailwind v4 dark mode relies on the `.dark` class on `<html>` — verify `theme-provider.tsx` applies it correctly (it does via shadcn ThemeProvider).
- `primary/30` may still be too subtle on certain OLED dark themes — accept as-is for MVP; revisit if user feedback surfaces.
