import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Nutrition lookup is unavailable (configuration missing).",
          details: "missing api key",
        },
        { status: 500 }
      )
    }

    const { ingredient } = (await req.json()) as { ingredient: string }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `Return per-100g nutrition data for the food ingredient: "${ingredient}"

Respond with a single JSON object only — no markdown, no explanation.

{
  "name": "",
  "category": "protein|carb|fat|vegetable|fruit|dairy|other",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "cost": 0
}`

    const response = await Promise.race([
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "Output strict JSON only.",
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

    // `any` is required here because the AI response structure is unpredictable and must be
    // parsed at runtime — field names, nesting depth, and value types can vary across responses.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = JSON.parse(extractJSON(text))

    const protein = firstNumber(parsed?.protein, parsed?.macros?.protein, parsed?.macros?.p)
    const carbs = firstNumber(parsed?.carbs, parsed?.macros?.carbs, parsed?.macros?.c)
    const fat = firstNumber(parsed?.fat, parsed?.macros?.fat, parsed?.macros?.f)
    const calories = firstNumber(parsed?.calories, parsed?.macros?.calories)
    const cost = firstNumber(parsed?.cost)

    return NextResponse.json({
      name:
        typeof parsed?.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : ingredient,
      category: typeof parsed?.category === "string" ? parsed.category : "other",
      calories,
      protein,
      carbs,
      fat,
      cost: Number.isFinite(cost) ? cost : 0,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: "Could not look up nutrition data. Try again.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
