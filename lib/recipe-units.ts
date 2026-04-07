export type RecipeUnitSystem = "metric" | "imperial"

const format = (value: number, digits = 2): string => {
  const rounded = Number(value.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

function toMetric(text: string): string {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*°?\s*f\b/gi, (_, n) => `${format(((Number(n) - 32) * 5) / 9, 0)}°C`)
    .replace(/(\d+(?:\.\d+)?)\s*fl\s*oz\b/gi, (_, n) => `${format(Number(n) * 30)}ml`)
    .replace(/(\d+(?:\.\d+)?)\s*lbs?\b/gi, (_, n) => `${format(Number(n) * 0.453)}kg`)
    .replace(/(\d+(?:\.\d+)?)\s*oz\b/gi, (_, n) => `${format(Number(n) * 28.35)}g`)
    .replace(/(\d+(?:\.\d+)?)\s*cups?\b/gi, (_, n) => `${format(Number(n) * 240)}ml`)
    .replace(/(\d+(?:\.\d+)?)\s*tbsp\b/gi, (_, n) => `${format(Number(n) * 15)}ml`)
    .replace(/(\d+(?:\.\d+)?)\s*tsp\b/gi, (_, n) => `${format(Number(n) * 5)}ml`)
}

function toImperial(text: string): string {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*°?\s*c\b/gi, (_, n) => `${format((Number(n) * 9) / 5 + 32, 0)}°F`)
    .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, (_, n) => `${format(Number(n) / 0.453)} lb`)
    .replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, n) => `${format(Number(n) / 28.35)} oz`)
    .replace(/(\d+(?:\.\d+)?)\s*ml\b/gi, (_, n) => `${format(Number(n) / 240)} cup`)
}

export function convertRecipeText(text: string, unitSystem: RecipeUnitSystem): string {
  if (!text) return text
  return unitSystem === "metric" ? toMetric(text) : toImperial(text)
}
