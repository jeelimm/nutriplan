"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GroceryItemRow } from "@/components/grocery-item-row"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  useMealStore,
  CUISINE_OPTIONS,
  type ActivityLevel,
  type CuisinePreference,
  type DietType,
  type Goal,
  type Meal,
} from "@/lib/meal-store"
import { buildGroceryCategories } from "@/lib/grocery"
import { convertRecipeText } from "@/lib/recipe-units"
import { getGoalWeightTimeline, toKg } from "@/lib/nutrition"
import { ChevronLeft, ChevronRight, ShoppingCart, Flame, Beef, Wheat, Droplets, UtensilsCrossed, Check, ChevronDown, Clock, Sparkles, ArrowLeftRight } from "lucide-react"
import { MealSwapSheet } from "@/components/meal-swap-sheet"

function MacroProgress({ current, target, label, icon, color }: { 
  current: number
  target: number
  label: string
  icon: React.ReactNode
  color: string
}) {
  const percentage = Math.min((current / target) * 100, 100)
  const targetRemaining = Math.max(target - current, 0)
  
  return (
    <div className="dashboard-progress-row min-w-0 space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/95">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">
              {current >= target ? "At or above target" : `${targetRemaining}g still to go`}
            </div>
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
          {current}g / {target}g
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

const activityLevels: { id: ActivityLevel; label: string; description: string }[] = [
  { id: "sedentary", label: "Sedentary", description: "Mostly desk or home, little planned exercise" },
  { id: "light", label: "Light activity", description: "Easy walks, light workouts, or on-your-feet days" },
  { id: "moderate", label: "Moderate", description: "Regular workouts or active job, most weeks" },
  { id: "very-active", label: "Very active", description: "Hard training or very physical days most of the week" },
]

const goals: { id: Goal; label: string; description: string }[] = [
  { id: "lose-fat", label: "Lose Fat", description: "Slightly fewer calories, with protein to help you stay full" },
  { id: "gain-muscle", label: "Gain Muscle", description: "A bit more fuel to support strength work and recovery" },
  { id: "recomposition", label: "Lean Recomposition", description: "Steady eating with room to train and trim fat over time" },
]

const getShortDayLabel = (day: string) => day.slice(0, 3)

export function DailyView() {
  const {
    weekPlan,
    userProfile,
    mealPlanValidation,
    isGeneratingMealPlan,
    selectedDay,
    setSelectedDay,
    setCurrentStep,
    setUserProfile,
    calculateMacros,
    setMealPlanConfig,
    generateMealPlan,
  } = useMealStore()
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [dailyListCopied, setDailyListCopied] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate")
  const [goal, setGoal] = useState<Goal>("recomposition")
  const [editCuisines, setEditCuisines] = useState<CuisinePreference[]>([])
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [showLongWaitError, setShowLongWaitError] = useState(false)
  const [swapTarget, setSwapTarget] = useState<{ meal: Meal; dayIndex: number; mealIndex: number } | null>(null)

  const convertWeightValue = (value: string, fromUnit: "kg" | "lbs", toUnit: "kg" | "lbs"): string => {
    if (fromUnit === toUnit || !value.trim()) return value
    const n = Number(value)
    if (!Number.isFinite(n)) return value
    const converted = fromUnit === "kg" ? n * 2.20462 : n * 0.453592
    return String(Number(converted.toFixed(1)))
  }

  const setEditUnitWithConversion = (nextUnit: "kg" | "lbs") => {
    setUnit((prevUnit) => {
      if (prevUnit === nextUnit) return prevUnit
      setWeight((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setMuscleMass((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      return nextUnit
    })
  }

  const loadingMessages = [
    "Lining up meals for your week…",
    "Working with your calories and macros…",
    "Pulling from the ingredients you chose…",
    "Almost there—thanks for waiting…",
  ]

  useEffect(() => {
    if (!isGeneratingMealPlan) {
      setLoadingMessageIndex(0)
      setShowLongWaitError(false)
      return
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 3000)
    const timeout = window.setTimeout(() => {
      setShowLongWaitError(true)
    }, 45000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [isGeneratingMealPlan])

  const goalTimeline = useMemo(() => {
    if (!userProfile) return { kind: "none" as const }
    const wKg = toKg(userProfile.weight, userProfile.unit)
    const tKg =
      userProfile.targetWeight != null && Number.isFinite(userProfile.targetWeight)
        ? toKg(userProfile.targetWeight, userProfile.unit)
        : undefined
    return getGoalWeightTimeline(wKg, tKg, userProfile.goal, userProfile.unit, userProfile.weightLossPace)
  }, [userProfile])

  const openEditProfileModal = () => {
    if (!userProfile) return
    setProfileName(userProfile.profileName ?? "")
    setWeight(String(userProfile.weight))
    setBodyFat(String(userProfile.bodyFat))
    setMuscleMass(String(userProfile.muscleMass))
    setUnit(userProfile.unit)
    setActivityLevel(userProfile.activityLevel)
    setGoal(userProfile.goal)
    setEditCuisines(
      userProfile.cuisinePreference && userProfile.cuisinePreference.length > 0
        ? [...userProfile.cuisinePreference]
        : []
    )
    setShowEditProfileModal(true)
  }

  const toggleEditCuisine = (id: CuisinePreference) => {
    setEditCuisines((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length < 2) return [...prev, id]
      return [prev[1], id]
    })
  }

  const handleSaveProfile = () => {
    if (!userProfile) return
    if (editCuisines.length < 1) return
    const nextWeight = Number(weight)
    const nextBodyFat = Number(bodyFat)
    const nextMuscleMass = Number(muscleMass)
    const mealsPerDay = userProfile.mealsPerDay
    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextBodyFat) || !Number.isFinite(nextMuscleMass)) return

    const weightKg = unit === "lbs" ? nextWeight * 0.453592 : nextWeight
    const targetKg =
      userProfile.targetWeight != null && Number.isFinite(userProfile.targetWeight)
        ? toKg(userProfile.targetWeight, userProfile.unit)
        : null

    const { calories, macros } = calculateMacros(
      weightKg,
      nextBodyFat,
      goal,
      activityLevel,
      userProfile.dietType,
      userProfile.sex,
      targetKg,
      userProfile.weightLossPace ?? null
    )
    const now = new Date().toISOString()

    setUserProfile({
      ...userProfile,
      profileName: profileName.trim(),
      weight: nextWeight,
      bodyFat: nextBodyFat,
      muscleMass: nextMuscleMass,
      unit,
      goal,
      activityLevel,
      mealsPerDay,
      cuisinePreference: editCuisines,
      dailyCalories: calories,
      macros,
      lastUpdatedAt: now,
    })
    setShowEditProfileModal(false)
    setShowRegenerateConfirmModal(true)
  }

  const handleRegenerateFromProfile = async () => {
    if (!userProfile || isGeneratingMealPlan) return
    setShowRegenerateConfirmModal(false)
    setCurrentStep(2)
    try {
      setMealPlanConfig({ dietType: userProfile.dietType as DietType, mealsPerDay: userProfile.mealsPerDay })
      await generateMealPlan()
    } catch {}
  }

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

  if (!userProfile) return null

  if (isGeneratingMealPlan) {
    return (
      <div className="app-shell bg-background px-4 py-6 md:px-8 md:py-8">
        <div className="page-column flex min-h-[72vh] flex-col justify-center">
          <div className="bridge-status-panel">
            <div className="hero-badge mx-auto bg-[#fff7ee] text-[#7a5b41]">Building your plan</div>
            <div className="bridge-status-icon mt-4">
              <Spinner className="size-6 text-primary" />
            </div>
            <div className="mt-5 space-y-2">
              <h2 className="text-[1.75rem] font-semibold leading-tight text-foreground">{loadingMessages[loadingMessageIndex]}</h2>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                We&apos;re shaping a week around your targets, ingredients, and meal rhythm so it feels realistic to shop
                and repeat.
              </p>
            </div>

            <div className="mt-5 space-y-2.5 text-left">
              {[
                "Matching calories and macros to your profile",
                "Working from the cuisines and ingredients you picked",
                "Keeping the grocery list simpler for real life",
              ].map((message) => (
                <div key={message} className="bridge-note-strip">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                  <span>{message}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">Usually under a minute</p>
            {showLongWaitError && (
              <div className="bridge-soft-callout mt-4 text-left">
                This is taking a bit longer than usual. Try again in a moment if it still doesn&apos;t finish. Your
                profile and ingredient choices are still saved.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!weekPlan.length && !mealPlanValidation.isValid) {
    return (
      <div className="app-shell bg-background px-4 py-6 md:px-8 md:py-8">
        <div className="page-column flex min-h-[72vh] flex-col justify-center">
          <div className="bridge-status-panel text-left sm:text-center">
            <div className="hero-badge mx-auto bg-[#fff7ee] text-[#7a5b41]">Plan needs another try</div>
            <div className="bridge-status-icon mt-4 border-[#e5d7c7] bg-[#f8f2ea] text-[#b77749]">
              <Sparkles className="size-6" />
            </div>
            <div className="mt-5 space-y-2">
              <h2 className="text-[1.75rem] font-semibold leading-tight text-foreground">
                We couldn&apos;t finish this meal plan yet
              </h2>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                {mealPlanValidation.errors[0] ??
                  "Something didn’t line up with your settings. Try again and you won’t lose your profile."}
              </p>
            </div>
            <div className="bridge-soft-callout mt-5 text-left">
              Your profile is still saved. You can try again now or go back and adjust the setup first.
            </div>
            <div className="mt-5 space-y-3">
              <Button className="h-12 min-h-[44px] w-full" onClick={generateMealPlan}>
                Try again
              </Button>
              <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={() => setCurrentStep(1)}>
                Back to plan setup
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!weekPlan.length) return null

  const currentDay = weekPlan[selectedDay]
  const recipeUnitSystem = userProfile.unitSystem ?? "metric"
  const convertedIngredients = currentDay.meals.flatMap((meal) =>
    meal.ingredients.map((ingredient) => ({
      ...ingredient,
      amount: convertRecipeText(ingredient.amount, recipeUnitSystem),
    }))
  )

  const groceryCategories = buildGroceryCategories(convertedIngredients)

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
  const calorieDifference = userProfile.dailyCalories - currentDay.totalCalories
  const getMealLabel = (index: number, totalMeals: number): string => {
    if (index === 0) return "Breakfast"
    if (index === 1) return "Lunch"
    if (index === 2 || index === totalMeals - 1) return "Dinner"
    if (index < totalMeals - 1) return "Snack"
    return "Meal"
  }

  const handleCopyDailyList = async () => {
    const listText = groceryCategories
      .map(({ category, items }) => {
        const label = categoryLabels[category] || category
        const lines = items.map((item) => `  - ${item.name}: ${item.amounts}`).join("\n")
        return `${label}:\n${lines}`
      })
      .join("\n\n")
    await navigator.clipboard.writeText(listText)
    setDailyListCopied(true)
    window.setTimeout(() => setDailyListCopied(false), 2000)
  }

  if (showGroceryList) {
    return (
      <div className="app-shell bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="page-column px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowGroceryList(false)}
                className="bridge-back-link"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Back to meal plan</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDailyList}
                className="h-11 min-h-[44px] gap-2 shrink-0"
              >
                {dailyListCopied ? "Copied" : "Copy list"}
              </Button>
            </div>
            <h1 className="break-words text-xl font-semibold text-foreground sm:text-2xl">
              Shopping list · {currentDay.day}
            </h1>
          </div>
        </div>

        <div className="page-column space-y-4 px-4">
          <div className="space-y-2.5">
            {groceryCategories.map(({ category, items }) => (
              <Card key={category} className="grocery-category-card">
                <CardHeader className="gap-1.5 px-4 pb-2.5 pt-4 sm:px-5">
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="break-words text-base font-semibold text-foreground">
                      {categoryLabels[category] || category}
                    </span>
                    <span className="grocery-category-count">{items.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 sm:px-5">
                  <div className="grocery-list-panel overflow-hidden">
                    {items.map((item) => (
                      <GroceryItemRow
                        key={item.name}
                        name={item.name}
                        amount={item.amounts}
                        compact
                        className="border-b border-border/80 last:border-b-0"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell bg-background pb-28">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="page-column px-4 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="bridge-back-link mb-3 w-full justify-center sm:w-auto sm:justify-start"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="break-words">Back to plan setup</span>
          </button>

          <section className="dashboard-header-panel space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Your meal plan</div>
                <h1 className="mt-3 break-words text-[1.95rem] font-semibold leading-tight text-foreground sm:text-[2.15rem]">
                  {currentDay.day}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Day {selectedDay + 1} of 7 in your weekly rotation</p>
              </div>
              <Button variant="outline" className="h-11 min-h-[44px] w-full sm:w-auto" onClick={openEditProfileModal}>
                Edit profile
              </Button>
            </div>

            <p className="max-w-[34rem] text-sm leading-6 text-muted-foreground">
              Aim close to your targets, not perfect. This plan is meant to help you repeat good-enough days that fit
              real life.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                disabled={selectedDay === 0}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="grid min-w-0 flex-1 grid-cols-7 gap-1.5">
                {weekPlan.map((dayPlan, idx) => (
                  <button
                    key={dayPlan.day}
                    type="button"
                    onClick={() => setSelectedDay(idx)}
                    className={cn(
                      "dashboard-day-chip",
                      idx === selectedDay
                        ? "border-primary bg-[#edf4ec] text-foreground shadow-[0_14px_26px_-24px_rgba(38,96,63,0.5)]"
                        : ""
                    )}
                    aria-label={`View ${dayPlan.day}`}
                    aria-current={idx === selectedDay ? "date" : undefined}
                  >
                    <span className="text-[13px] font-semibold leading-none text-foreground">{getShortDayLabel(dayPlan.day)}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
                disabled={selectedDay === 6}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                aria-label="Next day"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="page-column space-y-4 px-4">
        {mealPlanValidation.warnings.length > 0 && (
          <div className="dashboard-warning break-words">
            {mealPlanValidation.warnings[0]}
          </div>
        )}
        <Card className="bridge-section">
          <CardHeader className="gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today at a glance</span>
            </div>
            <div className="flex min-w-0 items-end justify-between gap-3">
              <CardTitle className="flex min-w-0 items-center gap-2 text-[1.35rem] leading-tight">
                <Flame className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-words">Calories and macros</span>
              </CardTitle>
              <div className="shrink-0 text-right">
                <div className="text-3xl font-semibold tabular-nums text-foreground">{currentDay.totalCalories}</div>
                <div className="text-xs text-muted-foreground">of {userProfile.dailyCalories} cal</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="dashboard-kpi-tile">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Daily target
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {userProfile.dailyCalories}
                </div>
                <div className="text-sm text-muted-foreground">calories planned</div>
              </div>
              <div className="dashboard-kpi-tile">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {calorieDifference >= 0 ? "Still available" : "Over target"}
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {Math.abs(Math.round(calorieDifference))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {calorieDifference >= 0 ? "calories left today" : "calories above target"}
                </div>
              </div>
            </div>

            <div className="bridge-note-strip">
              <Flame className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="break-words">
                Close enough counts. Use this as a guide for the day, not a pass-fail score.
              </span>
            </div>

            <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-secondary">
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

        {goalTimeline.kind !== "none" && (
          <Card className="bridge-section">
            <CardContent className="space-y-2 px-5 py-4 text-sm sm:px-6">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Goal outlook</span>
              </div>
              {goalTimeline.kind === "estimate" && (
                <>
                  <p className="break-words font-medium leading-6 text-foreground">{goalTimeline.summaryLine}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{goalTimeline.disclaimer}</p>
                </>
              )}
              {goalTimeline.kind === "gain-muscle" && (
                <p className="leading-6 text-muted-foreground">{goalTimeline.message}</p>
              )}
              {goalTimeline.kind === "past-target" && (
                <p className="leading-6 text-muted-foreground">{goalTimeline.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meals for today
            </h2>
            <span className="dashboard-meta-pill">{currentDay.meals.length} planned</span>
          </div>

          {currentDay.meals.map((meal, idx) => {
            const isExpanded = expandedMeals.has(meal.id)
            return (
              <Card key={meal.id} className="bridge-section">
                <CardContent className="px-5 py-5 sm:px-6">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="dashboard-meta-pill bg-[#fff7ee] text-[#7a5b41]">
                        {getMealLabel(idx, currentDay.meals.length)}
                      </span>
                      <div className="mt-3 break-words text-lg font-semibold leading-snug text-foreground">{meal.name}</div>
                    </div>
                    <div className="dashboard-kpi-tile shrink-0 px-3 py-2 text-right">
                      <div className="text-lg font-semibold tabular-nums text-foreground">{meal.calories}</div>
                      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">cal</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="dashboard-meta-pill">
                      <span className="h-2 w-2 rounded-full bg-chart-1" />
                      {meal.protein}g protein
                    </span>
                    <span className="dashboard-meta-pill">
                      <span className="h-2 w-2 rounded-full bg-chart-3" />
                      {meal.carbs}g carbs
                    </span>
                    <span className="dashboard-meta-pill">
                      <span className="h-2 w-2 rounded-full bg-chart-2" />
                      {meal.fat}g fat
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleMealExpanded(meal.id)}
                      className="flex min-h-11 flex-1 items-center justify-between rounded-2xl border border-border bg-background/82 px-4 py-3 text-left text-sm font-medium text-foreground transition-[background-color,border-color] hover:border-primary/25 hover:bg-[#fcf7ef]"
                    >
                      <span>Recipe & details</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSwapTarget({ meal, dayIndex: selectedDay, mealIndex: idx })}
                      className="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-background/82 px-4 py-3 text-sm font-medium text-foreground transition-[background-color,border-color] hover:border-primary/25 hover:bg-[#fcf7ef]"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      <span>Swap</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className="dashboard-meta-pill border-primary/15 bg-primary/10 text-foreground">
                          <Clock className="h-4 w-4 shrink-0 text-primary" />
                          <span className="break-words text-foreground">
                            <span className="font-medium">Total:</span> {(meal.prepTime || 0) + (meal.cookTime || 0)} min
                          </span>
                        </div>
                        <span className="break-words text-sm text-muted-foreground">
                          Prep: {meal.prepTime || 0} min | Cook: {meal.cookTime || 0} min
                        </span>
                      </div>

                      <div className="dashboard-detail-panel">
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#5e665f]">Ingredients</h4>
                        <ul className="space-y-1.5">
                          {meal.ingredients.map((ingredient, i) => (
                            <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span className="min-w-0 flex-1 break-words text-foreground">{ingredient.name}</span>
                              <span className="break-words text-muted-foreground">— {convertRecipeText(ingredient.amount, recipeUnitSystem)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="dashboard-detail-panel">
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#5e665f]">Instructions</h4>
                        <ol className="space-y-2">
                          {(meal.instructions || []).map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1 break-words text-muted-foreground">{convertRecipeText(step, recipeUnitSystem)}</span>
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

        <Card className="bridge-section">
          <CardContent className="space-y-3 px-5 py-5 sm:px-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shopping help</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Take the plan with you</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Open today&apos;s list when you need something quick, or use the full weekly list for one grocery run.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-12 min-h-[44px] w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setShowGroceryList(true)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shopping list for {currentDay.day}
            </Button>
            <Button
              className="h-12 min-h-[44px] w-full"
              onClick={() => setCurrentStep(3)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Full weekly shopping list
            </Button>
          </CardContent>
        </Card>
      </div>


      {showEditProfileModal && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal-shell max-w-lg">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Profile editor</div>
                <div className="space-y-2">
                  <h2 className="break-words text-[1.65rem] font-semibold leading-tight text-foreground">Update your profile</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Keep your targets grounded in your current body stats and usual week. You can choose whether to regenerate after saving.
                  </p>
                </div>
              </div>

              <div className="settings-section-panel space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                    <span className="text-sm font-semibold text-foreground">Basics</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">Use the details that best match how things look right now, not a perfect average.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileName" className="text-sm font-semibold text-foreground">Profile name</Label>
                  <Input
                    id="profileName"
                    className="settings-input w-full min-w-0"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Joe"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Weight</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditUnitWithConversion("kg")}
                      className={cn("settings-chip flex-1 sm:flex-none", unit === "kg" ? "settings-chip-active" : "settings-chip-idle")}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUnitWithConversion("lbs")}
                      className={cn("settings-chip flex-1 sm:flex-none", unit === "lbs" ? "settings-chip-active" : "settings-chip-idle")}
                    >
                      lbs
                    </button>
                  </div>
                  <Input
                    className="settings-input w-full min-w-0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    type="number"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="settings-section-panel space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                    <span className="text-sm font-semibold text-foreground">Body stats</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">These numbers keep calorie and protein targets anchored to your current body composition.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Body fat %</Label>
                    <Input
                      className="settings-input w-full min-w-0"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      type="number"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Muscle mass</Label>
                    <Input
                      className="settings-input w-full min-w-0"
                      value={muscleMass}
                      onChange={(e) => setMuscleMass(e.target.value)}
                      type="number"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section-panel space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                    <span className="text-sm font-semibold text-foreground">Weekly context</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">Choose the goal and activity level that feel closest to a normal week.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Activity level</Label>
                  <div className="grid gap-2">
                    {activityLevels.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setActivityLevel(level.id)}
                        className={cn(
                          "settings-choice-card",
                          activityLevel === level.id ? "settings-choice-card-active" : "settings-choice-card-idle"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{level.label}</div>
                            <div className="mt-1 text-sm leading-6 text-muted-foreground">{level.description}</div>
                          </div>
                          {activityLevel === level.id && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Goal</Label>
                  <div className="grid gap-2">
                    {goals.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGoal(item.id)}
                        className={cn(
                          "settings-choice-card",
                          goal === item.id ? "settings-choice-card-active" : "settings-choice-card-idle"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{item.label}</div>
                            <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                          </div>
                          {goal === item.id && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-section-panel space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b77749]" />
                    <span className="text-sm font-semibold text-foreground">Cuisine focus</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">Pick one or two cuisines to keep the next plan realistic to shop for and repeat.</p>
                </div>
                <div className="grid gap-2">
                  {CUISINE_OPTIONS.map((c) => {
                    const selected = editCuisines.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleEditCuisine(c.id)}
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

              <div className="bridge-note-strip">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                <span>Saving updates your targets right away. You can decide in the next step whether to regenerate this week&apos;s plan.</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </Button>
              <Button className="h-12 min-h-[44px] flex-1" onClick={handleSaveProfile} disabled={editCuisines.length < 1}>
                Save profile updates
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateConfirmModal && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal-shell max-w-md">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="hero-badge bg-[#fff7ee] text-[#7a5b41]">Plan refresh</div>
                <div className="space-y-2">
                  <h3 className="break-words text-[1.5rem] font-semibold leading-tight text-foreground">Use these updates for a new meal plan?</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Your profile is already saved. Regenerate when you want your meals and grocery list to catch up with the new settings.
                  </p>
                </div>
              </div>

              <div className="bridge-note-strip">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                <span>Your current plan will stay in place until the new one finishes generating.</span>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-12 min-h-[44px] flex-1"
                  onClick={() => setShowRegenerateConfirmModal(false)}
                  disabled={isGeneratingMealPlan}
                >
                  Keep current plan
                </Button>
                <Button
                  className="h-12 min-h-[44px] flex-1"
                  onClick={handleRegenerateFromProfile}
                  disabled={isGeneratingMealPlan}
                >
                  {isGeneratingMealPlan ? "Regenerating..." : "Regenerate plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {swapTarget && (
        <MealSwapSheet
          isOpen={swapTarget !== null}
          onClose={() => setSwapTarget(null)}
          currentMeal={swapTarget.meal}
          dayIndex={swapTarget.dayIndex}
          mealIndex={swapTarget.mealIndex}
        />
      )}
    </div>
  )
}
