"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore } from "@/lib/meal-store"
import { calculateNutritionTargets, toKg } from "@/lib/nutrition"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Beef, Utensils, ChevronLeft, Flame, Wheat, Droplets } from "lucide-react"

const mealCounts = [2, 3, 4, 5]
const mealCountDescriptions: Record<number, string> = {
  2: "larger meals",
  3: "balanced day",
  4: "lighter meals",
  5: "smaller meals",
}

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

      setCurrentStep(2)
      await generateMealPlan()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-shell bg-background px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-24">
      <div className="page-column">
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="bridge-back-link mb-4 w-full justify-center sm:w-auto sm:justify-start"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          Back to onboarding
        </button>

        {userProfile && (
          <section className="bridge-hero mb-5">
            <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Plan setup</div>
            <div className="space-y-2">
              <h1 className="text-[1.95rem] font-semibold leading-tight text-foreground sm:text-[2.15rem]">
                Here&apos;s your daily starting point
              </h1>
              <p className="max-w-[34rem] text-[15px] leading-7 text-muted-foreground">
                These targets are a practical baseline from the profile you just set. Choose a meal rhythm that fits
                real life, and we&apos;ll build your first week around it.
              </p>
            </div>

            <div className="rounded-[22px] border border-border bg-card p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Daily target
                  </p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground sm:text-[2.75rem]">
                    {liveTargets?.calories ?? userProfile.dailyCalories}
                  </p>
                  <p className="text-sm text-muted-foreground">calories per day</p>
                </div>
                <div className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Based on your profile
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-3 gap-2.5">
                <div className="bridge-stat-tile min-w-0 text-center">
                  <Beef className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {liveTargets?.macros.protein ?? userProfile.macros.protein}g
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Protein</div>
                </div>
                <div className="bridge-stat-tile min-w-0 text-center">
                  <Wheat className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {liveTargets?.macros.carbs ?? userProfile.macros.carbs}g
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Carbs</div>
                </div>
                <div className="bridge-stat-tile min-w-0 text-center">
                  <Droplets className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {liveTargets?.macros.fat ?? userProfile.macros.fat}g
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Fat</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <Card className="bridge-section mb-5">
          <CardHeader className="gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meal rhythm</span>
            </div>
            <CardTitle className="flex min-w-0 items-center gap-2 text-[1.45rem] leading-tight">
              <Utensils className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="break-words">How many meals fit your day?</span>
            </CardTitle>
            <CardDescription>
              Pick the rhythm that feels easiest to repeat. You can always adjust it later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <div className="grid grid-cols-2 gap-2.5">
              {mealCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMealsPerDay(count)}
                  className={cn(
                    "min-h-[76px] rounded-[18px] border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
                    mealsPerDay === count
                      ? "border-primary bg-primary/15 shadow-[0_16px_30px_-28px_rgba(38,96,63,0.45)]"
                      : "border-border bg-card hover:border-primary/35 hover:bg-secondary"
                  )}
                >
                  <span className="text-2xl font-semibold tabular-nums text-foreground">{count}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{mealCountDescriptions[count]}</span>
                </button>
              ))}
            </div>
            {userProfile && (
              <div className="bridge-note-strip">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="break-words">
                  About {Math.round(userProfile.dailyCalories / mealsPerDay)} calories per meal on average. This is a
                  rough split, not something you need to hit perfectly.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            className="h-14 min-h-[48px] w-full text-base font-semibold"
            onClick={handleComplete}
            disabled={!userProfile || isGenerating}
          >
            {isGenerating ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner />
                Opening your week…
              </span>
            ) : (
              "Create my 7-day meal plan"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            We&apos;ll turn your targets, cuisines, and ingredients into a simple weekly rotation you can actually use.
          </p>
        </div>
      </div>
    </div>
  )
}
