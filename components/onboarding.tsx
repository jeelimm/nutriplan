"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMealStore, type ActivityLevel, type DietType, type Goal } from "@/lib/meal-store"
import {
  Scale,
  Target,
  TrendingUp,
  Activity,
  Dumbbell,
  RefreshCw,
  HeartPulse,
  Salad,
  ChevronLeft,
  Search,
} from "lucide-react"

const goals: { id: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "lose-fat", label: "Lose Fat", description: "Caloric deficit with high protein", icon: <TrendingUp className="h-6 w-6" /> },
  { id: "gain-muscle", label: "Gain Muscle", description: "Caloric surplus for growth", icon: <Dumbbell className="h-6 w-6" /> },
  { id: "recomposition", label: "Lean Recomposition", description: "Build muscle while losing fat", icon: <RefreshCw className="h-6 w-6" /> },
]

const activityLevels: { id: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { id: "sedentary", label: "Sedentary", description: "Little or no exercise", multiplier: 1.2 },
  { id: "light", label: "Light activity", description: "Light exercise most days", multiplier: 1.375 },
  { id: "moderate", label: "Moderate", description: "3-5 days/week", multiplier: 1.55 },
  { id: "very-active", label: "Very active", description: "Hard exercise 6-7 days/week", multiplier: 1.725 },
]

const dietTypes: { id: DietType; label: string; description: string }[] = [
  { id: "keto", label: "Keto", description: "Low carb, high fat" },
  { id: "high-protein", label: "High Protein", description: "Maximum protein intake" },
  { id: "balanced", label: "Balanced", description: "Equal macro distribution" },
  { id: "intermittent-fasting", label: "Intermittent Fasting", description: "Larger meals, time-restricted" },
]

type IngredientCategory = "protein" | "carbs" | "fats" | "vegetables"
type CostTier = "$" | "$$" | "$$$"

interface IngredientOption {
  name: string
  category: IngredientCategory
  calories: number
  protein: number
  carbs: number
  fat: number
  cost: CostTier
}

