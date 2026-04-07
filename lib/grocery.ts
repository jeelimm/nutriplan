import type { Ingredient } from "@/lib/meal-store"

export interface GroceryItem {
  name: string
  amounts: string
}

export interface GroceryCategory {
  category: Ingredient["category"]
  items: GroceryItem[]
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
  const byCategory = ingredients.reduce<Record<Ingredient["category"], Map<string, string[]>>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = new Map<string, string[]>()
      }

      const categoryItems = acc[item.category]
      const amounts = categoryItems.get(item.name)
      if (amounts) {
        amounts.push(item.amount)
      } else {
        categoryItems.set(item.name, [item.amount])
      }

      return acc
    },
    {} as Record<Ingredient["category"], Map<string, string[]>>
  )

  return Object.entries(byCategory).map(([category, items]) => ({
    category: category as Ingredient["category"],
    items: Array.from(items.entries()).map(([name, values]) => ({
      name,
      amounts: combineAmounts(values),
    })),
  }))
}
