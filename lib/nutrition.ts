import type { ActivityLevel, DietType, Goal, UserProfile } from "@/lib/meal-store"

type MacroRatios = {
  protein: number
  carbs: number
  fat: number
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.725,
}

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  "lose-fat": -500,
  "gain-muscle": 300,
  recomposition: -200,
}

const DIET_MACRO_RATIOS: Record<DietType, MacroRatios> = {
  keto: { fat: 0.7, protein: 0.25, carbs: 0.05 },
  "high-protein": { protein: 0.4, carbs: 0.35, fat: 0.25 },
  balanced: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  "intermittent-fasting": { protein: 0.3, carbs: 0.35, fat: 0.35 },
}

/**
 * Converts pounds to kilograms when needed.
 */
export function toKg(weight: number, unit: "kg" | "lbs"): number {
  return unit === "lbs" ? weight * 0.453592 : weight
}

/**
 * Assumptions:
 * - Katch-McArdle is used whenever body fat is available/valid.
 * - If body fat is missing/invalid, we fallback to LBM = total body weight to avoid crashes.
 * - Daily calories are never returned below 1200 for safer defaults.
 */
export function calculateNutritionTargets(input: {
  weightKg: number
  bodyFat: number
  activityLevel: ActivityLevel
  goal: Goal
  dietType: DietType
}): { calories: number; macros: UserProfile["macros"] } {
  const bodyFat = Number.isFinite(input.bodyFat) ? input.bodyFat : 0
  const safeBodyFat = Math.min(Math.max(bodyFat, 0), 60)
  const leanBodyMass = input.weightKg * (1 - safeBodyFat / 100)
  const lbmForFormula = leanBodyMass > 0 ? leanBodyMass : input.weightKg

  const bmr = 370 + 21.6 * lbmForFormula
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]
  const adjustedCalories = tdee + GOAL_CALORIE_ADJUSTMENT[input.goal]
  const calories = Math.round(Math.max(1200, adjustedCalories))

  const ratios = DIET_MACRO_RATIOS[input.dietType]

  return {
    calories,
    macros: {
      protein: Math.round((calories * ratios.protein) / 4),
      carbs: Math.round((calories * ratios.carbs) / 4),
      fat: Math.round((calories * ratios.fat) / 9),
      minerals: Math.round(lbmForFormula * 0.05),
    },
  }
}
