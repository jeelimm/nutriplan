"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore } from "@/lib/meal-store"
import { ChevronLeft, ChevronRight, ShoppingCart, Flame, Beef, Wheat, Droplets, UtensilsCrossed, Check, ChevronDown, Clock } from "lucide-react"

function MacroProgress({ current, target, label, icon, color }: { 
  current: number
  target: number
  label: string
  icon: React.ReactNode
  color: string
}) {
  const percentage = Math.min((current / target) * 100, 100)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-medium">{current}g / {target}g</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function DailyView() {
  const { weekPlan, userProfile, selectedDay, setSelectedDay, setCurrentStep } = useMealStore()
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  if (!weekPlan.length || !userProfile) return null

  const currentDay = weekPlan[selectedDay]

  const groceryList = currentDay.meals.flatMap(meal => meal.ingredients)
  const groupedGroceries = groceryList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    const existing = acc[item.category].find(i => i.name === item.name)
    if (existing) {
      existing.amount += `, ${item.amount}`
    } else {
      acc[item.category].push({ ...item })
    }
    return acc
  }, {} as Record<string, typeof groceryList>)

  const categoryLabels: Record<string, string> = {
    protein: "Proteins",
    vegetables: "Vegetables",
    carbs: "Carbohydrates",
    dairy: "Dairy",
    fats: "Fats & Oils",
    fruits: "Fruits",
    spices: "Spices & Seasonings",
  }

  const calorieProgress = (currentDay.totalCalories / userProfile.dailyCalories) * 100

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-lg px-4 py-4">
          <button
            onClick={() => setCurrentStep(1)}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Settings
          </button>

          {/* Day Selector */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
              disabled={selectedDay === 0}
              className="rounded-full p-2 hover:bg-secondary disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{currentDay.day}</div>
              <div className="text-sm text-muted-foreground">Day {selectedDay + 1} of 7</div>
            </div>
            <button
              onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
              disabled={selectedDay === 6}
              className="rounded-full p-2 hover:bg-secondary disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Dots */}
          <div className="mt-3 flex justify-center gap-1.5">
            {weekPlan.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === selectedDay ? "w-6 bg-primary" : "bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Daily Progress Card */}
        <Card className="mb-4 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-primary" />
                Daily Progress
              </CardTitle>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{currentDay.totalCalories}</div>
                <div className="text-xs text-muted-foreground">of {userProfile.dailyCalories} cal</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Calorie Bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                  calorieProgress > 100 ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
              {calorieProgress >= 95 && calorieProgress <= 105 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Macro Progress */}
            <MacroProgress
              current={currentDay.totalProtein}
              target={userProfile.macros.protein}
              label="Protein"
              icon={<Beef className="h-4 w-4 text-chart-1" />}
              color="bg-chart-1"
            />
            <MacroProgress
              current={currentDay.totalCarbs}
              target={userProfile.macros.carbs}
              label="Carbs"
              icon={<Wheat className="h-4 w-4 text-chart-3" />}
              color="bg-chart-3"
            />
            <MacroProgress
              current={currentDay.totalFat}
              target={userProfile.macros.fat}
              label="Fat"
              icon={<Droplets className="h-4 w-4 text-chart-2" />}
              color="bg-chart-2"
            />
          </CardContent>
        </Card>

        {/* Meals */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Today&apos;s Meals
          </h2>

          {currentDay.meals.map((meal, idx) => {
            const isExpanded = expandedMeals.has(meal.id)
            return (
              <Card key={meal.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-primary">
                        {idx === 0 ? "Breakfast" : idx === currentDay.meals.length - 1 ? "Dinner" : `Meal ${idx + 1}`}
                      </div>
                      <div className="font-semibold text-foreground">{meal.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{meal.calories}</div>
                      <div className="text-xs text-muted-foreground">cal</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-chart-1" />
                      <span className="text-muted-foreground">{meal.protein}g protein</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-chart-3" />
                      <span className="text-muted-foreground">{meal.carbs}g carbs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-chart-2" />
                      <span className="text-muted-foreground">{meal.fat}g fat</span>
                    </div>
                  </div>

                  {/* View Recipe Button */}
                  <button
                    onClick={() => toggleMealExpanded(meal.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                  >
                    View Recipe
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expandable Recipe Section */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {/* Prep + Cook Time */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-foreground">
                            <span className="font-medium">Total:</span> {(meal.prepTime || 0) + (meal.cookTime || 0)} min
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          Prep: {meal.prepTime || 0} min | Cook: {meal.cookTime || 0} min
                        </span>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Ingredients</h4>
                        <ul className="space-y-1.5">
                          {meal.ingredients.map((ingredient, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-foreground">{ingredient.name}</span>
                              <span className="text-muted-foreground">- {ingredient.amount}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Instructions</h4>
                        <ol className="space-y-2">
                          {(meal.instructions || []).map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Grocery List Button */}
        <Button
          variant="outline"
          className="mt-6 h-12 w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => setShowGroceryList(true)}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          View Grocery List for {currentDay.day}
        </Button>

        {/* Weekly Grocery List Link */}
        <Button
          className="mt-3 h-12 w-full"
          onClick={() => setCurrentStep(3)}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          View Weekly Grocery List
        </Button>
      </div>

      {/* Grocery List Modal */}
      {showGroceryList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Grocery List - {currentDay.day}</h2>
              <button
                onClick={() => setShowGroceryList(false)}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedGroceries).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-secondary p-3"
                      >
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="mt-6 h-12 w-full"
              onClick={() => setShowGroceryList(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
