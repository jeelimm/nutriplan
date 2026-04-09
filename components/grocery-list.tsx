"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GroceryItemRow } from "@/components/grocery-item-row"
import { useMealStore } from "@/lib/meal-store"
import { buildGroceryCategories } from "@/lib/grocery"
import { convertRecipeText } from "@/lib/recipe-units"
import { ChevronLeft, ShoppingCart, Copy, Check, Beef, Carrot, Wheat, Milk, Droplets, Apple, Sparkles } from "lucide-react"

const categoryIcons: Record<string, React.ReactNode> = {
  protein: <Beef className="h-5 w-5" />,
  vegetables: <Carrot className="h-5 w-5" />,
  carbs: <Wheat className="h-5 w-5" />,
  dairy: <Milk className="h-5 w-5" />,
  fats: <Droplets className="h-5 w-5" />,
  fruits: <Apple className="h-5 w-5" />,
  spices: <Sparkles className="h-5 w-5" />,
}

const categoryLabels: Record<string, string> = {
  protein: "Proteins",
  vegetables: "Vegetables",
  carbs: "Carbohydrates",
  dairy: "Dairy",
  fats: "Fats & Oils",
  fruits: "Fruits",
  spices: "Spices & Seasonings",
}

const categoryColors: Record<string, string> = {
  protein: "bg-[#eee5da] text-[#7a5b41]",
  vegetables: "bg-[#edf4ec] text-primary",
  carbs: "bg-[#f4efe5] text-[#8b6a45]",
  dairy: "bg-[#edf1f4] text-[#5c7086]",
  fats: "bg-[#f5efe4] text-[#8a704f]",
  fruits: "bg-[#f5e8e0] text-[#a05d43]",
  spices: "bg-muted text-muted-foreground",
}

export function GroceryList() {
  const { weekPlan, setCurrentStep, userProfile } = useMealStore()
  const [copied, setCopied] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  if (!weekPlan.length) return null

  const recipeUnitSystem = userProfile?.unitSystem ?? "metric"
  const groceryCategories = buildGroceryCategories(
    weekPlan.flatMap((day) =>
      day.meals.flatMap((meal) =>
        meal.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: convertRecipeText(ingredient.amount, recipeUnitSystem),
        }))
      )
    )
  )

  // Sort categories by item count
  groceryCategories.sort((a, b) => b.items.length - a.items.length)

  const totalItems = groceryCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const checkedCount = checkedItems.size
  const completionRatio = totalItems > 0 ? checkedCount / totalItems : 0

  const handleCopy = async () => {
    const listText = groceryCategories
      .map(cat => `${categoryLabels[cat.category] || cat.category}:\n${cat.items.map(item => `  - ${item.name}: ${item.amounts}`).join('\n')}`)
      .join('\n\n')
    
    await navigator.clipboard.writeText(listText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleItem = (itemKey: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemKey)) {
      newChecked.delete(itemKey)
    } else {
      newChecked.add(itemKey)
    }
    setCheckedItems(newChecked)
  }

  return (
    <div className="app-shell bg-background pb-28">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="page-column px-4 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="bridge-back-link mb-3 w-full justify-center sm:w-auto sm:justify-start"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="break-words">Back to your meal plan</span>
          </button>

          <section className="dashboard-header-panel space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Weekly shopping list</div>
                <h1 className="mt-3 break-words text-[1.95rem] font-semibold leading-tight text-foreground sm:text-[2.15rem]">
                  Everything for the week
                </h1>
                <p className="mt-2 max-w-[34rem] text-sm leading-6 text-muted-foreground">
                  Check items off as you shop, or copy the full list into notes or your usual grocery app.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="h-11 min-h-[44px] w-full gap-2 sm:w-auto sm:shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy list
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="dashboard-kpi-tile">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Checked off
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{checkedCount}</div>
                <div className="text-sm text-muted-foreground">of {totalItems} items</div>
              </div>
              <div className="dashboard-kpi-tile">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Remaining
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{Math.max(totalItems - checkedCount, 0)}</div>
                <div className="text-sm text-muted-foreground">across {groceryCategories.length} groups</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>{Math.round(completionRatio * 100)}% complete</span>
                <span>{checkedCount} / {totalItems}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completionRatio * 100}%` }}
                />
              </div>
            </div>

            <div className="bridge-note-strip">
              <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="break-words">
                Sorted by ingredient type so it&apos;s easier to move through the store without bouncing around.
              </span>
            </div>
          </section>
        </div>
      </div>

      <div className="page-column space-y-4 px-4">
        <div className="space-y-3">
          {groceryCategories.map(({ category, items }) => (
            <Card key={category} className="grocery-category-card">
              <CardHeader className="gap-3 px-5 pb-3 pt-5 sm:px-6">
                <CardTitle className="flex min-w-0 items-center gap-3 text-base">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${categoryColors[category] || 'bg-secondary text-secondary-foreground'}`}>
                    {categoryIcons[category] || <ShoppingCart className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-base font-semibold text-foreground">{categoryLabels[category] || category}</div>
                    <div className="text-xs text-muted-foreground">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className="grocery-category-count">
                    {items.filter((item) => checkedItems.has(`${category}-${item.name}`)).length}/{items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 sm:px-6">
                <div className="grocery-list-panel overflow-hidden">
                  {items.map((item) => {
                    const itemKey = `${category}-${item.name}`
                    const isChecked = checkedItems.has(itemKey)
                    
                    return (
                      <GroceryItemRow
                        key={item.name}
                        name={item.name}
                        amount={item.amounts}
                        checked={isChecked}
                        showCheckbox
                        onToggle={() => toggleItem(itemKey)}
                        className="border-b border-border/80 last:border-b-0"
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bridge-section">
          <CardContent className="space-y-3 px-5 py-5 sm:px-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Share this list</span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Paste it into notes, messages, or your grocery app. However you shop is fine.
              </p>
            </div>
            <Button
              className="h-12 min-h-[44px] w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  On your clipboard
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copy full list
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
