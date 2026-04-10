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
import { cn } from "@/lib/utils"
import { Check, ChevronLeft, Settings } from "lucide-react"

const activityLevels: { id: ActivityLevel; label: string; description: string }[] = [
  { id: "sedentary", label: "Sedentary", description: "Mostly desk or home, with little planned exercise." },
  { id: "light", label: "Light activity", description: "Easy walks, lighter workouts, or active days on your feet." },
  { id: "moderate", label: "Moderate", description: "Regular workouts or a job that keeps you moving most weeks." },
  { id: "very-active", label: "Very active", description: "Hard training or physically demanding days most of the week." },
]

const goals: { id: Goal; label: string; description: string }[] = [
  { id: "lose-fat", label: "Lose Fat", description: "Creates a lighter starting point while keeping protein practical." },
  { id: "gain-muscle", label: "Gain Muscle", description: "Adds steady fuel to support training and recovery." },
  { id: "recomposition", label: "Lean Recomposition", description: "Keeps things balanced while body composition changes over time." },
]

const dietTypes: { id: DietType; label: string; description: string }[] = [
  { id: "keto", label: "Keto", description: "Lower carb, higher fat meals with simpler swaps." },
  { id: "high-protein", label: "High Protein", description: "More protein-forward meals for fullness and recovery." },
  { id: "balanced", label: "Balanced", description: "A practical mix of carbs, protein, and fats for everyday meals." },
  { id: "intermittent-fasting", label: "Time-restricted", description: "Fewer eating windows with bigger meals inside them." },
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

  const activeDiet = dietTypes.find((item) => item.id === userProfile.dietType)
  const activeGoal = goals.find((item) => item.id === userProfile.goal)
  const activeCuisines = userProfile.cuisinePreference ?? []

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
    <div className="app-shell bg-background px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-28">
      <div className="page-column space-y-4">
        <button type="button" onClick={() => setCurrentStep(2)} className="bridge-back-link">
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span>Back to dashboard</span>
        </button>

        <section className="dashboard-header-panel space-y-4">
          <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Profile & plan settings</div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/85 text-primary">
                <Settings className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.9rem] font-semibold leading-tight text-foreground">Keep your plan aligned with real life</h1>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Adjust your goals, preferences, and regeneration settings without losing the progress you&apos;ve already set up.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bridge-stat-tile">
              <div className="eyebrow">Daily target</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{userProfile.dailyCalories} kcal</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeGoal?.label ?? "Current goal"} starting point</p>
            </div>
            <div className="bridge-stat-tile">
              <div className="eyebrow">Plan setup</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{userProfile.mealsPerDay} meals / day</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeDiet?.label ?? "Meal style"} with {Math.max(activeCuisines.length, 1)} cuisine preference{activeCuisines.length === 1 ? "" : "s"}</p>
            </div>
          </div>
        </section>

        <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Profile</CardTitle>
            <CardDescription>These choices shape calories, macros, and the meals we build around your week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            <div className="settings-section-panel space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                  <span className="text-sm font-semibold text-foreground">Detailed profile editor</span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  For weight, body fat, muscle mass, and profile name, use the detailed editor from your dashboard.
                </p>
              </div>
              <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(2)}>
                Open profile editor
              </Button>
            </div>

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Goal</Label>
                <p className="text-sm leading-6 text-muted-foreground">Update the direction of your plan without redoing onboarding.</p>
              </div>
              <div className="grid gap-2">
                {goals.map((item) => {
                  const selected = userProfile.goal === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateNutritionTargets({ goal: item.id })}
                      className={cn(
                        "settings-choice-card",
                        selected ? "settings-choice-card-active" : "settings-choice-card-idle"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                        </div>
                        {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Activity level</Label>
                <p className="text-sm leading-6 text-muted-foreground">Choose the week that feels most normal, not the most ideal.</p>
              </div>
              <div className="grid gap-2">
                {activityLevels.map((item) => {
                  const selected = userProfile.activityLevel === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateNutritionTargets({ activityLevel: item.id })}
                      className={cn(
                        "settings-choice-card",
                        selected ? "settings-choice-card-active" : "settings-choice-card-idle"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                        </div>
                        {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Cuisine focus</Label>
                <p className="text-sm leading-6 text-muted-foreground">Pick one or two cuisines to keep future plans realistic to shop for and repeat.</p>
              </div>
              <div className="grid gap-2">
                {CUISINE_OPTIONS.map((c) => {
                  const selected = activeCuisines.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (activeCuisines.includes(c.id)) {
                          if (activeCuisines.length <= 1) return
                          updatePreferences({ cuisinePreference: activeCuisines.filter((x) => x !== c.id) })
                          return
                        }
                        const next: CuisinePreference[] =
                          activeCuisines.length < 2 ? [...activeCuisines, c.id] : [activeCuisines[1], c.id]
                        updatePreferences({ cuisinePreference: next })
                      }}
                      className={cn(
                        "settings-choice-card",
                        selected ? "settings-choice-card-active" : "settings-choice-card-idle"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{c.title}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">{c.hint}</div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            selected ? "bg-primary/12 text-primary" : "bg-background/85 text-muted-foreground"
                          )}
                        >
                          {selected ? "Included" : "Add"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Meal plan</CardTitle>
            <CardDescription>These changes shape the next plan you generate, while keeping your current week available until then.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Diet style</Label>
                <p className="text-sm leading-6 text-muted-foreground">Choose the rhythm that feels easiest to follow in daily life.</p>
              </div>
              <div className="grid gap-2">
                {dietTypes.map((item) => {
                  const selected = userProfile.dietType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateNutritionTargets({ dietType: item.id })}
                      className={cn(
                        "settings-choice-card",
                        selected ? "settings-choice-card-active" : "settings-choice-card-idle"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                        </div>
                        {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bridge-note-strip">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
              <span>Goal, activity, cuisine, and diet changes will show up the next time you regenerate your plan.</span>
            </div>

            <div className="grid gap-3">
              <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(0)}>
                Update ingredients
              </Button>
              <Button className="h-12 min-h-[44px] w-full" onClick={handleRegenerate} disabled={isGeneratingMealPlan}>
                {isGeneratingMealPlan ? "Regenerating..." : "Regenerate plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Smaller app-level choices that keep reading and shopping comfortable day to day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Measurement system</Label>
                <p className="text-sm leading-6 text-muted-foreground">Applies to recipe measurements and grocery amounts throughout the app.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updatePreferences({ unitSystem: "metric" })}
                  className={cn("settings-chip flex-1 sm:flex-none", userProfile.unitSystem === "metric" ? "settings-chip-active" : "settings-chip-idle")}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => updatePreferences({ unitSystem: "imperial" })}
                  className={cn("settings-chip flex-1 sm:flex-none", userProfile.unitSystem === "imperial" ? "settings-chip-active" : "settings-chip-idle")}
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Language</Label>
                <p className="text-sm leading-6 text-muted-foreground">Switch the interface language without affecting your saved profile data.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updatePreferences({ language: "en" })}
                  className={cn("settings-chip flex-1 sm:flex-none", userProfile.language !== "ko" ? "settings-chip-active" : "settings-chip-idle")}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => updatePreferences({ language: "ko" })}
                  className={cn("settings-chip flex-1 sm:flex-none", userProfile.language === "ko" ? "settings-chip-active" : "settings-chip-idle")}
                >
                  한국어
                </button>
              </div>
            </div>

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Meals per day</Label>
                <p className="text-sm leading-6 text-muted-foreground">Use the meal rhythm that feels realistic for your workdays and weekends.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updatePreferences({ mealsPerDay: count })}
                    className={cn(
                      "settings-chip flex-1 sm:flex-none",
                      userProfile.mealsPerDay === count ? "settings-chip-active" : "settings-chip-idle"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Data</CardTitle>
            <CardDescription>App version: v0.1.0</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            <div className="bridge-note-strip">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b77749]" />
              <span>Clearing data removes your saved profile, plan, shopping lists, and ingredient setup from this device.</span>
            </div>
            <Button variant="destructive" className="h-12 min-h-[44px] w-full" onClick={handleClearAll}>
              Clear all data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
