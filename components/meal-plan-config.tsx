"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore } from "@/lib/meal-store"
import { calculateNutritionTargets, toKg } from "@/lib/nutrition"
import { Spinner } from "@/components/ui/spinner"
import { Beef, Utensils, ChevronLeft, Flame, Wheat, Droplets } from "lucide-react"

const mealCounts = [2, 3, 4, 5]

export function MealPlanConfig() {
  const { userProfile, setMealPlanConfig, setCurrentStep, generateMealPlan, setUserProfile } = useMealStore()
  const [mealsPerDay, setMealsPerDay] = useState<number>(userProfile?.mealsPerDay ?? 3)
  const [isGenerating, setIsGenerating] = useState(false)

  const targetDiet = userProfile?.dietType ?? "balanced"
  const liveTargets = userProfile
    ? calculateNutritionTargets({
        weightKg: toKg(userProfile.weight, userProfile.unit),
        bodyFat: userProfile.bodyFat,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        dietType: targetDiet,
        sex: userProfile.sex,
        targetWeightKg:
          userProfile.targetWeight != null && Number.isFinite(userProfile.targetWeight)
            ? toKg(userProfile.targetWeight, userProfile.unit)
            : undefined,
        weightLossPace: userProfile.weightLossPace,
      })
    : null

  const handleComplete = async () => {
    if (!userProfile) return
    if (isGenerating) return

    setIsGenerating(true)

    try {
      setMealPlanConfig({
        dietType: userProfile.dietType,
        mealsPerDay,
      })
      const updatedTargets = calculateNutritionTargets({
        weightKg: toKg(userProfile.weight, userProfile.unit),
        bodyFat: userProfile.bodyFat,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        dietType: userProfile.dietType,
        sex: userProfile.sex,
        targetWeightKg:
          userProfile.targetWeight != null && Number.isFinite(userProfile.targetWeight)
            ? toKg(userProfile.targetWeight, userProfile.unit)
            : undefined,
        weightLossPace: userProfile.weightLossPace,
      })
      setUserProfile({
        ...userProfile,
        mealsPerDay,
        dailyCalories: updatedTargets.calories,
        macros: updatedTargets.macros,
        lastUpdatedAt: new Date().toISOString(),
      })

      await generateMealPlan()
      setCurrentStep(2)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background p-4 pb-24 md:p-8 md:pb-24">
      <div className="mx-auto max-w-lg min-w-0">
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="mb-4 flex min-h-11 w-full max-w-full items-center gap-1 rounded-md py-2 text-left text-muted-foreground hover:text-foreground sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          Back
        </button>

        {/* Calculated Results */}
        {userProfile && (
          <Card className="mb-6 border-0 bg-primary text-primary-foreground shadow-lg">
            <CardHeader className="px-4 pb-2 pt-6 sm:px-6">
              <CardTitle className="text-lg">Your daily targets</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="mb-4 text-center">
                <div className="break-words text-3xl font-bold tabular-nums sm:text-4xl">{userProfile.dailyCalories}</div>
                <div className="text-primary-foreground/80">calories per day</div>
                <div className="mt-1 text-xs text-primary-foreground/80">
                  Ballpark from your stats and activity—tweak your profile anytime if life changes
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
                <div className="min-w-0 rounded-lg bg-primary-foreground/10 p-2 text-center sm:p-3">
                  <Beef className="mx-auto mb-1 h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="break-words text-sm font-bold tabular-nums sm:text-lg">
                    {liveTargets?.macros.protein ?? userProfile.macros.protein}g
                  </div>
                  <div className="text-[10px] text-primary-foreground/80 sm:text-xs">Protein</div>
                </div>
                <div className="min-w-0 rounded-lg bg-primary-foreground/10 p-2 text-center sm:p-3">
                  <Wheat className="mx-auto mb-1 h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="break-words text-sm font-bold tabular-nums sm:text-lg">
                    {liveTargets?.macros.carbs ?? userProfile.macros.carbs}g
                  </div>
                  <div className="text-[10px] text-primary-foreground/80 sm:text-xs">Carbs</div>
                </div>
                <div className="min-w-0 rounded-lg bg-primary-foreground/10 p-2 text-center sm:p-3">
                  <Droplets className="mx-auto mb-1 h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="break-words text-sm font-bold tabular-nums sm:text-lg">
                    {liveTargets?.macros.fat ?? userProfile.macros.fat}g
                  </div>
                  <div className="text-[10px] text-primary-foreground/80 sm:text-xs">Fat</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meals Per Day */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex min-w-0 items-center gap-2 text-xl">
              <Utensils className="h-5 w-5 shrink-0 text-primary" />
              <span className="break-words">Meals per day</span>
            </CardTitle>
            <CardDescription>
              What fits your routine? Smaller meals or a few bigger ones both work.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {mealCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMealsPerDay(count)}
                  className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    mealsPerDay === count
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-xl font-bold sm:text-2xl">{count}</span>
                  <span className="text-xs">meals</span>
                </button>
              ))}
            </div>
            {userProfile && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary p-4">
                <Flame className="h-4 w-4 shrink-0 text-primary" />
                <span className="break-words text-center text-sm text-muted-foreground">
                  Roughly {Math.round(userProfile.dailyCalories / mealsPerDay)} calories per meal on average
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="h-14 min-h-[48px] w-full text-lg font-semibold"
          onClick={handleComplete}
          disabled={!userProfile || isGenerating}
        >
          {isGenerating ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner />
              Building your week…
            </span>
          ) : (
            "Create my 7-day meal plan"
          )}
        </Button>
      </div>
    </div>
  )
}
