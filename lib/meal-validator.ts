type IngredientLike = { name: string; category?: string }
type MealLike = {
  calories: number
  protein: number
  ingredients: IngredientLike[]
  instructions?: string[]
  name?: string
}
type DayPlanLike = {
  day?: string
  meals: MealLike[]
  totalCalories: number
  totalProtein: number
}

export interface SwapCandidateInput {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: { name: string; amount: string; category: string }[]
}

export interface SwapCandidateValidationResult {
  isValid: boolean
  reasons: string[]
}

function withinTolerancePct(value: number, target: number, pct: number): boolean {
  if (target === 0) return true
  return Math.abs(value - target) / target <= pct
}

/**
 * Validates a swap candidate against the original meal and user constraints.
 *
 * Checks:
 * 1. Calories within ±15% of the original meal.
 * 2. Protein, carbs, and fat each within ±20% of the original meal.
 * 3. No ingredients outside the user's selectedIngredients allowlist (when non-empty).
 * 4. Breakfast candidates must not have a dinner-heavy macro profile.
 */
export function validateSwapCandidate(
  candidate: SwapCandidateInput,
  originalMeal: { calories: number; protein: number; carbs: number; fat: number },
  mealSlot: "breakfast" | "lunch" | "dinner",
  userProfile: { selectedIngredients?: string[] }
): SwapCandidateValidationResult {
  const reasons: string[] = []

  // 1. Calories within ±15%
  if (!withinTolerancePct(candidate.calories, originalMeal.calories, 0.15)) {
    reasons.push(
      `Calories (${candidate.calories} kcal) are outside ±15% of the original meal (${originalMeal.calories} kcal).`
    )
  }

  // 2. Protein/carbs/fat within ±20%
  if (!withinTolerancePct(candidate.protein, originalMeal.protein, 0.2)) {
    reasons.push(
      `Protein (${candidate.protein}g) is outside ±20% of the original meal (${originalMeal.protein}g).`
    )
  }
  if (!withinTolerancePct(candidate.carbs, originalMeal.carbs, 0.2)) {
    reasons.push(
      `Carbs (${candidate.carbs}g) are outside ±20% of the original meal (${originalMeal.carbs}g).`
    )
  }
  if (!withinTolerancePct(candidate.fat, originalMeal.fat, 0.2)) {
    reasons.push(
      `Fat (${candidate.fat}g) is outside ±20% of the original meal (${originalMeal.fat}g).`
    )
  }

  // 3. No excluded ingredients — selectedIngredients is the user's allowlist
  const allowedIngredients = Array.isArray(userProfile.selectedIngredients)
    ? userProfile.selectedIngredients
    : []
  if (allowedIngredients.length > 0) {
    const allowedSet = new Set(allowedIngredients.map((i) => i.toLowerCase()))
    for (const ingredient of candidate.ingredients) {
      if (!allowedSet.has(ingredient.name.toLowerCase())) {
        reasons.push(
          `Ingredient "${ingredient.name}" is not in the user's selected ingredients.`
        )
        break
      }
    }
  }

  // 4. Breakfast slot: reject dinner-heavy candidates (high calorie + high fat)
  if (mealSlot === "breakfast" && candidate.calories > 700 && candidate.fat > 30) {
    reasons.push(
      `Candidate (${candidate.calories} kcal, ${candidate.fat}g fat) appears dinner-heavy for a breakfast slot.`
    )
  }

  return { isValid: reasons.length === 0, reasons }
}

export interface MealPlanValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface ValidationContext {
  plan: DayPlanLike[]
  selectedIngredients: string[]
  avoidedIngredients: string[]
  dailyCalorieTarget: number
  dailyProteinTarget: number
  rawClaudeResponse?: unknown
}

type ValidationRule = (context: ValidationContext, result: MealPlanValidationResult) => void

const hasAnyText = (value: unknown): boolean => typeof value === "string" && value.trim().length > 0
const normalizedCategorySet = new Set(["protein", "carbs", "fat", "vegetables", "other"])

const CALORIE_TOLERANCE_KCAL = 400
/** Warn only when daily protein falls below this fraction of target (allows “close enough” plans). */
const PROTEIN_MIN_FRACTION = 0.85

