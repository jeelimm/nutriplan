"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  useMealStore,
  CUISINE_OPTIONS,
  type ActivityLevel,
  type CuisinePreference,
  type DietType,
  type Goal,
} from "@/lib/meal-store"
import { toKg } from "@/lib/nutrition"
import { ChevronLeft, Settings } from "lucide-react"

const activityLevels: { id: ActivityLevel; label: string }[] = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Light activity" },
  { id: "moderate", label: "Moderate" },
  { id: "very-active", label: "Very active" },
]

const goals: { id: Goal; label: string }[] = [
  { id: "lose-fat", label: "Lose Fat" },
  { id: "gain-muscle", label: "Gain Muscle" },
  { id: "recomposition", label: "Lean Recomposition" },
]

const dietTypes: { id: DietType; label: string }[] = [
  { id: "keto", label: "Keto" },
  { id: "high-protein", label: "High Protein" },
  { id: "balanced", label: "Balanced" },
  { id: "intermittent-fasting", label: "Time-restricted" },
]

export function SettingsScreen() {
  const {
    userProfile,
    setUserProfile,
    setMealPlanConfig,
    setCurrentStep,
    generateMealPlan,
    clearAllData,
    calculateMacros,
    isGeneratingMealPlan,
  } = useMealStore()

  if (!userProfile) return null

  const updatePreferences = (patch: Partial<typeof userProfile>) => {
    setUserProfile({
      ...userProfile,
      ...patch,
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const updateNutritionTargets = (patch: Partial<typeof userProfile>) => {
    const next = { ...userProfile, ...patch }
    const weightKg = toKg(next.weight, next.unit)
    const targetKg =
      next.targetWeight != null && Number.isFinite(next.targetWeight)
        ? toKg(next.targetWeight, next.unit)
        : null
    const { calories, macros } = calculateMacros(
      weightKg,
      next.bodyFat,
      next.goal,
      next.activityLevel,
      next.dietType,
      next.sex ?? "male",
      targetKg,
      next.weightLossPace ?? null
    )
    setUserProfile({
      ...next,
      dailyCalories: calories,
      macros,
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const handleRegenerate = async () => {
    if (isGeneratingMealPlan) return
    const profile = useMealStore.getState().userProfile
    if (!profile) return
    setCurrentStep(2)
    setMealPlanConfig({ dietType: profile.dietType, mealsPerDay: profile.mealsPerDay })
    try {
      await generateMealPlan()
    } catch {}
  }

  const handleClearAll = () => {
    if (!window.confirm("Clear all saved data? This cannot be undone.")) return
    clearAllData()
    window.localStorage.removeItem("meal-plan-storage")
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background p-4 pb-28 md:p-8 md:pb-28">
      <div className="mx-auto max-w-lg min-w-0 space-y-4">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="flex min-h-11 w-full max-w-full items-center gap-1 rounded-md py-2 text-left text-sm text-muted-foreground hover:text-foreground sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="break-words">Back to dashboard</span>
        </button>

        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex min-w-0 items-center gap-2">
              <Settings className="h-5 w-5 shrink-0 text-primary" />
              <span className="break-words">Settings</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(2)}>
              Edit body stats
            </Button>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Goal</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {goals.map((item) => (
                  <Button
                    key={item.id}
                    variant={userProfile.goal === item.id ? "default" : "outline"}
                    className="h-12 min-h-[44px] w-full break-words px-2 text-center text-sm leading-tight"
                    onClick={() => updateNutritionTargets({ goal: item.id })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Activity level</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activityLevels.map((item) => (
                  <Button
                    key={item.id}
                    variant={userProfile.activityLevel === item.id ? "default" : "outline"}
                    className="h-12 min-h-[44px] w-full justify-center text-sm"
                    onClick={() => updateNutritionTargets({ activityLevel: item.id })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Cuisine (pick 1–2)</Label>
              <p className="text-xs text-muted-foreground">Used when regenerating your meal plan</p>
              <div className="grid gap-2">
                {CUISINE_OPTIONS.map((c) => {
                  const selected = (userProfile.cuisinePreference ?? []).includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const prev = userProfile.cuisinePreference ?? []
                        if (prev.includes(c.id)) {
                          if (prev.length <= 1) return
                          updatePreferences({ cuisinePreference: prev.filter((x) => x !== c.id) })
                          return
                        }
                        const next: CuisinePreference[] =
                          prev.length < 2 ? [...prev, c.id] : [prev[1], c.id]
                        updatePreferences({ cuisinePreference: next })
                      }}
                      className={`min-h-[44px] rounded-xl border-2 p-3 text-left text-sm transition-colors ${
                        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="break-words font-medium text-foreground">{c.title}</div>
                      <div className="break-words text-xs text-muted-foreground">{c.hint}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Meal Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {dietTypes.map((item) => (
                <Button
                  key={item.id}
                  variant={userProfile.dietType === item.id ? "default" : "outline"}
                  className="h-12 min-h-[44px] w-full text-sm"
                  onClick={() => updateNutritionTargets({ dietType: item.id })}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(0)}>
              Update ingredients
            </Button>
            <Button className="h-12 min-h-[44px] w-full" onClick={handleRegenerate} disabled={isGeneratingMealPlan}>
              {isGeneratingMealPlan ? "Regenerating..." : "Regenerate plan"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Measurement system</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={userProfile.unitSystem === "metric" ? "default" : "outline"}
                  className="h-12 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  onClick={() => updatePreferences({ unitSystem: "metric" })}
                >
                  Metric
                </Button>
                <Button
                  variant={userProfile.unitSystem === "imperial" ? "default" : "outline"}
                  className="h-12 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  onClick={() => updatePreferences({ unitSystem: "imperial" })}
                >
                  Imperial
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Language</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={userProfile.language !== "ko" ? "default" : "outline"}
                  className="h-12 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  onClick={() => updatePreferences({ language: "en" })}
                >
                  English
                </Button>
                <Button
                  variant={userProfile.language === "ko" ? "default" : "outline"}
                  className="h-12 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  onClick={() => updatePreferences({ language: "ko" })}
                >
                  한국어
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Meals per day</Label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <Button
                    key={count}
                    variant={userProfile.mealsPerDay === count ? "default" : "outline"}
                    className="h-12 min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                    onClick={() => updatePreferences({ mealsPerDay: count })}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Data</CardTitle>
            <CardDescription>App version: v0.1.0</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Button variant="destructive" className="h-12 min-h-[44px] w-full" onClick={handleClearAll}>
              Clear all data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
