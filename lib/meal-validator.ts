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
const PROTEIN_MIN_FRACTION = 0.6

/** Hard-fail only: missing days, missing/empty meals, missing meal name. */
const ruleCriticalStructure: ValidationRule = ({ plan }, result) => {
  if (!Array.isArray(plan) || plan.length === 0) {
    result.errors.push("Meal plan is missing days data.")
    return
  }

  for (const day of plan) {
    if (!Array.isArray(day.meals) || day.meals.length === 0) {
      result.errors.push("One or more days have no meals.")
      return
    }
    for (const meal of day.meals) {
      if (!hasAnyText(meal.name)) {
        result.errors.push("One or more meals are missing a name.")
        return
      }

      const instructions = meal.instructions
      const hasRecipe =
        Array.isArray(instructions) &&
        instructions.some((step) => hasAnyText(step))
      if (!hasRecipe) {
        result.warnings.push("One or more meals are missing recipe instructions.")
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
          result.warnings.push(`Ingredient "${ingredient.name}" is not in your selected ingredient list.`)
        }
        if (avoidedSet.has(name)) {
          result.warnings.push(`Ingredient "${ingredient.name}" is in your avoided list.`)
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
          result.warnings.push(`Ingredient "${ingredient.name}" has unrecognized category "${ingredient.category}".`)
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
        `Daily calories for ${dayLabel} are outside the ±${CALORIE_TOLERANCE_KCAL} kcal range.`
      )
      hadMacroWarning = true
    }

    if (day.totalProtein < dailyProteinTarget * PROTEIN_MIN_FRACTION) {
      result.warnings.push(
        `Daily protein for ${dayLabel} is below ${Math.round(PROTEIN_MIN_FRACTION * 100)}% of target.`
      )
      hadMacroWarning = true
    }
  }
  if (hadMacroWarning) {
    result.warnings.unshift("Calories may vary slightly from your target.")
  }
}

const ruleGroceryAndComplexity: ValidationRule = ({ plan }, result) => {
  const allIngredients = plan.flatMap((day) => day.meals.flatMap((meal) => meal.ingredients ?? []))
  if (allIngredients.length === 0) {
    result.warnings.push("Grocery list data is missing from the meal plan.")
  }

  for (const day of plan) {
    for (const meal of day.meals) {
      const count = (meal.ingredients ?? []).length
      if (count > 6) {
        result.warnings.push(`"${meal.name ?? "A meal"}" has more than 6 ingredients.`)
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
