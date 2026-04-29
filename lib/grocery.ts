import type { Ingredient } from "@/lib/meal-store"

export interface GroceryItem {
  name: string
  amounts: string
}

export interface GroceryCategory {
  category: Ingredient["category"]
  items: GroceryItem[]
}

const KNOWN_DISPLAY_CATEGORIES: ReadonlySet<Ingredient["category"]> = new Set([
  "protein",
  "vegetables",
  "carbs",
  "dairy",
  "fats",
  "fruits",
  "spices",
  "other",
])

// Minimal override list for clear-cut cases where Claude commonly miscategorizes.
const NAME_OVERRIDE_RULES: Array<{ pattern: RegExp; category: Ingredient["category"] }> = [
  { pattern: /\b(salt|pepper|sugar|oil)\b/i, category: "spices" },
  { pattern: /\b(rice|bread|oats)\b/i, category: "carbs" },
  { pattern: /\b(apple|banana|fruit)\b/i, category: "fruits" },
]

function normalizeRawCategory(raw: string): Ingredient["category"] | null {
  const c = raw.trim().toLowerCase()
  if (!c) return null
  if (c.includes("protein")) return "protein"
  if (c.includes("carb")) return "carbs"
  if (c.includes("fat")) return "fats"
  if (c.includes("veget")) return "vegetables"
  if (c.includes("dairy")) return "dairy"
  if (c.includes("fruit")) return "fruits"
  if (c.includes("spice") || c.includes("season")) return "spices"
  if (KNOWN_DISPLAY_CATEGORIES.has(c as Ingredient["category"])) {
    return c as Ingredient["category"]
  }
  return null
}

function resolveDisplayCategory(item: Ingredient): Ingredient["category"] {
  for (const rule of NAME_OVERRIDE_RULES) {
    if (rule.pattern.test(item.name)) return rule.category
  }
  return normalizeRawCategory(String(item.category ?? "")) ?? "other"
}

function parseNumericToken(token: string): number | null {
  const cleaned = token.trim()
  if (!cleaned) return null

  if (cleaned.includes("/")) {
    const [numerator, denominator] = cleaned.split("/")
    const n = Number(numerator)
    const d = Number(denominator)
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null
    return n / d
  }

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function parseAmount(amount: string): { value: number; unit: string } {
  const normalized = amount.trim().replace(/\s+/g, " ")
  const match = normalized.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(.*)$/)
  if (!match) {
    return {
      value: 1,
      unit: normalized || "item",
    }
  }

  const numericValue = parseNumericToken(match[1])
  if (numericValue === null) {
    return {
      value: 1,
      unit: normalized || "item",
    }
  }

  const unit = match[2].trim() || "item"
  return {
    value: numericValue,
    unit,
  }
}

export function combineAmounts(amounts: string[]): string {
  const parsed = amounts.map(parseAmount)
  const unitCounts = parsed.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.unit] = (acc[entry.unit] ?? 0) + 1
    return acc
  }, {})

  const [mostCommonUnit = "item"] = Object.entries(unitCounts).sort((a, b) => b[1] - a[1])[0] ?? []
  const total = parsed
    .filter((entry) => entry.unit === mostCommonUnit)
    .reduce((sum, entry) => sum + entry.value, 0)

  const rounded = Number.isInteger(total) ? total.toString() : Number(total.toFixed(2)).toString()
  const compactUnits = new Set(["g", "kg", "mg", "ml", "l", "oz", "lb"])
  if (compactUnits.has(mostCommonUnit.toLowerCase())) {
    return `${rounded}${mostCommonUnit}`
  }
  return `${rounded} ${mostCommonUnit}`
}

export function buildGroceryCategories(ingredients: Ingredient[]): GroceryCategory[] {
  type Bucket = { displayName: string; amounts: string[] }
  const byCategory = ingredients.reduce<Record<Ingredient["category"], Map<string, Bucket>>>(
    (acc, item) => {
      const displayCategory = resolveDisplayCategory(item)
      if (!acc[displayCategory]) {
        acc[displayCategory] = new Map<string, Bucket>()
      }

      const categoryItems = acc[displayCategory]
      const key = item.name.trim().toLowerCase()
      const bucket = categoryItems.get(key)
      if (bucket) {
        bucket.amounts.push(item.amount)
      } else {
        categoryItems.set(key, { displayName: item.name, amounts: [item.amount] })
      }

      return acc
    },
    {} as Record<Ingredient["category"], Map<string, Bucket>>
  )

  return Object.entries(byCategory).map(([category, items]) => ({
    category: category as Ingredient["category"],
    items: Array.from(items.values()).map(({ displayName, amounts }) => ({
      name: displayName,
      amounts: combineAmounts(amounts),
    })),
  }))
}