const ingredientCatalog: IngredientOption[] = [
  { name: "Chicken breast", category: "protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, cost: "$" },
  { name: "Eggs", category: "protein", calories: 143, protein: 13, carbs: 1.1, fat: 10, cost: "$" },
  { name: "Canned tuna", category: "protein", calories: 132, protein: 29, carbs: 0, fat: 1, cost: "$" },
  { name: "Greek yogurt", category: "protein", calories: 97, protein: 10, carbs: 3.6, fat: 5, cost: "$" },
  { name: "Salmon", category: "protein", calories: 208, protein: 20, carbs: 0, fat: 13, cost: "$$" },
  { name: "Ground beef", category: "protein", calories: 250, protein: 26, carbs: 0, fat: 15, cost: "$$" },
  { name: "Ribeye", category: "protein", calories: 291, protein: 24, carbs: 0, fat: 21, cost: "$$$" },
  { name: "Shrimp", category: "protein", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, cost: "$$$" },
  { name: "Turkey breast", category: "protein", calories: 135, protein: 30, carbs: 0, fat: 1, cost: "$$$" },
  { name: "Whey protein", category: "protein", calories: 400, protein: 80, carbs: 10, fat: 7, cost: "$$$" },
  { name: "White rice", category: "carbs", calories: 130, protein: 2.4, carbs: 28, fat: 0.3, cost: "$" },
  { name: "Oats", category: "carbs", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, cost: "$" },
  { name: "Sweet potato", category: "carbs", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, cost: "$" },
  { name: "Banana", category: "carbs", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, cost: "$" },
  { name: "Brown rice", category: "carbs", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, cost: "$$" },
  { name: "Quinoa", category: "carbs", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, cost: "$$" },
  { name: "Apple", category: "carbs", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, cost: "$$" },
  { name: "Granola", category: "carbs", calories: 471, protein: 10, carbs: 64, fat: 20, cost: "$$$" },
  { name: "Olive oil", category: "fats", calories: 884, protein: 0, carbs: 0, fat: 100, cost: "$" },
  { name: "Peanut butter", category: "fats", calories: 588, protein: 25, carbs: 20, fat: 50, cost: "$" },
  { name: "Avocado", category: "fats", calories: 160, protein: 2, carbs: 8.5, fat: 14.7, cost: "$$" },
  { name: "Mixed nuts", category: "fats", calories: 607, protein: 20, carbs: 21, fat: 54, cost: "$$" },
  { name: "Almond butter", category: "fats", calories: 614, protein: 21, carbs: 19, fat: 56, cost: "$$$" },
  { name: "Walnuts", category: "fats", calories: 654, protein: 15, carbs: 14, fat: 65, cost: "$$$" },
  { name: "Chia seeds", category: "fats", calories: 486, protein: 17, carbs: 42, fat: 31, cost: "$$$" },
  { name: "Broccoli", category: "vegetables", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, cost: "$" },
  { name: "Spinach", category: "vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, cost: "$" },
  { name: "Carrot", category: "vegetables", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, cost: "$" },
  { name: "Cucumber", category: "vegetables", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, cost: "$" },
  { name: "Bell pepper", category: "vegetables", calories: 31, protein: 1, carbs: 6, fat: 0.3, cost: "$$" },
  { name: "Tomato", category: "vegetables", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, cost: "$$" },
  { name: "Mushroom", category: "vegetables", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, cost: "$$" },
  { name: "Asparagus", category: "vegetables", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, cost: "$$$" },
  { name: "Kale", category: "vegetables", calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, cost: "$$$" },
  { name: "Brussels sprouts", category: "vegetables", calories: 43, protein: 3.4, carbs: 9, fat: 0.3, cost: "$$$" },
  { name: "Zucchini", category: "vegetables", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, cost: "$$$" },
]

const budgetPresets: {
  id: "low" | "medium" | "high"
  label: string
  weeklyCost: string
  items: string[]
}[] = [
  {
    id: "low",
    label: "Low Budget 💰",
    weeklyCost: "~$50/week",
    items: [
      "Chicken breast",
      "Eggs",
      "Canned tuna",
      "Greek yogurt",
      "White rice",
      "Oats",
      "Sweet potato",
      "Banana",
      "Olive oil",
      "Peanut butter",
      "Broccoli",
      "Spinach",
      "Carrot",
      "Cucumber",
    ],
  },
  {
    id: "medium",
    label: "Medium Budget 💰💰",
    weeklyCost: "~$80/week",
    items: [
      "Chicken breast",
      "Salmon",
      "Eggs",
      "Ground beef",
      "Greek yogurt",
      "Brown rice",
      "Oats",
      "Sweet potato",
      "Quinoa",
      "Apple",
      "Avocado",
      "Olive oil",
      "Mixed nuts",
      "Broccoli",
      "Spinach",
      "Bell pepper",
      "Tomato",
      "Mushroom",
    ],
  },
  {
    id: "high",
    label: "High Budget 💰💰💰",
    weeklyCost: "~$120/week",
    items: [
      "Ribeye",
      "Salmon",
      "Shrimp",
      "Turkey breast",
      "Whey protein",
      "Quinoa",
      "Sweet potato",
      "Brown rice",
      "Granola",
      "Avocado",
      "Almond butter",
      "Walnuts",
      "Chia seeds",
      "Asparagus",
      "Kale",
      "Brussels sprouts",
      "Spinach",
      "Zucchini",
    ],
  },
]

const categoryTabs: { id: IngredientCategory; label: string }[] = [
  { id: "protein", label: "Protein" },
  { id: "carbs", label: "Carbs" },
  { id: "fats", label: "Fats" },
  { id: "vegetables", label: "Vegetables" },
]

const stepOrder = ["body", "activity", "goal", "diet", "ingredient-mode", "ingredients"] as const
type OnboardingStep = (typeof stepOrder)[number]

export function Onboarding() {
  const { setUserProfile, setCurrentStep, calculateMacros } = useMealStore()
  const [step, setStep] = useState<OnboardingStep>("body")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<ActivityLevel | null>(null)
  const [selectedDietType, setSelectedDietType] = useState<DietType | null>(null)
  const [ingredientMode, setIngredientMode] = useState<"recommend" | "custom" | null>(null)
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<"low" | "medium" | "high" | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<IngredientCategory>("protein")
  const [fetchingIngredient, setFetchingIngredient] = useState(false)

  const currentStepIndex = stepOrder.indexOf(step)
  const totalSteps = stepOrder.length

  const selectedCatalogItems = useMemo(
    () => ingredientCatalog.filter((item) => selectedIngredients.includes(item.name)),
    [selectedIngredients]
  )

  const ingredientCounts = selectedCatalogItems.reduce(
    (acc, item) => {
      acc[item.category] += 1
      return acc
    },
    { protein: 0, carbs: 0, fats: 0, vegetables: 0 } as Record<IngredientCategory, number>
  )

  const isIngredientSelectionValid = ingredientCounts.protein >= 2 && ingredientCounts.carbs >= 1 && ingredientCounts.fats >= 1

  const sustainabilityLabel = useMemo(() => {
    if (!selectedCatalogItems.length) return "Moderate ⚠"
    const scoreMap: Record<CostTier, number> = { "$": 1, "$$": 2, "$$$": 3 }
    const avgScore =
      selectedCatalogItems.reduce((sum, item) => sum + scoreMap[item.cost], 0) / selectedCatalogItems.length

    if (avgScore <= 1.5) return "Sustainable ✓"
    if (avgScore <= 2.2) return "Moderate ⚠"
    return "Expensive ✗"
  }, [selectedCatalogItems])

  const macroPreview = useMemo(() => {
    if (!weight || !bodyFat || !selectedGoal || !selectedActivityLevel || !selectedDietType) return null
    const weightKg = unit === "lbs" ? parseFloat(weight) * 0.453592 : parseFloat(weight)
    if (!Number.isFinite(weightKg)) return null
    return calculateMacros(weightKg, parseFloat(bodyFat), selectedGoal, selectedActivityLevel, selectedDietType)
  }, [weight, bodyFat, unit, selectedGoal, selectedActivityLevel, selectedDietType, calculateMacros])

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const sanitized = value.replace(/[^0-9.]/g, "")
    const parts = sanitized.split(".")
    if (parts.length > 2) return
    setter(sanitized)
  }

  const getWeightInKg = (value: string): number => {
    const num = parseFloat(value)
    return unit === "lbs" ? num * 0.453592 : num
  }

  const moveToNextStep = () => {
    const next = stepOrder[currentStepIndex + 1]
    if (next) setStep(next)
  }

  const moveToPreviousStep = () => {
    const previous = stepOrder[currentStepIndex - 1]
    if (previous) setStep(previous)
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const chooseBudgetPreset = (presetId: "low" | "medium" | "high", presetItems: string[]) => {
    setSelectedBudgetPreset(presetId)
    setSelectedIngredients(presetItems)
  }

  const addIngredientFromSearch = (name: string) => {
    if (!selectedIngredients.includes(name)) {
      setSelectedIngredients((prev) => [...prev, name])
    }
    setSearch("")
  }

  const fetchIngredientViaClaude = async () => {
    const query = search.trim()
    if (!query) return
    setFetchingIngredient(true)
    try {
      const response = await fetch("/api/claude-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient: query }),
      })
      if (!response.ok) throw new Error("Request failed")
      const data = (await response.json()) as Partial<IngredientOption>
      if (!data.name || !data.category || !data.cost) throw new Error("Invalid response")

      ingredientCatalog.push({
        name: data.name,
        category: data.category,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        cost: data.cost,
      })
      addIngredientFromSearch(data.name)
    } catch {
      window.alert("Ingredient not found. Claude lookup endpoint is unavailable.")
    } finally {
      setFetchingIngredient(false)
    }
  }

  const handleComplete = () => {
    if (
      !selectedGoal ||
      !selectedActivityLevel ||
      !selectedDietType ||
      !weight ||
      !bodyFat ||
      !muscleMass ||
      !isIngredientSelectionValid
    ) {
      return
    }

    const { calories, macros } = calculateMacros(
      getWeightInKg(weight),
      parseFloat(bodyFat),
      selectedGoal,
      selectedActivityLevel,
      selectedDietType
    )

    const now = new Date().toISOString()
    setUserProfile({
      weight: parseFloat(weight),
      bodyFat: parseFloat(bodyFat),
      muscleMass: parseFloat(muscleMass),
      unit,
      activityLevel: selectedActivityLevel,
      goal: selectedGoal,
      dietType: selectedDietType,
      mealsPerDay: 3,
      selectedIngredients,
      dailyCalories: calories,
      macros,
      createdAt: now,
      lastUpdatedAt: now,
    })

    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NutriPlan</h1>
          <p className="mt-2 text-muted-foreground">Your personalized nutrition journey starts here</p>
        </div>

        {step === "body" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Scale className="h-5 w-5 text-primary" />
                Enter Your Body Stats
              </CardTitle>
              <CardDescription>
                We&apos;ll use your InBody results to calculate your ideal nutrition plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    unit === "kg"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("lbs")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    unit === "lbs"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  lbs
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight ({unit})</Label>
                <Input
                  id="weight"
                  type="text"
                  inputMode="decimal"
                  placeholder={unit === "kg" ? "e.g., 80" : "e.g., 175"}
                  value={weight}
                  onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 18"
                  value={bodyFat}
                  onChange={(e) => handleNumericInput(e.target.value, setBodyFat)}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="muscleMass">Muscle Mass ({unit})</Label>
                <Input
                  id="muscleMass"
                  type="text"
                  inputMode="decimal"
                  placeholder={unit === "kg" ? "e.g., 65" : "e.g., 140"}
                  value={muscleMass}
                  onChange={(e) => handleNumericInput(e.target.value, setMuscleMass)}
                  className="h-12 text-lg"
                />
              </div>
              <Button
                className="h-12 w-full text-lg font-semibold"
                onClick={moveToNextStep}
                disabled={!weight || !bodyFat || !muscleMass}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "activity" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <HeartPulse className="h-5 w-5 text-primary" />
                Select Activity Level
              </CardTitle>
              <CardDescription>Choose the level that best represents your weekly routine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedActivityLevel(level.id)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                    selectedActivityLevel === level.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-foreground">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">x {level.multiplier}</div>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="h-12 flex-1" onClick={moveToPreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button className="h-12 flex-1" onClick={moveToNextStep} disabled={!selectedActivityLevel}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "goal" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Target className="h-5 w-5 text-primary" />
                Select Your Goal
              </CardTitle>
              <CardDescription>
                Choose what you want to achieve with your nutrition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    selectedGoal === goal.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      selectedGoal === goal.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {goal.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{goal.label}</div>
                    <div className="text-sm text-muted-foreground">{goal.description}</div>
                  </div>
                </button>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="h-12 flex-1"
                  onClick={moveToPreviousStep}
                >
                  Back
                </Button>
                <Button
                  className="h-12 flex-1 text-lg font-semibold"
                  onClick={moveToNextStep}
                  disabled={!selectedGoal}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "diet" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Salad className="h-5 w-5 text-primary" />
                Choose Diet Style
              </CardTitle>
              <CardDescription>Macros preview updates in real-time as you select a diet style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dietTypes.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => setSelectedDietType(diet.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selectedDietType === diet.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">{diet.label}</div>
                  <div className="text-sm text-muted-foreground">{diet.description}</div>
                </button>
              ))}
              {macroPreview && (
                <div className="rounded-xl bg-secondary p-4">
                  <div className="text-sm font-medium text-foreground">Macro Preview</div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><div className="font-bold">{macroPreview.calories}</div><div className="text-muted-foreground">kcal</div></div>
                    <div><div className="font-bold">{macroPreview.macros.protein}g</div><div className="text-muted-foreground">Protein</div></div>
                    <div><div className="font-bold">{macroPreview.macros.carbs}g</div><div className="text-muted-foreground">Carbs</div></div>
                    <div><div className="font-bold">{macroPreview.macros.fat}g</div><div className="text-muted-foreground">Fat</div></div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="h-12 flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button className="h-12 flex-1" onClick={moveToNextStep} disabled={!selectedDietType}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "ingredient-mode" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Ingredient Selection</CardTitle>
              <CardDescription>Choose how you want to build your ingredient list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setIngredientMode("recommend")}
                className={`w-full rounded-xl border-2 p-4 text-left ${
                  ingredientMode === "recommend" ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <div className="font-semibold">Recommend for me</div>
                <div className="text-sm text-muted-foreground">Use budget presets</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIngredientMode("custom")
                  setSelectedBudgetPreset(null)
                }}
                className={`w-full rounded-xl border-2 p-4 text-left ${
                  ingredientMode === "custom" ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <div className="font-semibold">I&apos;ll choose myself</div>
                <div className="text-sm text-muted-foreground">Pick ingredients by category</div>
              </button>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="h-12 flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button className="h-12 flex-1" onClick={moveToNextStep} disabled={!ingredientMode}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "ingredients" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Select Ingredients</CardTitle>
              <CardDescription>
                Pick at least 2 proteins, 1 carb, and 1 fat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredientMode === "recommend" && (
                <div className="space-y-3">
                  {budgetPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => chooseBudgetPreset(preset.id, preset.items)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        selectedBudgetPreset === preset.id
                          ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-sm text-muted-foreground">{preset.weeklyCost}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{preset.items.join(", ")}</div>
                    </button>
                  ))}
                </div>
              )}

              {ingredientMode === "custom" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search ingredients..."
                      className="pl-9"
                    />
                  </div>
                  {search.trim() && (
                    <div className="space-y-2 rounded-xl border border-border p-2">
                      {ingredientCatalog
                        .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
                        .slice(0, 6)
                        .map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => addIngredientFromSearch(item.name)}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                          >
                            {item.name}
                          </button>
                        ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={fetchIngredientViaClaude}
                        disabled={fetchingIngredient}
                      >
                        {fetchingIngredient ? "Looking up..." : "Not found? Fetch via Claude API"}
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {categoryTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id)}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          activeCategory === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {ingredientCatalog
                      .filter((item) => item.category === activeCategory)
                      .map((item) => {
                        const selected = selectedIngredients.includes(item.name)
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleIngredient(item.name)}
                            className={`w-full rounded-xl border p-3 text-left ${
                              selected ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{item.name}</div>
                              <span className="rounded-md bg-secondary px-2 py-1 text-xs">{item.cost}</span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.calories} kcal | P {item.protein} / C {item.carbs} / F {item.fat} per 100g
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </>
              )}

              <div className="rounded-xl bg-secondary p-3 text-sm">
                <div className="font-medium">Sustainability Score: {sustainabilityLabel}</div>
                <div className="text-muted-foreground">
                  Selected: Protein {ingredientCounts.protein}, Carbs {ingredientCounts.carbs}, Fats {ingredientCounts.fats}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="h-12 flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button
                  className="h-12 flex-1"
                  onClick={handleComplete}
                  disabled={!isIngredientSelectionValid}
                >
                  Generate Meal Plan ({selectedIngredients.length} ingredients selected)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-center gap-2">
          {stepOrder.map((item) => (
            <div key={item} className={`h-2 w-8 rounded-full ${step === item ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
