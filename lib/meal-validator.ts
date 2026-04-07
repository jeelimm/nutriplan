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
