"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore } from "@/lib/meal-store"
import { calculateNutritionTargets, toKg } from "@/lib/nutrition"
import { Beef, Utensils, ChevronLeft, Flame, Wheat, Droplets, Zap } from "lucide-react"

const mealCounts = [2, 3, 4, 5]

export function MealPlanConfig() {
  const { userProfile, setMealPlanConfig, setCurrentStep, generateMealPlan, setUserProfile } = useMealStore()
  const [mealsPerDay, setMealsPerDay] = useState<number>(userProfile?.mealsPerDay ?? 3)

  const targetDiet = userProfile?.dietType ?? "balanced"
  const liveTargets = userProfile
    ? calculateNutritionTargets({
        weightKg: toKg(userProfile.weight, userProfile.unit),
        bodyFat: userProfile.bodyFat,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        dietType: targetDiet,
      })
    : null

  const handleComplete = () => {
    if (!userProfile) return

    setMealPlanConfig({
      dietType: userProfile.dietType,
      mealsPerDay,
    })
    if (userProfile) {
      const updatedTargets = calculateNutritionTargets({
        weightKg: toKg(userProfile.weight, userProfile.unit),
        bodyFat: userProfile.bodyFat,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        dietType: userProfile.dietType,
      })
      setUserProfile({
        ...userProfile,
        mealsPerDay,
        dailyCalories: updatedTargets.calories,
        macros: updatedTargets.macros,
        lastUpdatedAt: new Date().toISOString(),
      })
    }

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
                <div className="mt-1 text-xs text-primary-foreground/80">
                  Estimated based on Katch-McArdle formula
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Beef className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{liveTargets?.macros.protein ?? userProfile.macros.protein}g</div>
                  <div className="text-xs text-primary-foreground/80">Protein</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Wheat className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{liveTargets?.macros.carbs ?? userProfile.macros.carbs}g</div>
                  <div className="text-xs text-primary-foreground/80">Carbs</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Droplets className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{liveTargets?.macros.fat ?? userProfile.macros.fat}g</div>
                  <div className="text-xs text-primary-foreground/80">Fat</div>
                </div>
                <div className="rounded-lg bg-primary-foreground/10 p-3 text-center">
                  <Zap className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-lg font-bold">{liveTargets?.macros.minerals ?? userProfile.macros.minerals}mg</div>
                  <div className="text-xs text-primary-foreground/80">Minerals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          disabled={!userProfile}
        >
          Generate 7-Day Meal Plan
        </Button>
      </div>
    </div>
  )
}
