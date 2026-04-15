import type { ActivityLevel, BodyType, DietType, Goal, Sex, UserProfile, WeightLossPace } from "@/lib/meal-store"

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.725,
}

const WEIGHT_LOSS_DEFICIT_KCAL: Record<WeightLossPace, number> = {
  steady: 550,
  moderate: 820,
  aggressive: 1100,
}

const WEIGHT_LOSS_PACE_KG_PER_WEEK: Record<WeightLossPace, number> = {
  steady: 0.5,
  moderate: 0.75,
  aggressive: 1,
}

const WEIGHT_LOSS_PACE_DISPLAY: Record<WeightLossPace, string> = {
  steady: "Steady",
  moderate: "Moderate",
  aggressive: "Aggressive",
}

const RECOMPOSITION_DEFICIT_KCAL = 200
const RECOMPOSITION_PACE_KG_PER_WEEK = 0.18

// Midpoint body fat % estimates by body type and sex, used when detailed body composition is unavailable.
// Ranges: slim 12–18% (M) / 18–22% (F), average 18–25% (M) / 25–32% (F),
//         athletic 15–20% (M) / 18–22% (F), heavy 25–35% (M) / 32–40% (F)
const BODY_FAT_ESTIMATE: Record<BodyType, { male: number; female: number }> = {
  slim:     { male: 15,   female: 20   },
  average:  { male: 21.5, female: 28.5 },
  athletic: { male: 17.5, female: 20   },
  heavy:    { male: 30,   female: 36   },
}

export function estimateBodyFatFromBodyType(bodyType: BodyType, sex: Sex): number {
  return BODY_FAT_ESTIMATE[bodyType][sex]
}

function resolveWeightLossPace(pace: WeightLossPace | undefined): WeightLossPace {
  if (pace === "steady" || pace === "aggressive") return pace
  return "moderate"
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
 *
 * When `bodyFat` is not provided (undefined), `bodyType` + `sex` are used to
 * estimate body fat % so that the Quick Estimate onboarding path can produce
 * valid targets without requiring detailed body composition inputs.
 *
 * When `heightCm` and `age` are provided, Mifflin-St Jeor BMR is used instead
 * of Katch-McArdle, giving a more accurate baseline for Quick Estimate users.
 */
export function calculateNutritionTargets(input: {
  weightKg: number
  bodyFat?: number
  bodyType?: BodyType
  heightCm?: number
  age?: number
  activityLevel: ActivityLevel
  goal: Goal
  dietType: DietType
  sex?: Sex
  targetWeightKg?: number
  weightLossPace?: WeightLossPace
}): { calories: number; macros: UserProfile["macros"]; calorieFloorApplied: boolean } {
  const sex = input.sex ?? "male"

  const resolvedBodyFat =
    input.bodyFat !== undefined
      ? input.bodyFat
      : input.bodyType !== undefined
        ? estimateBodyFatFromBodyType(input.bodyType, sex)
        : 0

  const lbmForFormula = getLbmKgForNutrition(input.weightKg, resolvedBodyFat)

  // Use Mifflin-St Jeor when height + age are available (Quick Estimate path),
  // otherwise fall back to Katch-McArdle (InBody / detailed stats path).
  let bmr: number
  if (input.heightCm != null && Number.isFinite(input.heightCm) &&
      input.age != null && Number.isFinite(input.age) && input.age > 0) {
    const sexOffset = sex === "female" ? -161 : 5
    bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexOffset
  } else {
    const bmrMultiplier = sex === "female" ? 0.9 : 1
    bmr = 370 + 21.6 * lbmForFormula * bmrMultiplier
  }
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]

  let adjustedCalories: number
  if (input.goal === "gain-muscle") {
    adjustedCalories = tdee + 300
  } else if (input.goal === "recomposition") {
    adjustedCalories = tdee - RECOMPOSITION_DEFICIT_KCAL
  } else {
    const pace = resolveWeightLossPace(input.weightLossPace)
    adjustedCalories = tdee - WEIGHT_LOSS_DEFICIT_KCAL[pace]
  }

  const minCalories = sex === "female" ? 1200 : 1500
  const rawRounded = Math.round(adjustedCalories)
  const calorieFloorApplied = rawRounded < minCalories
  let calories = Math.max(minCalories, rawRounded)

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
    calorieFloorApplied,
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
  | { kind: "estimate"; summaryLine: string; disclaimer: string }

/**
 * Dashboard copy for target weight (optional).
 */
export function getGoalWeightTimeline(
  weightKg: number,
  targetWeightKg: number | undefined,
  goal: Goal,
  unit: "kg" | "lbs",
  weightLossPace?: WeightLossPace
): GoalTimelineInfo {
  const disclaimer = "Estimates vary — your body will find its own pace"

  if (targetWeightKg == null || !Number.isFinite(targetWeightKg)) {
    return { kind: "none" }
  }

  if (goal === "gain-muscle") {
    return {
      kind: "gain-muscle",
      message: "We'll add ~300 kcal to support muscle growth",
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
    const pace = resolveWeightLossPace(weightLossPace)
    const paceKg = WEIGHT_LOSS_PACE_KG_PER_WEEK[pace]
    const weeks = Math.max(1, Math.round(deltaKg / paceKg))
    const paceName = WEIGHT_LOSS_PACE_DISPLAY[pace]
    const weeklyStr =
      unit === "kg"
        ? `~${paceKg}kg/week`
        : `~${(paceKg * 2.20462).toFixed(1)}lb/week`
    return {
      kind: "estimate",
      summaryLine: `${paceName} pace · ${weeklyStr} · ~${weeks} weeks to goal`,
      disclaimer,
    }
  }

  if (goal === "recomposition") {
    const paceKg = RECOMPOSITION_PACE_KG_PER_WEEK
    const weeks = Math.max(1, Math.round(deltaKg / paceKg))
    const weeklyStr =
      unit === "kg"
        ? `~${paceKg.toFixed(1)}kg/week`
        : `~${(paceKg * 2.20462).toFixed(1)}lb/week`
    return {
      kind: "estimate",
      summaryLine: `Gentle recomposition · ${weeklyStr} · ~${weeks} weeks to target`,
      disclaimer: "Scale changes can be slower during recomposition",
    }
  }

  return { kind: "none" }
}
