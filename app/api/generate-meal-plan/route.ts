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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 })
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
      const day = requestedDays[0] ?? "Monday"
      const prompt = `Generate a ${body.mealsPerDay}-meal plan for ${day}.
User: ${body.dailyCalories}kcal/day, goal: ${goal}, diet: ${body.dietType}
Allowed ingredients: ${selectedIngredients.join(", ")}
Return JSON: {"days":[{"day":"${day}","meals":[{"name":"","type":"","calories":0,"protein":0,"carbs":0,"fat":0,"ingredients":[{"name":"","amount":"","category":""}],"recipe":{"prepTime":0,"cookTime":0,"instructions":[""]}}]}]}`

      console.log("[generate-meal-plan] Prompt sent to Claude:", prompt)

      const response = await Promise.race([
        anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          system: "Output strict JSON only.",
          messages: [{ role: "user", content: prompt }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Claude timeout")), 25000)
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
      return JSON.parse(jsonText) as { days?: unknown[] }
    }

    async function runInBatches(days: string[], batchSize: number) {
      const results = []
      for (let i = 0; i < days.length; i += batchSize) {
        const batch = days.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(day => callClaudeForDays([day]))
        )
        results.push(...batchResults)
        if (i + batchSize < days.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      return results
    }

    const allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    const chunks = await runInBatches(allDays, 2)
    const days = chunks.flatMap(chunk => chunk.days ?? [])
    const normalizedDays = days
      .map((day: any) => ({
        ...day,
        meals: Array.isArray(day?.meals)
          ? day.meals.map((meal: any) => ({
              ...meal,
              type: normalizeMealType(String(meal?.type ?? "")),
              ingredients: Array.isArray(meal?.ingredients)
                ? meal.ingredients.map((ingredient: any) => ({
                    ...ingredient,
                    category: normalizeCategory(String(ingredient?.category ?? "")),
                  }))
                : [],
            }))
          : [],
      }))

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
        error: "Failed to generate meal plan",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

