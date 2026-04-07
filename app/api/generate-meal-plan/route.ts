import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

export const maxDuration = 60

function ensureNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function safeLower(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : ""
}

function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase()
  if (c.includes("protein") || c === "dairy" || c === "meat" || c === "seafood") return "Protein"
  if (c.includes("carb") || c === "grain" || c === "fruit" || c === "starch") return "Carbs"
  if (c.includes("fat") || c === "oil" || c === "nut") return "Fat"
  if (c.includes("veg")) return "Vegetables"
  return "Other"
}

function normalizeMealType(type: string): string {
  const t = type.toLowerCase()
  if (t === "breakfast") return "Breakfast"
  if (t === "lunch") return "Lunch"
  if (t === "dinner") return "Dinner"
  if (t === "snack") return "Snack"
  return type
}

function firstNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""))
    if (Number.isFinite(n)) return n
  }
  return 0
}

function normalizeIngredientsForResponse(meal: any): any[] {
  if (Array.isArray(meal?.ingredients)) return meal.ingredients
  if (Array.isArray(meal?.ingredientList)) return meal.ingredientList
  if (typeof meal?.ingredients === "string") {
    return meal.ingredients.split(",").map((s: string) => ({
      name: s.trim(),
      amount: "",
      category: "",
    }))
  }
  return []
}

function normalizeRecipeForResponse(meal: any) {
  const r = meal?.recipe ?? {}
  const prepTime = firstNumber(r.prepTime, r.prep_time, meal?.prepTime)
  const cookTime = firstNumber(r.cookTime, r.cook_time, meal?.cookTime)
  let instructions: string[] = []
  if (Array.isArray(r.instructions)) {
    instructions = r.instructions.map((s: unknown) => String(s))
  } else if (Array.isArray(meal?.instructions)) {
    instructions = meal.instructions.map((s: unknown) => String(s))
  } else if (typeof r.instructions === "string") {
    instructions = [r.instructions]
  } else if (typeof meal?.instructions === "string") {
    instructions = [meal.instructions]
  }
  return { prepTime, cookTime, instructions }
}

/** Map Claude alternate shapes (foods/item/kcal) before standard normalization. */
function macrosFromIngredientKcal(kcal: number, category: string, name: string) {
  const t = `${category} ${name}`.toLowerCase()
  if (
    /protein|chicken|egg|eggs|fish|beef|turkey|yogurt|dairy|meat|tuna|salmon|shrimp|pork|lentil|tofu/.test(
      t
    )
  ) {
    return { p: kcal / 4, c: 0, f: 0 }
  }
  if (/carb|rice|oat|oats|potato|fruit|grain|bread|pasta|banana|honey|quinoa|granola/.test(t)) {
    return { p: 0, c: kcal / 4, f: 0 }
  }
  if (/fat|oil|nut|nuts|avocado|butter|seed|seeds|peanut/.test(t)) {
    return { p: 0, c: 0, f: kcal / 9 }
  }
  const third = kcal / 3
  return { p: third / 4, c: third / 4, f: third / 9 }
}

function normalizeClaudeMealAlternatives(meal: any): any {
  const m = { ...meal }
  const hasFoods = Array.isArray(m.foods) && m.foods.length > 0
  const hasIngredients = Array.isArray(m.ingredients) && m.ingredients.length > 0
  const rawList =
    hasIngredients ? m.ingredients : hasFoods ? m.foods : []

  let sumIngredientKcal = 0
  let estP = 0
  let estC = 0
  let estF = 0

  const ingredients = rawList.map((row: any) => {
    const name = String(row?.name ?? row?.item ?? "").trim()
    const amount = String(row?.amount ?? row?.quantity ?? row?.qty ?? "").trim()
    const category = String(row?.category ?? "")
    const kcal = firstNumber(row?.kcal, row?.calories)
    if (kcal > 0) {
      sumIngredientKcal += kcal
      const add = macrosFromIngredientKcal(kcal, category, name)
      estP += add.p
      estC += add.c
      estF += add.f
    }
    return { name, amount, category }
  })

  delete m.foods
  m.ingredients = ingredients

  const mealCal = firstNumber(m.calories)
  if (mealCal === 0 && sumIngredientKcal > 0) {
    m.calories = Math.round(sumIngredientKcal)
  }

  if (firstNumber(m.protein) === 0) {
    m.protein = Math.round(estP)
  }
  if (firstNumber(m.carbs) === 0) {
    m.carbs = Math.round(estC)
  }
  if (firstNumber(m.fat) === 0) {
    m.fat = Math.round(estF)
  }

  return m
}

function applyClaudeResponseNormalizer(days: any[]): any[] {
  if (!Array.isArray(days)) return []
  return days.map((day: any) => ({
    ...day,
    meals: Array.isArray(day?.meals) ? day.meals.map(normalizeClaudeMealAlternatives) : [],
  }))
}

