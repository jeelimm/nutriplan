import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import type { Meal, UserProfile } from "@/lib/meal-store"
import { validateSwapCandidate, validateIngredientConsistency } from "@/lib/meal-validator"

export const maxDuration = 60

function firstNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""))
    if (Number.isFinite(n)) return n
  }
  return 0
}

function extractJSON(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
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

const CUISINE_STYLE_LABELS: Record<string, string> = {
  western: "Western",
  korean: "Korean",
  japanese: "Japanese",
  chinese: "Chinese",
  mediterranean: "Mediterranean",
  "asian-fusion": "Asian fusion",
}

function formatCuisinePreference(cuisines: unknown): string {
  const list = Array.isArray(cuisines)
    ? cuisines.filter((c): c is string => typeof c === "string")
    : []
  if (!list.length) return ""
  return list
    .map((id) => CUISINE_STYLE_LABELS[id] ?? id)
    .filter(Boolean)
    .join(", ")
}

// `any` is required here because the AI response structure is unpredictable and must be
// parsed at runtime — field names, nesting depth, and value types can vary across responses.
function normalizeCandidateMacros(raw: any): {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: { name: string; amount: string; category: string }[]
  instructions: string[]
} {
  const protein = firstNumber(raw?.protein)
  const carbs = firstNumber(raw?.carbs)
  const fat = firstNumber(raw?.fat)
  const calories =
    firstNumber(raw?.calories) || Math.round(protein * 4 + carbs * 4 + fat * 9)

  const rawIngredients = Array.isArray(raw?.ingredients) ? raw.ingredients : []
  // `any` is required because each ingredient object from the AI response has an unpredictable
  // shape — field names like `quantity` vs `amount` vary and must be handled at runtime.
  const ingredients = rawIngredients.map((ing: any) => ({
    name: String(ing?.name ?? "").trim(),
    amount: String(ing?.amount ?? ing?.quantity ?? "").trim(),
    category: String(ing?.category ?? ""),
  }))

  let instructions: string[] = []
  if (Array.isArray(raw?.recipe?.instructions)) {
    instructions = raw.recipe.instructions.map((s: unknown) => String(s))
  } else if (Array.isArray(raw?.instructions)) {
    instructions = (raw.instructions as unknown[]).map((s) => String(s))
  } else if (typeof raw?.recipe?.instructions === "string") {
    instructions = [raw.recipe.instructions]
  } else if (typeof raw?.recipe === "string") {
    instructions = [raw.recipe]
  }

  return {
    name: String(raw?.name ?? "").trim(),
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    instructions,
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Meal swap isn't available on the server right now (configuration missing)." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as {
      currentMeal: Meal
      mealSlot: "breakfast" | "lunch" | "dinner"
      userProfile: UserProfile
    }

    const { currentMeal, mealSlot, userProfile } = body

    if (!currentMeal || !mealSlot || !userProfile) {
      return NextResponse.json(
        { error: "Request must include currentMeal, mealSlot, and userProfile." },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const cuisinePreference =
      formatCuisinePreference(userProfile.cuisinePreference) || userProfile.dietType
    const language = userProfile.language === "ko" ? "ko" : "en"
    const selectedIngredients = Array.isArray(userProfile.selectedIngredients)
      ? userProfile.selectedIngredients.slice(0, 10).join(", ")
      : ""

    const calTarget = firstNumber(currentMeal.calories)
    const proteinTarget = firstNumber(currentMeal.protein)
    const carbsTarget = firstNumber(currentMeal.carbs)
    const fatTarget = firstNumber(currentMeal.fat)

    const calMin = Math.round(calTarget * 0.85)
    const calMax = Math.round(calTarget * 1.15)
    const proteinMin = Math.round(proteinTarget * 0.85)
    const proteinMax = Math.round(proteinTarget * 1.15)
    const carbsMin = Math.round(carbsTarget * 0.85)
    const carbsMax = Math.round(carbsTarget * 1.15)
    const fatMin = Math.round(fatTarget * 0.85)
    const fatMax = Math.round(fatTarget * 1.15)

    const isKorean = /(^|,\s*)korean(\s*,|$)/i.test(cuisinePreference)
    const koreanRule = isKorean
      ? `STRICT RULE: Only Korean dish names. Examples: 볶음밥, 된장국, 제육볶음, 닭갈비, 계란말이, 두부조림.`
      : ""
    const languageRule =
      language === "ko"
        ? "Korean only. All meal names, ingredients, and recipe instructions must be in Korean."
        : "English only. All meal names, ingredients, and recipe instructions must be in English."

    const languageEnforcement =
      language === "ko"
        ? "IMPORTANT: All meal names, ingredient names, and recipe instructions MUST be in Korean. Do NOT use English or any other language."
        : "IMPORTANT: All meal names, ingredient names, and recipe instructions MUST be in English. Do NOT use Korean or any other language unless explicitly requested."

    const prompt = `${languageEnforcement}

Generate exactly 3 alternative ${mealSlot} options to replace "${currentMeal.name}".

User goal: ${userProfile.goal}
Diet style: ${userProfile.dietType}
Cuisine: ${cuisinePreference}
${languageRule}
${koreanRule}
Available ingredients: ${selectedIngredients}
STRICT RULE: Use ONLY the ingredients from the user's original ingredient list. Do NOT introduce any ingredient not in that list, including oils, vegetables, grains, or seasonings.

Each alternative MUST stay within ±15% of these targets:
Calories: ${calTarget} kcal (${calMin}–${calMax})
Protein: ${proteinTarget}g (${proteinMin}–${proteinMax}g)
Carbs: ${carbsTarget}g (${carbsMin}–${carbsMax}g)
Fat: ${fatTarget}g (${fatMin}–${fatMax}g)

Return JSON array only. Each recipe.instructions MUST be an array of separate step strings — never concatenate steps into one string.
[
  {
    "name": "",
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "ingredients": [{"name": "", "amount": "", "category": ""}],
    "recipe": {"prepTime": 0, "cookTime": 0, "instructions": ["Step 1 text.", "Step 2 text.", "Step 3 text."]}
  }
]`

    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: "Output strict JSON only.",
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Claude timeout")), 35000)
      ),
    ])

    const text = firstTextFromMessageContent(
      response.content as Array<{ type: string; text?: string }>
    )
    if (!text) throw new Error("Claude returned empty content")

    const jsonText = extractJSON(text)
    const parsed = JSON.parse(jsonText)

    if (!Array.isArray(parsed)) {
      throw new Error("Claude response is not an array")
    }

    const originalMacros = {
      calories: calTarget,
      protein: proteinTarget,
      carbs: carbsTarget,
      fat: fatTarget,
    }

    const candidates = parsed
      .slice(0, 3)
      .map(normalizeCandidateMacros)
      .filter((c) => {
        const validation = validateSwapCandidate(c, originalMacros, mealSlot, userProfile)
        if (!validation.isValid) {
          console.log(`[swap-meal] Candidate "${c.name}" rejected by validateSwapCandidate:`, validation.reasons)
        }
        return validation.isValid
      })
      .filter((c) => {
        const consistency = validateIngredientConsistency(c as unknown as Meal)
        if (!consistency.valid) {
          console.log(`[swap-meal] Candidate "${c.name}" rejected by validateIngredientConsistency:`, consistency.missing)
        }
        return consistency.valid
      })

    console.log(`[swap-meal] Returning ${candidates.length} candidates for slot: ${mealSlot}`)

    if (candidates.length === 0) {
      return NextResponse.json({
        candidates: [],
        error: "No valid swaps found, try again.",
      })
    }

    return NextResponse.json({ candidates })
  } catch (err) {
    console.error("[swap-meal] Error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      {
        error: "Couldn't generate swap options this time. Try again in a moment.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
