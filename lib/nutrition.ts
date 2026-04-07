import type { ActivityLevel, DietType, Goal, Sex, UserProfile } from "@/lib/meal-store"

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

/**
 * Converts pounds to kilograms when needed.
 */
export function toKg(weight: number, unit: "kg" | "lbs"): number {
  return unit === "lbs" ? weight * 0.453592 : weight
}

/** LBM (kg) for formulas: weightKg × (1 − bodyFat%), capped body fat 0–60%; fallback to total weight if LBM ≤ 0. */
export function getLbmKgForNutrition(weightKg: number, bodyFat: number): number {
  const bf = Number.isFinite(bodyFat) ? bodyFat : 0
  const safeBodyFat = Math.min(Math.max(bf, 0), 60)
  const leanBodyMass = weightKg * (1 - safeBodyFat / 100)
  return leanBodyMass > 0 ? leanBodyMass : weightKg
}

/** Grams of protein per kg LBM from goal + dietType (before min/max clamp on total protein grams). */
export function proteinGPerKgLbm(goal: Goal, dietType: DietType): number {
  if (goal === "lose-fat") {
    if (dietType === "high-protein") return 2.0
    if (dietType === "keto") return 1.4
    if (dietType === "balanced" || dietType === "intermittent-fasting") return 1.6
    return 1.6
  }
  if (goal === "gain-muscle") {
    if (dietType === "high-protein") return 2.2
    if (dietType === "keto") return 1.6
    if (dietType === "balanced" || dietType === "intermittent-fasting") return 1.8
    return 1.8
  }
  if (goal === "recomposition") {
    if (dietType === "high-protein") return 2.0
    return 1.8
  }
  return 1.8
}

function splitRemainingCarbsFatKcal(
  dietType: DietType,
  remainingKcal: number
): { carbKcal: number; fatKcal: number } {
  if (remainingKcal <= 0) return { carbKcal: 0, fatKcal: 0 }

  if (dietType === "balanced" || dietType === "intermittent-fasting") {
    const c = 55 / (55 + 45)
    return { carbKcal: remainingKcal * c, fatKcal: remainingKcal * (1 - c) }
  }
  if (dietType === "high-protein") {
    const c = 45 / (45 + 55)
    return { carbKcal: remainingKcal * c, fatKcal: remainingKcal * (1 - c) }
  }
  const carbCapKcal = 50 * 4
  const carbKcal = Math.min(carbCapKcal, remainingKcal)
  return { carbKcal, fatKcal: remainingKcal - carbKcal }
}

/**
 * LBM-based protein; remaining calories split by diet (after protein).
 * Calorie floor: male 1500, female 1200.
 */
export function calculateNutritionTargets(input: {
  weightKg: number
  bodyFat: number
  activityLevel: ActivityLevel
  goal: Goal
  dietType: DietType
  sex?: Sex
  targetWeightKg?: number
}): { calories: number; macros: UserProfile["macros"] } {
  const lbmForFormula = getLbmKgForNutrition(input.weightKg, input.bodyFat)

  const sex = input.sex ?? "male"
  const bmrMultiplier = sex === "female" ? 0.9 : 1
  const bmr = 370 + 21.6 * lbmForFormula * bmrMultiplier
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]

  let adjustedCalories = tdee + GOAL_CALORIE_ADJUSTMENT[input.goal]
  const targetKg = input.targetWeightKg
  if (targetKg != null && Number.isFinite(targetKg)) {
    const deltaKg = input.weightKg - targetKg
    if (deltaKg > 0) {
      if (input.goal === "lose-fat") adjustedCalories = tdee - 550
      else if (input.goal === "recomposition") adjustedCalories = tdee - 275
    }
  }

  const minCalories = sex === "female" ? 1200 : 1500
  let calories = Math.round(Math.max(minCalories, adjustedCalories))

  const proteinPerKg = proteinGPerKgLbm(input.goal, input.dietType)
  const minProteinG = Math.round(lbmForFormula * 1.2)
  const maxProteinG = Math.round(lbmForFormula * 2.2)
  let proteinG = Math.round(lbmForFormula * proteinPerKg)
  proteinG = Math.min(maxProteinG, Math.max(minProteinG, proteinG))

  const proteinKcal = proteinG * 4
  let remainingKcal = calories - proteinKcal

  if (remainingKcal < 200) {
    calories = Math.round(Math.max(minCalories, proteinKcal + 200))
    remainingKcal = calories - proteinKcal
  }

  let { carbKcal, fatKcal } = splitRemainingCarbsFatKcal(input.dietType, remainingKcal)
  let carbsG = Math.max(0, Math.round(carbKcal / 4))
  let fatG = Math.max(0, Math.round(fatKcal / 9))

  if (input.dietType === "keto" && carbsG > 50) {
    carbsG = 50
    const usedCarbKcal = carbsG * 4
    fatG = Math.max(0, Math.round((remainingKcal - usedCarbKcal) / 9))
  }

  return {
    calories,
    macros: {
      protein: proteinG,
      carbs: carbsG,
      fat: fatG,
      minerals: Math.round(lbmForFormula * 0.05),
    },
  }
}

export type GoalTimelineInfo =
  | { kind: "none" }
  | { kind: "gain-muscle"; message: string }
  | { kind: "past-target"; message: string }
  | { kind: "estimate"; weeks: number; paceLabel: string; disclaimer: string }

/**
 * Dashboard copy for target weight (optional).
 */
export function getGoalWeightTimeline(
  weightKg: number,
  targetWeightKg: number | undefined,
  goal: Goal,
  unit: "kg" | "lbs"
): GoalTimelineInfo {
  const disclaimer = "Estimates vary — your body will find its own pace"

  if (targetWeightKg == null || !Number.isFinite(targetWeightKg)) {
    return { kind: "none" }
  }

  if (goal === "gain-muscle") {
    return {
      kind: "gain-muscle",
      message:
        "Weekly weight targets aren’t a great fit for building muscle — focus on training, protein, and steady fuel.",
    }
  }

  const deltaKg = weightKg - targetWeightKg
  if (deltaKg <= 0) {
    return {
      kind: "past-target",
      message: "You’re at or past your target weight on paper.",
    }
  }

  if (goal === "lose-fat") {
    const paceKg = 0.625
    const weeks = Math.max(1, Math.round(deltaKg / paceKg))
    const pace =
      unit === "kg"
        ? `losing ~${paceKg}kg/week`
        : `losing ~${(paceKg * 2.20462).toFixed(1)}lb/week`
    return {
      kind: "estimate",
      weeks,
      paceLabel: `At this pace: ${pace}`,
      disclaimer,
    }
  }

  if (goal === "recomposition") {
    const paceKg = 0.375
    const weeks = Math.max(1, Math.round(deltaKg / paceKg))
    const pace =
      unit === "kg"
        ? `losing ~${paceKg}kg/week`
        : `losing ~${(paceKg * 2.20462).toFixed(1)}lb/week`
    return {
      kind: "estimate",
      weeks,
      paceLabel: `At this pace: ${pace}`,
      disclaimer,
    }
  }

  return { kind: "none" }
}