/** Hard-fail only: missing days, missing/empty meals, missing meal name. */
const ruleCriticalStructure: ValidationRule = ({ plan }, result) => {
  if (!Array.isArray(plan) || plan.length === 0) {
    result.errors.push("We didn’t get a full week of meals back—try generating again.")
    return
  }

  for (const day of plan) {
    if (!Array.isArray(day.meals) || day.meals.length === 0) {
      result.errors.push("At least one day came back without meals—try generating again.")
      return
    }
    for (const meal of day.meals) {
      if (!hasAnyText(meal.name)) {
        result.errors.push("Some meals are missing names—try generating again.")
        return
      }

      const instructions = meal.instructions
      const hasRecipe =
        Array.isArray(instructions) &&
        instructions.some((step) => hasAnyText(step))
      if (!hasRecipe) {
        result.warnings.push("Some meals are missing step-by-step instructions—you can still cook from the ingredients.")
      }
    }
  }
}

const ruleAllowedAndAvoidedIngredients: ValidationRule = ({ plan, selectedIngredients, avoidedIngredients }, result) => {
  const allowedSet = new Set(selectedIngredients.map((item) => item.toLowerCase()))
  const avoidedSet = new Set(avoidedIngredients.map((item) => item.toLowerCase()))

  for (const day of plan) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients ?? []) {
        const name = ingredient.name.toLowerCase()
        if (allowedSet.size > 0 && !allowedSet.has(name)) {
          result.warnings.push(`“${ingredient.name}” wasn’t on your picked list—we left it in the plan so nothing breaks.`)
        }
        if (avoidedSet.has(name)) {
          result.warnings.push(`“${ingredient.name}” is on your avoid list—double-check if that works for you.`)
        }
      }
    }
  }
}

const ruleCategorySafetyNet: ValidationRule = ({ plan }, result) => {
  for (const day of plan) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients ?? []) {
        const category = String(ingredient.category ?? "").trim().toLowerCase()
        if (!category) continue
        if (!normalizedCategorySet.has(category)) {
          result.warnings.push(`We’re not sure how to categorize “${ingredient.name}”—the plan still works; sorting may look off.`)
        }
      }
    }
  }
}

const ruleDailyCaloriesAndProtein: ValidationRule = ({ plan, dailyCalorieTarget, dailyProteinTarget }, result) => {
  let hadMacroWarning = false
  for (const day of plan) {
    const dayLabel = hasAnyText(day.day) ? day.day : "Unknown day"
    const calorieDelta = Math.abs(day.totalCalories - dailyCalorieTarget)
    if (calorieDelta > CALORIE_TOLERANCE_KCAL) {
      result.warnings.push(
        `${dayLabel} lands a bit outside your calorie ballpark (about ±${CALORIE_TOLERANCE_KCAL} kcal)—totals can swing day to day.`
      )
      hadMacroWarning = true
    }

    if (day.totalProtein < dailyProteinTarget * PROTEIN_MIN_FRACTION) {
      result.warnings.push(
        `Protein on ${dayLabel} is under your usual target for that day—add a snack or swap a meal if you want it closer.`
      )
      hadMacroWarning = true
    }
  }
  if (hadMacroWarning) {
    result.warnings.unshift("Some days may sit a little above or below your targets—that’s normal for a generated plan.")
  }
}

const ruleGroceryAndComplexity: ValidationRule = ({ plan }, result) => {
  const allIngredients = plan.flatMap((day) => day.meals.flatMap((meal) => meal.ingredients ?? []))
  if (allIngredients.length === 0) {
    result.warnings.push("We didn’t see ingredient lines to build a shopping list from—meals may still be fine to read.")
  }

  for (const day of plan) {
    for (const meal of day.meals) {
      const count = (meal.ingredients ?? []).length
      if (count > 6) {
        result.warnings.push(`“${meal.name ?? "One meal"}” has a longer ingredient list—skip shortcuts or simplify if you want it quicker.`)
      }
    }
  }
}

const rules: ValidationRule[] = [
  ruleCriticalStructure,
  ruleAllowedAndAvoidedIngredients,
  ruleCategorySafetyNet,
  ruleDailyCaloriesAndProtein,
  ruleGroceryAndComplexity,
]

export function validateMealPlan(context: ValidationContext): MealPlanValidationResult {
  console.log("[meal-validator] Raw Claude response before validation:", context.rawClaudeResponse)

  const result: MealPlanValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  for (const [index, rule] of rules.entries()) {
    const errorsBefore = result.errors.length
    const warningsBefore = result.warnings.length
    rule(context, result)
    const ruleName = rule.name || `rule-${index + 1}`
    const rulePassed = result.errors.length === errorsBefore
    const newErrors = result.errors.slice(errorsBefore)
    const newWarnings = result.warnings.slice(warningsBefore)
    console.log("[meal-validator] Rule check:", {
      rule: ruleName,
      passed: rulePassed,
      newErrors,
      newWarnings,
    })
  }

  result.isValid = result.errors.length === 0
  console.log("[meal-validator] Final validation result:", {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
  })
  return result
}
