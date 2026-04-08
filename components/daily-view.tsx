"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  useMealStore,
  CUISINE_OPTIONS,
  type ActivityLevel,
  type CuisinePreference,
  type DietType,
  type Goal,
} from "@/lib/meal-store"
import { buildGroceryCategories } from "@/lib/grocery"
import { convertRecipeText } from "@/lib/recipe-units"
import { getGoalWeightTimeline, toKg } from "@/lib/nutrition"
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
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0">{icon}</span>
          <span className="truncate text-muted-foreground">{label}</span>
        </div>
        <span className="shrink-0 whitespace-nowrap font-medium tabular-nums">{current}g / {target}g</span>
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

  if (isGeneratingMealPlan && !weekPlan.length) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background p-4 md:p-8">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 text-center shadow-lg sm:p-10">
          <Spinner className="mb-4 size-8 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{loadingMessages[loadingMessageIndex]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Usually under a minute</p>
          {showLongWaitError && (
            <p className="mt-4 text-sm font-medium text-destructive">
              This is taking longer than usual. Try again in a moment—nothing you did wrong.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!weekPlan.length && !mealPlanValidation.isValid) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background p-4 md:p-8">
        <div className="mx-auto max-w-lg">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">We couldn&apos;t finish this meal plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {mealPlanValidation.errors[0] ?? "Something didn’t line up with your settings. Try generating again—you won’t lose your profile."}
              </p>
              <Button className="h-12 min-h-[44px] w-full" onClick={generateMealPlan}>
                Try again
              </Button>
            </CardContent>
          </Card>
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
  const getMealLabel = (index: number, totalMeals: number): string => {
    if (index === 0) return "Breakfast"
    if (index === 1) return "Lunch"
    if (index === 2 || index === totalMeals - 1) return "Dinner"
    if (index < totalMeals - 1) return "Snack"
    return "Meal"
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-lg min-w-0 px-4 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="mb-3 flex min-h-11 w-full max-w-full items-center gap-1 rounded-md py-2 text-left text-sm text-muted-foreground hover:text-foreground sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="break-words">Back to plan setup</span>
          </button>

          {/* Day Selector */}
          <div className="flex min-w-0 items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
              disabled={selectedDay === 0}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary disabled:opacity-50"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 px-1 text-center">
              <div className="break-words text-xl font-bold leading-tight text-foreground sm:text-2xl">{currentDay.day}</div>
              <div className="text-xs text-muted-foreground sm:text-sm">Day {selectedDay + 1} of 7</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
              disabled={selectedDay === 6}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary disabled:opacity-50"
              aria-label="Next day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <Button variant="outline" className="mt-3 h-11 min-h-[44px] w-full" onClick={openEditProfileModal}>
            Edit profile
          </Button>

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

      <div className="mx-auto max-w-lg min-w-0 px-4">
        {mealPlanValidation.warnings.length > 0 && (
          <div className="mb-4 break-words rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {mealPlanValidation.warnings[0]}
          </div>
        )}
        {/* Daily Progress Card */}
        <Card className="mb-4 border-0 shadow-lg">
          <CardHeader className="px-4 pb-2 pt-6 sm:px-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base leading-snug sm:text-lg">
                <Flame className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-words">Today vs your targets</span>
              </CardTitle>
              <div className="shrink-0 text-left sm:text-right">
                <div className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{currentDay.totalCalories}</div>
                <div className="text-xs text-muted-foreground">of {userProfile.dailyCalories} cal</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-6 sm:px-6">
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

        {goalTimeline.kind !== "none" && (
          <Card className="mb-4 border-0 shadow-lg">
            <CardContent className="space-y-2 p-4 pt-6 text-sm sm:p-6">
              {goalTimeline.kind === "estimate" && (
                <>
                  <p className="break-words font-medium text-foreground">{goalTimeline.summaryLine}</p>
                  <p className="text-xs text-muted-foreground">{goalTimeline.disclaimer}</p>
                </>
              )}
              {goalTimeline.kind === "gain-muscle" && (
                <p className="text-muted-foreground">{goalTimeline.message}</p>
              )}
              {goalTimeline.kind === "past-target" && (
                <p className="text-muted-foreground">{goalTimeline.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Meals */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Meals for this day
          </h2>

          {currentDay.meals.map((meal, idx) => {
            const isExpanded = expandedMeals.has(meal.id)
            return (
              <Card key={meal.id} className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-primary">{getMealLabel(idx, currentDay.meals.length)}</div>
                      <div className="break-words font-semibold text-foreground">{meal.name}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold tabular-nums text-foreground">{meal.calories}</div>
                      <div className="text-xs text-muted-foreground">cal</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex min-w-0 items-center gap-1">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-chart-1" />
                      <span className="break-words text-muted-foreground">{meal.protein}g protein</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-chart-3" />
                      <span className="break-words text-muted-foreground">{meal.carbs}g carbs</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-chart-2" />
                      <span className="break-words text-muted-foreground">{meal.fat}g fat</span>
                    </div>
                  </div>

                  {/* View Recipe Button */}
                  <button
                    type="button"
                    onClick={() => toggleMealExpanded(meal.id)}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                  >
                    Recipe & details
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expandable Recipe Section */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {/* Prep + Cook Time */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                          <Clock className="h-4 w-4 shrink-0 text-primary" />
                          <span className="break-words text-foreground">
                            <span className="font-medium">Total:</span> {(meal.prepTime || 0) + (meal.cookTime || 0)} min
                          </span>
                        </div>
                        <span className="break-words text-muted-foreground">
                          Prep: {meal.prepTime || 0} min | Cook: {meal.cookTime || 0} min
                        </span>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Ingredients</h4>
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

                      {/* Instructions */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Instructions</h4>
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

        {/* Grocery List Button */}
        <Button
          variant="outline"
          className="mt-6 h-12 min-h-[44px] w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => setShowGroceryList(true)}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Shopping list for {currentDay.day}
        </Button>

        {/* Weekly Grocery List Link */}
        <Button
          className="mt-3 h-12 min-h-[44px] w-full"
          onClick={() => setCurrentStep(3)}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Full weekly shopping list
        </Button>
      </div>

      {/* Grocery List Modal */}
      {showGroceryList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="max-h-[85vh] w-full max-w-lg min-w-0 overflow-y-auto overflow-x-hidden rounded-t-3xl bg-card p-4 shadow-2xl sm:p-6 md:rounded-3xl">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 break-words text-lg font-bold text-foreground sm:text-xl">
                Shopping list · {currentDay.day}
              </h2>
              <button
                type="button"
                onClick={() => setShowGroceryList(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
                aria-label="Close shopping list"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {groceryCategories.map(({ category, items }) => (
                <div key={category}>
                  <h3 className="mb-2 break-words text-sm font-semibold uppercase tracking-wide text-primary">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-col gap-1 rounded-lg bg-secondary p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                      >
                        <span className="min-w-0 break-words text-foreground">{item.name}</span>
                        <span className="shrink-0 break-words text-sm text-muted-foreground sm:max-w-[45%] sm:text-right">
                          {item.amounts}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="mt-6 h-12 min-h-[44px] w-full"
              onClick={() => setShowGroceryList(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="max-h-[90vh] w-full max-w-lg min-w-0 overflow-y-auto overflow-x-hidden rounded-t-3xl bg-card p-4 shadow-2xl sm:p-6 md:rounded-3xl">
            <h2 className="mb-4 break-words text-xl font-bold text-foreground">Update your profile</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileName">Profile Name</Label>
                <Input
                  id="profileName"
                  className="w-full min-w-0"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Joe"
                />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUnit("kg")}
                    className={`min-h-11 min-w-[44px] flex-1 rounded-lg px-3 py-2 text-sm sm:flex-none ${unit === "kg" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("lbs")}
                    className={`min-h-11 min-w-[44px] flex-1 rounded-lg px-3 py-2 text-sm sm:flex-none ${unit === "lbs" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    lbs
                  </button>
                </div>
                <Input className="w-full min-w-0" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" inputMode="decimal" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Body Fat %</Label>
                  <Input className="w-full min-w-0" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} type="number" inputMode="decimal" />
                </div>
                <div className="space-y-2">
                  <Label>Muscle Mass</Label>
                  <Input className="w-full min-w-0" value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} type="number" inputMode="decimal" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setActivityLevel(level.id)}
                      className={`min-h-[44px] w-full rounded-xl border-2 p-3 text-left ${
                        activityLevel === level.id ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <div className="space-y-2">
                  {goals.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id)}
                      className={`min-h-[44px] w-full rounded-xl border-2 p-3 text-left ${
                        goal === item.id ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cuisine (pick 1–2)</Label>
                <p className="text-xs text-muted-foreground">Used when generating your meal plan</p>
                <div className="grid gap-2">
                  {CUISINE_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleEditCuisine(c.id)}
                      className={`min-h-[44px] rounded-xl border-2 p-3 text-left text-sm ${
                        editCuisines.includes(c.id) ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </Button>
              <Button className="h-12 min-h-[44px] flex-1" onClick={handleSaveProfile} disabled={editCuisines.length < 1}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md min-w-0 rounded-t-3xl bg-card p-4 shadow-2xl sm:p-6 md:rounded-3xl">
            <h3 className="break-words text-lg font-semibold text-foreground">
              Profile saved. Want a fresh 7-day plan with these numbers?
            </h3>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-12 min-h-[44px] flex-1"
                onClick={() => setShowRegenerateConfirmModal(false)}
              >
                Not now
              </Button>
              <Button
                className="h-12 min-h-[44px] flex-1"
                onClick={() => {
                  if (userProfile) {
                    setMealPlanConfig({ dietType: userProfile.dietType as DietType, mealsPerDay: userProfile.mealsPerDay })
                    generateMealPlan()
                  }
                  setShowRegenerateConfirmModal(false)
                }}
              >
                Regenerate plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