const ROTATION_DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

/** Per day: [breakfastIndex, lunchIndex, dinnerIndex] into 3-option pools (0..2). */
const MEAL_ROTATION: readonly [number, number, number][] = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 1, 2],
]

function cloneMealForDay(meal: any): any {
  return JSON.parse(JSON.stringify(meal))
}

function coercePool(arr: unknown, label: string): any[] {
  if (!Array.isArray(arr)) {
    throw new Error(`Claude response missing ${label} array`)
  }
  if (arr.length < 3) {
    throw new Error(`Claude returned fewer than 3 ${label}`)
  }
  return arr.slice(0, 3).map(normalizeClaudeMealAlternatives)
}

function buildWeekDaysFromPools(breakfasts: any[], lunches: any[], dinners: any[]): any[] {
  return ROTATION_DAY_NAMES.map((dayName, dayIdx) => {
    const [bi, li, di] = MEAL_ROTATION[dayIdx]
    const b = cloneMealForDay(breakfasts[bi])
    const l = cloneMealForDay(lunches[li])
    const d = cloneMealForDay(dinners[di])
    b.type = "Breakfast"
    l.type = "Lunch"
    d.type = "Dinner"
    return { day: dayName, meals: [b, l, d] }
  })
}

function firstTextFromMessageContent(
  content: Array<{ type: string; text?: string }> | undefined
): string | undefined {
  if (!Array.isArray(content)) return undefined
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") return block.text
  }
  return undefined
}

function adjustMacros(
  days: any[],
  targets: { calories: number; protein: number; carbs: number; fat: number }
) {
  return days.map((day) => {
    if (!Array.isArray(day.meals) || day.meals.length === 0) return day

    const totalFat = day.meals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0)
    const totalCarbs = day.meals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0)

    const fatRatio = targets.fat > 0 ? totalFat / targets.fat : 1
    const carbsRatio = targets.carbs > 0 ? totalCarbs / targets.carbs : 1

    if (fatRatio < 0.8 && targets.fat > 0) {
      const fatDeficit = targets.fat - totalFat
      const fatPerMeal = Math.round(fatDeficit / day.meals.length)
      day.meals = day.meals.map((meal: any) => {
        if (!Array.isArray(meal.ingredients)) meal.ingredients = []
        meal.ingredients.push({
          name: "Olive oil",
          amount: `${Math.round((fatPerMeal * 1000) / 884)}ml`,
          category: "Fat",
        })
        meal.fat = (meal.fat || 0) + fatPerMeal
        return meal
      })
    }

    if (carbsRatio < 0.8 && targets.carbs > 0) {
      const carbsDeficit = targets.carbs - totalCarbs
      const carbsPerMeal = Math.round(carbsDeficit / day.meals.length)
      day.meals = day.meals.map((meal: any) => {
        if (!Array.isArray(meal.ingredients)) meal.ingredients = []
        meal.ingredients.push({
          name: "White rice",
          amount: `${Math.round((carbsPerMeal * 100) / 28)}g cooked`,
          category: "Carbs",
        })
        meal.carbs = (meal.carbs || 0) + carbsPerMeal
        return meal
      })
    }

    day.meals = day.meals.map((meal: any) => {
      const p = Number(meal.protein) || 0
      const c = Number(meal.carbs) || 0
      const f = Number(meal.fat) || 0
      meal.calories = Math.round(p * 4 + c * 4 + f * 9)
      return meal
    })
    day.totalCalories = day.meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0)

    return day
  })
}

const CUISINE_STYLE_LABELS: Record<string, string> = {
  western: "Western",
  korean: "Korean",
  japanese: "Japanese",
  chinese: "Chinese",
  mediterranean: "Mediterranean",
  "asian-fusion": "Asian fusion",
}

