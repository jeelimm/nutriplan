"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore } from "@/lib/meal-store"
import { buildGroceryCategories } from "@/lib/grocery"
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
  protein: "bg-chart-1/10 text-chart-1",
  vegetables: "bg-primary/10 text-primary",
  carbs: "bg-chart-3/10 text-chart-3",
  dairy: "bg-chart-2/10 text-chart-2",
  fats: "bg-chart-5/10 text-chart-5",
  fruits: "bg-chart-4/10 text-chart-4",
  spices: "bg-muted text-muted-foreground",
}

export function GroceryList() {
  const { weekPlan, setCurrentStep } = useMealStore()
  const [copied, setCopied] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  if (!weekPlan.length) return null

  const groceryCategories = buildGroceryCategories(
    weekPlan.flatMap((day) => day.meals.flatMap((meal) => meal.ingredients))
  )

  // Sort categories by item count
  groceryCategories.sort((a, b) => b.items.length - a.items.length)

  const totalItems = groceryCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const checkedCount = checkedItems.size

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-lg px-4 py-4">
          <button
            onClick={() => setCurrentStep(2)}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to your meal plan
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Weekly shopping list</h1>
              <p className="text-sm text-muted-foreground">
                {checkedCount} of {totalItems} checked off
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
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

          {/* Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Summary Card */}
        <Card className="mb-4 border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold">Everything for the week</div>
                <div className="text-sm text-primary-foreground/80">
                  {totalItems} lines to grab, sorted into {groceryCategories.length} groups
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grocery Categories */}
        <div className="space-y-4">
          {groceryCategories.map(({ category, items }) => (
            <Card key={category} className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${categoryColors[category] || 'bg-secondary text-secondary-foreground'}`}>
                    {categoryIcons[category] || <ShoppingCart className="h-4 w-4" />}
                  </span>
                  {categoryLabels[category] || category}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {items.length} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {items.map((item) => {
                    const itemKey = `${category}-${item.name}`
                    const isChecked = checkedItems.has(itemKey)
                    
                    return (
                      <button
                        key={item.name}
                        onClick={() => toggleItem(itemKey)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ${
                          isChecked ? 'bg-primary/5' : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isChecked
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className={`flex-1 ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {item.name}
                        </div>
                        <div className={`text-sm ${isChecked ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                          {item.amounts}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Button */}
        <div className="mt-6 space-y-3">
          <Button
            className="h-12 w-full"
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
          
          <p className="text-center text-xs text-muted-foreground">
            Paste into notes or your usual grocery app—however you shop is fine
          </p>
        </div>
      </div>
    </div>
  )
}
