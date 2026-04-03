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
  const parts = normalized.split(" ")
  const numericValue = parseNumericToken(parts[0])

  if (numericValue === null) {
    return {
      value: 1,
      unit: normalized || "item",
    }
  }

  return {
    value: numericValue,
    unit: parts.slice(1).join(" ").trim() || "item",
  }
}

export function combineAmounts(amounts: string[]): string {
  const totals = amounts.reduce<Record<string, number>>((acc, amount) => {
    const { value, unit } = parseAmount(amount)
    acc[unit] = (acc[unit] ?? 0) + value
    return acc
  }, {})

  return Object.entries(totals)
    .map(([unit, total]) => `${Number(total.toFixed(2)).toString()} ${unit}`)
    .join(", ")
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
