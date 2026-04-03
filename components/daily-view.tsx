"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useMealStore, type ActivityLevel, type DietType, type Goal } from "@/lib/meal-store"
import { buildGroceryCategories } from "@/lib/grocery"
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

const activityLevels: { id: ActivityLevel; label: string; description: string }[] = [
  { id: "sedentary", label: "Sedentary", description: "Little or no exercise" },
  { id: "light", label: "Light activity", description: "Light exercise most days" },
  { id: "moderate", label: "Moderate", description: "3-5 days/week" },
  { id: "very-active", label: "Very active", description: "Hard exercise 6-7 days/week" },
]

const goals: { id: Goal; label: string; description: string }[] = [
  { id: "lose-fat", label: "Lose Fat", description: "Caloric deficit with high protein" },
  { id: "gain-muscle", label: "Gain Muscle", description: "Caloric surplus for growth" },
  { id: "recomposition", label: "Lean Recomposition", description: "Build muscle while losing fat" },
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [showLongWaitError, setShowLongWaitError] = useState(false)

  const loadingMessages = [
    "Building your personalized meal plan...",
    "Calculating your macros...",
    "Finding the best ingredients for you...",
    "Almost ready...",
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

  const openEditProfileModal = () => {
    if (!userProfile) return
    setProfileName(userProfile.profileName ?? "")
    setWeight(String(userProfile.weight))
    setBodyFat(String(userProfile.bodyFat))
    setMuscleMass(String(userProfile.muscleMass))
    setUnit(userProfile.unit)
    setActivityLevel(userProfile.activityLevel)
    setGoal(userProfile.goal)
    setShowEditProfileModal(true)
  }

  const handleSaveProfile = () => {
    if (!userProfile) return
    const nextWeight = Number(weight)
    const nextBodyFat = Number(bodyFat)
    const nextMuscleMass = Number(muscleMass)
    const mealsPerDay = userProfile.mealsPerDay
    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextBodyFat) || !Number.isFinite(nextMuscleMass)) return

    const { calories, macros } = calculateMacros(
      unit === "lbs" ? nextWeight * 0.453592 : nextWeight,
      nextBodyFat,
      goal,
      activityLevel,
      userProfile.dietType
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
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
          <Spinner className="mb-4 size-8 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{loadingMessages[loadingMessageIndex]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">This may take up to 30 seconds</p>
          {showLongWaitError && (
            <p className="mt-4 text-sm font-medium text-destructive">
              Taking longer than expected. Please try again.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!weekPlan.length && !mealPlanValidation.isValid) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-lg">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">We couldn&apos;t build a valid meal plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {mealPlanValidation.errors[0] ?? "Your meal plan failed validation. Please regenerate."}
              </p>
              <Button className="w-full" onClick={generateMealPlan}>
                Regenerate Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!weekPlan.length) return null

  const currentDay = weekPlan[selectedDay]

  const groceryCategories = buildGroceryCategories(currentDay.meals.flatMap((meal) => meal.ingredients))

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
          <Button variant="outline" className="mt-3 h-9 w-full" onClick={openEditProfileModal}>
            Edit Profile
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

      <div className="mx-auto max-w-lg px-4">
        {mealPlanValidation.warnings.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {mealPlanValidation.warnings[0]}
          </div>
        )}
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
              {groceryCategories.map(({ category, items }) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-lg bg-secondary p-3"
                      >
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.amounts}</span>
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

      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Edit Profile</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileName">Profile Name</Label>
                <Input
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Joe"
                />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnit("kg")}
                    className={`rounded-lg px-3 py-2 text-sm ${unit === "kg" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("lbs")}
                    className={`rounded-lg px-3 py-2 text-sm ${unit === "lbs" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    lbs
                  </button>
                </div>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" inputMode="decimal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Body Fat %</Label>
                  <Input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} type="number" inputMode="decimal" />
                </div>
                <div className="space-y-2">
                  <Label>Muscle Mass</Label>
                  <Input value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} type="number" inputMode="decimal" />
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
                      className={`w-full rounded-xl border-2 p-3 text-left ${
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
                      className={`w-full rounded-xl border-2 p-3 text-left ${
                        goal === item.id ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl">
            <h3 className="text-lg font-semibold text-foreground">
              Profile updated. Regenerate meal plan with new settings?
            </h3>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRegenerateConfirmModal(false)}
              >
                No
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (userProfile) {
                    setMealPlanConfig({ dietType: userProfile.dietType as DietType, mealsPerDay: userProfile.mealsPerDay })
                    generateMealPlan()
                  }
                  setShowRegenerateConfirmModal(false)
                }}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
