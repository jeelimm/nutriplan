import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

export const maxDuration = 30

type CostTier = "$" | "$$" | "$$$"
type IngredientCategory = "protein" | "carbs" | "fats" | "vegetables"

interface IngredientOption {
  name: string
  category: IngredientCategory
  calories: number
  protein: number
  carbs: number
  fat: number
  cost: CostTier
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

function extractJSON(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

function validateCategory(value: unknown): IngredientCategory {
  const v = String(value ?? "").toLowerCase()
  if (v === "protein" || v === "carbs" || v === "fats" || v === "vegetables") return v
  return "protein"
}

function validateCost(value: unknown): CostTier {
  if (value === "$" || value === "$$" || value === "$$$") return value
  return "$"
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Nutrition lookup isn't available right now (configuration missing)." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as { ingredient?: unknown }
    const ingredient = typeof body.ingredient === "string" ? body.ingredient.trim() : ""

    if (!ingredient) {
      return NextResponse.json(
        { error: "ingredient is required and must be a non-empty string." },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `Return nutrition data for the food ingredient: "${ingredient}"

Respond with a single JSON object only — no markdown, no explanation.

Rules:
- All values are per 100g (raw or as typically sold)
- category must be exactly one of: "protein", "carbs", "fats", "vegetables"
- cost must be exactly one of: "$", "$$", "$$$" (typical US grocery cost per 100g)
- calories, protein, carbs, fat are numbers (grams, except calories which is kcal)
- name should be a clean, commonly recognized food name in English

{
  "name": "",
  "category": "",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "cost": "$"
}`

    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "Output strict JSON only. No markdown. No explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Claude timeout")), 20000)
      ),
    ])

    const text = firstTextFromMessageContent(
      response.content as Array<{ type: string; text?: string }>
    )
    if (!text) throw new Error("Claude returned empty content")

    const parsed = JSON.parse(extractJSON(text)) as Partial<IngredientOption>

    const result: IngredientOption = {
      name: String(parsed.name ?? ingredient).trim() || ingredient,
      category: validateCategory(parsed.category),
      calories: Number(parsed.calories) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      cost: validateCost(parsed.cost),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("[claude-nutrition] Error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      {
        error: "Couldn't look up that ingredient right now. Try another name or pick from the list.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
