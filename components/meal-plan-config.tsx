"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore, type DietType } from "@/lib/meal-store"
import { Salad, Beef, Scale, Clock, Utensils, ChevronLeft, Flame, Droplets, Wheat, Zap } from "lucide-react"

const dietTypes: { id: DietType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "keto", label: "Keto", description: "Low carb, high fat", icon: <Droplets className="h-6 w-6" /> },
  { id: "high-protein", label: "High Protein", description: "Maximum protein intake", icon: <Beef className="h-6 w-6" /> },
  { id: "balanced", label: "Balanced", description: "Equal macro distribution", icon: <Scale className="h-6 w-6" /> },
  { id: "intermittent-fasting", label: "Intermittent Fasting", description: "Larger meals, time-restricted", icon: <Clock className="h-6 w-6" /> },
]

const mealCounts = [2, 3, 4, 5]

export function MealPlanConfig() {
  const { userProfile, setMealPlanConfig, setCurrentStep, generateMealPlan } = useMealStore()
  const [selectedDiet, setSelectedDiet] = useState<DietType | null>(null)
  const [mealsPerDay, setMealsPerDay] = useState<number>(3)

  const handleComplete = () => {
    if (!selectedDiet) return

    setMealPlanConfig({
      dietType: selectedDiet,
      mealsPerDay,
    })

    generateMealPlan()
    setCurrentStep(2)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => setCurrentStep(0)}
          className="mb-4 flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Profile
        </button>

        {/* Calculated Results */}
        {userProfile && (
          <Card className="mb-6 border-0 bg-primary text-primary-foreground shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Daily Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-center">
                <div className="text-4xl font-bold">{userProfile.dailyCalories}</div>
                <div className="text-primary-foreground/80">calories per day</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Beef className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{userProfile.macros.protein}g</div>
                  <div className="text-xs text-primary-foreground/80">Protein</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Wheat className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{userProfile.macros.carbs}g</div>
                  <div className="text-xs text-primary-foreground/80">Carbs</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Droplets className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{userProfile.macros.fat}g</div>
                  <div className="text-xs text-primary-foreground/80">Fat</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Zap className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{userProfile.macros.minerals}mg</div>
                  <div className="text-xs text-primary-foreground/80">Minerals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Diet Type Selection */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Salad className="h-5 w-5 text-primary" />
              Choose Your Diet Type
            </CardTitle>
            <CardDescription>
              Select a diet style that fits your lifestyle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dietTypes.map((diet) => (
              <button
                key={diet.id}
                onClick={() => setSelectedDiet(diet.id)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  selectedDiet === diet.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    selectedDiet === diet.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {diet.icon}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{diet.label}</div>
                  <div className="text-sm text-muted-foreground">{diet.description}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Meals Per Day */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Utensils className="h-5 w-5 text-primary" />
              Meals Per Day
            </CardTitle>
            <CardDescription>
              How many meals do you want to eat daily?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {mealCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => setMealsPerDay(count)}
                  className={`flex h-16 flex-1 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                    mealsPerDay === count
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-xs">meals</span>
                </button>
              ))}
            </div>
            {userProfile && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary p-3">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  ~{Math.round(userProfile.dailyCalories / mealsPerDay)} calories per meal
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="h-14 w-full text-lg font-semibold"
          onClick={handleComplete}
          disabled={!selectedDiet}
        >
          Generate 7-Day Meal Plan
        </Button>
      </div>
    </div>
  )
}
