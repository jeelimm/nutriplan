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

const CUISINE_STYLE_LABELS: Record<string, string> = {
  western: "Western",
  korean: "Korean",
  japanese: "Japanese",
  chinese: "Chinese",
  mediterranean: "Mediterranean",
  "asian-fusion": "Asian fusion",
}

/** Short cuisine line only — keeps prompts small. */
function buildCuisineLine(cuisines: unknown): string {
  const list = Array.isArray(cuisines) ? cuisines.filter((c): c is string => typeof c === "string") : []
  if (!list.length) return ""
  const names = list.map((id) => CUISINE_STYLE_LABELS[id] ?? id).filter(Boolean)
  if (!names.length) return ""
  const label = names.join(" and ")
  if (names.length === 1) {
    return `\nCuisine style: ${label}. Use locally available ${label} ingredients and dish names.`
  }
  return `\nCuisine style: ${label}. Use locally available ingredients and authentic dish names for these styles.`
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
      cuisinePreference?: string[]
      dailyCalories: number
      macros: { protein: number; carbs: number; fat: number }
      selectedIngredients: string[]
    }

    const anthropic = new Anthropic({ apiKey })

    const selectedIngredients = Array.isArray(body.selectedIngredients) ? body.selectedIngredients : []

    const goal =
      body.goal === "lose-fat" || body.goal === "gain-muscle" || body.goal === "recomposition" || body.goal === "lean-recomposition"
        ? body.goal === "lean-recomposition"
          ? "recomposition"
          : body.goal
        : "recomposition"

    const callClaudeForDays = async (requestedDays: string[]) => {
      const daysList = requestedDays.join(", ")
      const units = body.unitSystem === "metric" ? "metric (g, ml, °C)" : "imperial (oz, cups, °F)"
      const perMeal = Math.round(body.dailyCalories / body.mealsPerDay)
      const calLo = body.dailyCalories - 150
      const calHi = body.dailyCalories + 150

      const prompt = `${body.mealsPerDay} meals/day for: ${daysList}. Target ${body.dailyCalories} kcal/day (${calLo}–${calHi} per day); ~${perMeal} kcal/meal. Goal: ${goal}. Diet: ${body.dietType}. Units: ${units}.
Ingredients (prefer): ${selectedIngredients.join(", ")}.${buildCuisineLine(body.cuisinePreference)}

Return JSON only, shape: {"days":[{"day":"Monday","meals":[{"name":"str","type":"Breakfast|Lunch|Dinner|Snack","calories":N,"protein":N,"carbs":N,"fat":N,"ingredients":[{"name":"str","amount":"str","category":"str"}],"recipe":{"prepTime":N,"cookTime":N,"instructions":["str"]}}]}]} — one days[] entry per: ${daysList}. No foods/item/kcal keys.`

      console.log("Prompt length:", prompt.length)

      const response = await Promise.race([
        anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          system: "Output strict JSON only.",
          messages: [{ role: "user", content: prompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Claude timeout")), 40000)
        ),
      ])

      const text = response.content?.[0]?.text
      console.log("[generate-meal-plan] Raw Claude response before parsing:", text)
      if (!text) throw new Error("Claude returned empty content")

      function extractJSON(text: string): string {
        // Remove markdown code blocks
        const cleaned = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim()
        return cleaned
      }

      const jsonText = extractJSON(text)
      const parsed = JSON.parse(jsonText) as { days?: unknown[] }
      if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
        console.error(
          "[generate-meal-plan] Chunk missing or empty days array. Raw text:",
          text
        )
        throw new Error(
          "Claude response chunk has no days: expected a non-empty days array for this request"
        )
      }
      return parsed
    }

    const [firstChunk, secondChunk] = await Promise.all([
      callClaudeForDays(["Monday", "Tuesday", "Wednesday"]),
      callClaudeForDays(["Thursday", "Friday", "Saturday", "Sunday"]),
    ])
    const days = [
      ...(Array.isArray(firstChunk.days) ? firstChunk.days : []),
      ...(Array.isArray(secondChunk.days) ? secondChunk.days : []),
    ]
    const coercedDays = applyClaudeResponseNormalizer(days)
    const normalizedDays = coercedDays.map((day: any) => ({
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

