type IngredientLike = { name: string }
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
}

type ValidationRule = (context: ValidationContext, result: MealPlanValidationResult) => void

const hasAnyText = (value: unknown): boolean => typeof value === "string" && value.trim().length > 0

const ruleStructure: ValidationRule = ({ plan }, result) => {
  if (!Array.isArray(plan) || plan.length === 0) {
    result.errors.push("Meal plan is missing days/meals data.")
    return
  }

  for (const day of plan) {
    if (!hasAnyText(day.day) || !Array.isArray(day.meals) || day.meals.length === 0) {
      result.errors.push("Meal plan day structure is invalid.")
      return
    }
    for (const meal of day.meals) {
      if (!hasAnyText(meal.name) || !Array.isArray(meal.ingredients) || !Array.isArray(meal.instructions)) {
        result.errors.push("Meal recipe structure is incomplete.")
        return
      }
    }
  }
}

const ruleAllowedAndAvoidedIngredients: ValidationRule = ({ plan, selectedIngredients, avoidedIngredients }, result) => {
  const allowedSet = new Set(selectedIngredients.map((item) => item.toLowerCase()))
  const avoidedSet = new Set(avoidedIngredients.map((item) => item.toLowerCase()))

  for (const day of plan) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const name = ingredient.name.toLowerCase()
        if (allowedSet.size > 0 && !allowedSet.has(name)) {
          result.errors.push(`Ingredient "${ingredient.name}" is not in your selected ingredient list.`)
          return
        }
        if (avoidedSet.has(name)) {
          result.errors.push(`Ingredient "${ingredient.name}" is in your avoided list.`)
          return
        }
      }
    }
  }
}

const ruleDailyCaloriesAndProtein: ValidationRule = ({ plan, dailyCalorieTarget, dailyProteinTarget }, result) => {
  for (const day of plan) {
    const calorieDelta = Math.abs(day.totalCalories - dailyCalorieTarget)
    if (calorieDelta > 150) {
      result.errors.push(`Daily calories for ${day.day} are outside the ±150 kcal range.`)
      return
    }

    if (day.totalProtein < dailyProteinTarget * 0.8) {
      result.errors.push(`Daily protein for ${day.day} is below 80% of target.`)
      return
    }
  }
}

const ruleGroceryAndComplexity: ValidationRule = ({ plan }, result) => {
  const allIngredients = plan.flatMap((day) => day.meals.flatMap((meal) => meal.ingredients))
  if (allIngredients.length === 0) {
    result.errors.push("Grocery list data is missing from the meal plan.")
    return
  }

  for (const day of plan) {
    for (const meal of day.meals) {
      if (meal.ingredients.length > 6) {
        result.warnings.push(`"${meal.name ?? "A meal"}" has more than 6 ingredients.`)
      }
    }
  }
}

const rules: ValidationRule[] = [
  ruleStructure,
  ruleAllowedAndAvoidedIngredients,
  ruleDailyCaloriesAndProtein,
  ruleGroceryAndComplexity,
]

export function validateMealPlan(context: ValidationContext): MealPlanValidationResult {
  const result: MealPlanValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  for (const rule of rules) {
    rule(context, result)
  }

  result.isValid = result.errors.length === 0
  return result
}