function formatCuisinePreference(cuisines: unknown): string {
  const list = Array.isArray(cuisines) ? cuisines.filter((c): c is string => typeof c === "string") : []
  if (!list.length) return ""
  return list.map((id) => CUISINE_STYLE_LABELS[id] ?? id).filter(Boolean).join(", ")
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Meal generation isn’t available on the server right now (configuration missing)." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as {
      weight: number
      bodyFat: number
      muscleMass: number
      unit: "kg" | "lbs"
      goal: "lose-fat" | "gain-muscle" | "lean-recomposition" | "recomposition"
      dietType: "keto" | "high-protein" | "balanced" | "intermittent-fasting"
      activityLevel: "sedentary" | "light" | "moderate" | "very-active"
      mealsPerDay: 2 | 3 | 4 | 5
      unitSystem?: "metric" | "imperial"
      language?: "en" | "ko"
      cuisinePreference?: string[]
      dailyCalories: number
      macros: { protein: number; carbs: number; fat: number }
      selectedIngredients: string[]
    }

    const anthropic = new Anthropic({ apiKey })

    const selectedIngredients = Array.isArray(body.selectedIngredients) ? body.selectedIngredients : []

    const dailyCalories = ensureNumber(body.dailyCalories)
    const targetProtein = ensureNumber(body.macros?.protein)
    const targetCarbs = ensureNumber(body.macros?.carbs)
    const targetFat = ensureNumber(body.macros?.fat)
    const mealsPerDay = body.mealsPerDay
    const cuisinePreference =
      formatCuisinePreference(body.cuisinePreference) || body.dietType
    const language = body.language === "ko" ? "ko" : "en"

    function extractJSON(text: string): string {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim()
      return cleaned
    }

    const ingredientsSnippet = selectedIngredients.slice(0, 10).join(",")

    const perMealCal = Math.round(dailyCalories / mealsPerDay)
    const perMealP = Math.round(targetProtein / mealsPerDay)
    const perMealC = Math.round(targetCarbs / mealsPerDay)
    const perMealF = Math.round(targetFat / mealsPerDay)

    const prompt = `Generate exactly:
- 3 breakfast options
- 3 lunch options
- 3 dinner options

${cuisinePreference} cuisine.
${language === "ko" ? "Korean" : "English"} only.
Each meal targets:
Cal:${perMealCal}
P:${perMealP}g
C:${perMealC}g
F:${perMealF}g
Use only: ${ingredientsSnippet}

Return JSON:
{
  "breakfasts": [meal, meal, meal],
  "lunches": [meal, meal, meal],
  "dinners": [meal, meal, meal]
}

Each meal: {"name":"","type":"","calories":0,
"protein":0,"carbs":0,"fat":0,
"ingredients":[{"name":"","amount":"","category":""}],
"recipe":{"prepTime":0,"cookTime":0,
"instructions":[""]}}`

    console.log("[generate-meal-plan] Prompt chars:", prompt.length)

    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: "Output strict JSON only.",
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Claude timeout")), 35000)
      ),
    ])

    const text = firstTextFromMessageContent(response.content as Array<{ type: string; text?: string }>)
    if (!text) throw new Error("Claude returned empty content")

    const jsonText = extractJSON(text)
    const parsed = JSON.parse(jsonText) as {
      breakfasts?: unknown
      lunches?: unknown
      dinners?: unknown
      breakfast?: unknown
      lunch?: unknown
      dinner?: unknown
    }

    const breakfasts = coercePool(parsed.breakfasts ?? parsed.breakfast, "breakfasts")
    const lunches = coercePool(parsed.lunches ?? parsed.lunch, "lunches")
    const dinners = coercePool(parsed.dinners ?? parsed.dinner, "dinners")

    const days = buildWeekDaysFromPools(breakfasts, lunches, dinners)
    const coercedDays = applyClaudeResponseNormalizer(days)
    const macroAdjustedDays = adjustMacros(coercedDays, {
      calories: dailyCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
    })
    const normalizedDays = macroAdjustedDays.map((day: any) => ({
      ...day,
      meals: Array.isArray(day?.meals)
        ? day.meals.map((meal: any) => {
            const macros = meal?.macros ?? meal?.macro ?? {}
            const nutrition = meal?.nutrition ?? {}
            const recipe = normalizeRecipeForResponse(meal)
            const rawIngredients = normalizeIngredientsForResponse(meal)
            return {
              ...meal,
              calories: firstNumber(meal?.calories, macros.calories, nutrition.calories),
              protein: firstNumber(meal?.protein, macros.protein, nutrition.protein),
              carbs: firstNumber(meal?.carbs, macros.carbs, nutrition.carbs),
              fat: firstNumber(meal?.fat, macros.fat, nutrition.fat),
              type: normalizeMealType(String(meal?.type ?? "")),
              ingredients: rawIngredients.map((ingredient: any) => ({
                name: String(ingredient?.name ?? ingredient?.item ?? ingredient?.ingredient ?? "").trim(),
                amount: String(ingredient?.amount ?? ingredient?.quantity ?? ingredient?.qty ?? "").trim(),
                category: normalizeCategory(String(ingredient?.category ?? "")),
              })),
              recipe,
            }
          })
        : [],
    }))

    if (normalizedDays[0]?.meals?.[0]) {
      console.log(
        "[generate-meal-plan] Final first meal before return:",
        JSON.stringify(normalizedDays[0].meals[0], null, 2)
      )
    }
    console.log(
      "[generate-meal-plan] Final object before return:",
      JSON.stringify({ days: normalizedDays }, null, 2)
    )

    return NextResponse.json({
      days: normalizedDays,
    })
  } catch (err) {
    console.error("Full error:", JSON.stringify(err, null, 2))
    console.error(
      "[generate-meal-plan] Exact error message:",
      err instanceof Error ? err.message : String(err)
    )
    return NextResponse.json(
      {
        error: "Couldn’t build a meal plan this time. Try again in a moment.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

