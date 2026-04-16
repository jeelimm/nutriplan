"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Check, ChevronLeft, ChevronDown, Moon, Settings, Sun } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    appPrefs,
    setAppPrefs,
    userProfile,
    setUserProfile,
    setMealPlanConfig,
    setCurrentStep,
    currentStep,
    generateMealPlan,
    clearAllData,
    calculateMacros,
    isGeneratingMealPlan,
  } = useMealStore()

  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const [startOverDialogOpen, setStartOverDialogOpen] = useState(false)
  const [bodyStatsOpen, setBodyStatsOpen] = useState(false)
  const [weightInput, setWeightInput] = useState("")
  const [bodyFatInput, setBodyFatInput] = useState("")
  const [muscleMassInput, setMuscleMassInput] = useState("")
  const [bodyStatsError, setBodyStatsError] = useState<string | null>(null)
  const [bodyStatsSaved, setBodyStatsSaved] = useState(false)

  const onboardingComplete = !!userProfile && currentStep !== 0

  if (!userProfile) {
    return (
      <div className="app-shell bg-background px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-28">
        <div className="page-column space-y-4">
          <button type="button" onClick={() => setStartOverDialogOpen(true)} className="bridge-back-link">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Reset &amp; Start Over</span>
          </button>
          <AlertDialog open={startOverDialogOpen} onOpenChange={setStartOverDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start Over?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear your current meal plan and profile. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => setCurrentStep(0)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, start over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <section className="dashboard-header-panel space-y-4">
            <div className="hero-badge bg-secondary text-muted-foreground">App settings</div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/85 text-primary">
                <Settings className="h-5 w-5" />
              </span>
              <h1 className="text-[1.9rem] font-semibold leading-tight text-foreground">App preferences</h1>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Profile and meal plan settings unlock after setup. Configure appearance, language, and units here anytime.
            </p>
          </section>

          <Card className="bridge-section">
            <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
              <CardTitle>Preferences</CardTitle>
              <CardDescription>These apply across the whole app and are saved immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
              <div className="settings-section-panel space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-foreground">Appearance</Label>
                  <p className="text-sm leading-6 text-muted-foreground">Switch between light and dark mode.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ darkMode: false })}
                    className={cn("settings-chip flex-1 sm:flex-none", !appPrefs.darkMode ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    <Sun className="mr-1.5 inline h-3.5 w-3.5" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ darkMode: true })}
                    className={cn("settings-chip flex-1 sm:flex-none", appPrefs.darkMode ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    <Moon className="mr-1.5 inline h-3.5 w-3.5" />
                    Dark
                  </button>
                </div>
              </div>

              <div className="settings-section-panel space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-foreground">Language</Label>
                  <p className="text-sm leading-6 text-muted-foreground">Switch the interface language.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ language: "en" })}
                    className={cn("settings-chip flex-1 sm:flex-none", appPrefs.language !== "ko" ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ language: "ko" })}
                    className={cn("settings-chip flex-1 sm:flex-none", appPrefs.language === "ko" ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    한국어
                  </button>
                </div>
              </div>

              <div className="settings-section-panel space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-foreground">Measurement system</Label>
                  <p className="text-sm leading-6 text-muted-foreground">Applies to recipe measurements and grocery amounts.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ unitSystem: "metric" })}
                    className={cn("settings-chip flex-1 sm:flex-none", appPrefs.unitSystem !== "imperial" ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    Metric
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppPrefs({ unitSystem: "imperial" })}
                    className={cn("settings-chip flex-1 sm:flex-none", appPrefs.unitSystem === "imperial" ? "settings-chip-active" : "settings-chip-idle")}
                  >
                    Imperial
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
      next.weightLossPace ?? null,
      next.height ?? null,
      next.age ?? null
    )
    setUserProfile({
      ...next,
      dailyCalories: calories,
      macros,
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const handleRegenerate = () => {
    if (isGeneratingMealPlan) return
    setRegenDialogOpen(true)
  }

  const handleConfirmRegenerate = async () => {
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

  const handleBodyStatsSave = () => {
    setBodyStatsError(null)
    const w = parseFloat(weightInput)
    const bf = parseFloat(bodyFatInput)
    const mm = parseFloat(muscleMassInput)
    if (!Number.isFinite(w) || w <= 0) {
      setBodyStatsError(`Enter a valid weight in ${userProfile.unit}.`)
      return
    }
    if (!Number.isFinite(bf) || bf <= 0 || bf >= 100) {
      setBodyStatsError("Enter a body fat % between 1 and 99.")
      return
    }
    if (!Number.isFinite(mm) || mm <= 0) {
      setBodyStatsError("Enter a muscle mass greater than 0.")
      return
    }
    updateNutritionTargets({ weight: w, bodyFat: bf, muscleMass: mm })
    setBodyStatsOpen(false)
    setWeightInput("")
    setBodyFatInput("")
    setMuscleMassInput("")
    setBodyStatsSaved(true)
    setTimeout(() => setBodyStatsSaved(false), 3000)
  }

  const hasDetailedStats = userProfile.bodyFat > 0 && userProfile.muscleMass > 0

  return (
    <div className="app-shell bg-background px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-28">
      <div className="page-column space-y-4">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="bridge-back-link"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span>Back to Plan</span>
        </button>
        <button
          type="button"
          onClick={() => setStartOverDialogOpen(true)}
          className="bridge-back-link"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span>Reset &amp; Start Over</span>
        </button>
        <AlertDialog open={startOverDialogOpen} onOpenChange={setStartOverDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Over?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear your current meal plan and profile. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setCurrentStep(0)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, start over
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <section className="dashboard-header-panel space-y-4">
          <div className="hero-badge bg-secondary text-muted-foreground">
            {onboardingComplete ? "Profile & plan settings" : "App settings"}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/85 text-primary">
                <Settings className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.9rem] font-semibold leading-tight text-foreground">
                  {onboardingComplete ? "Keep your plan aligned with real life" : "App preferences"}
                </h1>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {onboardingComplete
                ? "Adjust your goals, preferences, and regeneration settings without losing the progress you\u2019ve already set up."
                : "Set your language and measurement system. Profile and meal plan settings become available once your setup is complete."}
            </p>
          </div>
          {onboardingComplete && (
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
          )}
        </section>

        {onboardingComplete && <Card className="bridge-section">
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
                  Re-enter your body stats to recalculate your calorie and macro targets. This will take you back to update your profile.
                </p>
              </div>
              <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(0)}>
                Update my profile
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
                <Label className="text-sm font-semibold text-foreground">Diet type</Label>
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

            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Meals per day</Label>
                <p className="text-sm leading-6 text-muted-foreground">Use the meal rhythm that feels realistic for your workdays and weekends.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5].map((count) => (
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
        </Card>}

        {onboardingComplete && <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Refine your targets</CardTitle>
            <CardDescription>
              Your current targets are a solid starting point. Detailed body stats can fine-tune them further.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            {!bodyStatsOpen ? (
              <div className="settings-section-panel space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                    <span className="text-sm font-semibold text-foreground">
                      {hasDetailedStats ? "Update body metrics" : "Add detailed body metrics"}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {hasDetailedStats
                      ? `Currently using ${userProfile.weight}${userProfile.unit}, ${userProfile.bodyFat}% body fat, ${userProfile.muscleMass}${userProfile.unit} muscle mass. Enter new measurements to recalculate your targets.`
                      : "Enter your weight, body fat %, and muscle mass from an InBody scan, smart scale, or your best estimate to get more accurate calorie and macro targets."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="h-12 min-h-[44px] flex-1"
                    onClick={() => {
                      setWeightInput(userProfile.weight > 0 ? String(userProfile.weight) : "")
                      setBodyFatInput(userProfile.bodyFat > 0 ? String(userProfile.bodyFat) : "")
                      setMuscleMassInput(userProfile.muscleMass > 0 ? String(userProfile.muscleMass) : "")
                      setBodyStatsError(null)
                      setBodyStatsOpen(true)
                    }}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {hasDetailedStats ? "Update metrics" : "Add detailed metrics"}
                  </Button>
                  {bodyStatsSaved && (
                    <span className="flex items-center gap-1 text-sm text-primary">
                      <Check className="h-4 w-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="settings-section-panel space-y-4">
                <div className="space-y-1">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Enter your current measurements to recalculate calorie and macro targets. Use an InBody scan, smart scale, or your best estimate.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="weightInput" className="text-sm font-medium text-foreground">
                      Weight ({userProfile.unit})
                    </Label>
                    <Input
                      id="weightInput"
                      type="number"
                      inputMode="decimal"
                      min={0.1}
                      step={0.1}
                      placeholder={userProfile.unit === "kg" ? "e.g. 80" : "e.g. 176"}
                      value={weightInput}
                      onChange={(e) => {
                        setWeightInput(e.target.value)
                        setBodyStatsError(null)
                      }}
                      className="settings-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bodyFatInput" className="text-sm font-medium text-foreground">
                      Body Fat (%)
                    </Label>
                    <Input
                      id="bodyFatInput"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={99}
                      step={0.1}
                      placeholder="e.g. 18.5"
                      value={bodyFatInput}
                      onChange={(e) => {
                        setBodyFatInput(e.target.value)
                        setBodyStatsError(null)
                      }}
                      className="settings-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="muscleMassInput" className="text-sm font-medium text-foreground">
                      Muscle Mass ({userProfile.unit})
                    </Label>
                    <Input
                      id="muscleMassInput"
                      type="number"
                      inputMode="decimal"
                      min={0.1}
                      step={0.1}
                      placeholder={userProfile.unit === "kg" ? "e.g. 32.5" : "e.g. 71.6"}
                      value={muscleMassInput}
                      onChange={(e) => {
                        setMuscleMassInput(e.target.value)
                        setBodyStatsError(null)
                      }}
                      className="settings-input"
                    />
                  </div>
                </div>
                {bodyStatsError && (
                  <p className="text-sm text-destructive">{bodyStatsError}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 min-h-[44px]"
                    onClick={() => {
                      setBodyStatsOpen(false)
                      setBodyStatsError(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-12 min-h-[44px]"
                    onClick={handleBodyStatsSave}
                  >
                    Save &amp; recalculate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>}

        {onboardingComplete && <Card className="bridge-section">
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
              <AlertDialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
                <Button className="h-12 min-h-[44px] w-full" onClick={handleRegenerate} disabled={isGeneratingMealPlan}>
                  {isGeneratingMealPlan ? "Regenerating..." : "Regenerate plan"}
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate meal plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace your current week plan with a new one based on your updated settings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmRegenerate}>Yes, regenerate</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>}

        <Card className="bridge-section">
          <CardHeader className="space-y-1 px-5 pt-5 pb-0 sm:px-6">
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Smaller app-level choices that keep reading and shopping comfortable day to day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 px-5 py-5 sm:px-6">
            <div className="settings-section-panel space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Appearance</Label>
                <p className="text-sm leading-6 text-muted-foreground">Switch between light and dark mode.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAppPrefs({ darkMode: false })}
                  className={cn("settings-chip flex-1 sm:flex-none", !appPrefs.darkMode ? "settings-chip-active" : "settings-chip-idle")}
                >
                  <Sun className="mr-1.5 inline h-3.5 w-3.5" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setAppPrefs({ darkMode: true })}
                  className={cn("settings-chip flex-1 sm:flex-none", appPrefs.darkMode ? "settings-chip-active" : "settings-chip-idle")}
                >
                  <Moon className="mr-1.5 inline h-3.5 w-3.5" />
                  Dark
                </button>
              </div>
            </div>

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
