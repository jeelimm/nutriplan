"use client"

import { useEffect, useMemo, useState } from "react"
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
  type RecipeUnitSystem,
  type Sex,
  type WeightLossPace,
} from "@/lib/meal-store"
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
  { id: "lose-fat", label: "Lose Fat", description: "Slightly fewer calories, with protein to help you stay full", icon: <TrendingUp className="h-6 w-6" /> },
  { id: "gain-muscle", label: "Gain Muscle", description: "A bit more fuel to support strength work and recovery", icon: <Dumbbell className="h-6 w-6" /> },
  { id: "recomposition", label: "Lean Recomposition", description: "Steady eating with room to train and trim fat over time", icon: <RefreshCw className="h-6 w-6" /> },
]

const activityLevels: { id: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { id: "sedentary", label: "Sedentary", description: "Mostly desk or home, little planned exercise", multiplier: 1.2 },
  { id: "light", label: "Light activity", description: "Easy walks, light workouts, or on-your-feet days", multiplier: 1.375 },
  { id: "moderate", label: "Moderate", description: "Regular workouts or active job, most weeks", multiplier: 1.55 },
  { id: "very-active", label: "Very active", description: "Hard training or very physical days most of the week", multiplier: 1.725 },
]

const dietTypes: { id: DietType; label: string; description: string }[] = [
  { id: "keto", label: "Keto", description: "Fewer carbs, more fat—if that’s how you like to eat" },
  { id: "high-protein", label: "High Protein", description: "Extra protein in each day’s mix" },
  { id: "balanced", label: "Balanced", description: "Carbs, protein, and fat in an even split" },
  { id: "intermittent-fasting", label: "Intermittent Fasting", description: "Fewer, larger meals in a set eating window" },
]

const weightLossPaceOptions: {
  id: WeightLossPace
  emoji: string
  label: string
  kgPerWeek: number
  deficitKcal: number
  hint: string
}[] = [
  {
    id: "steady",
    emoji: "🐢",
    label: "Steady",
    kgPerWeek: 0.5,
    deficitKcal: 550,
    hint: "Easier to maintain, minimal muscle loss",
  },
  {
    id: "moderate",
    emoji: "🚶",
    label: "Moderate",
    kgPerWeek: 0.75,
    deficitKcal: 820,
    hint: "Balanced pace, good for most people",
  },
  {
    id: "aggressive",
    emoji: "🏃",
    label: "Aggressive",
    kgPerWeek: 1,
    deficitKcal: 1100,
    hint: "Faster results, requires more discipline",
  },
]

type IngredientCategory = "protein" | "carbs" | "fats" | "vegetables"
type CostTier = "$" | "$$" | "$$$"
type BodyType = "lean" | "average" | "athletic" | "heavy-set"

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
    label: "Budget-friendly",
    weeklyCost: "~$50/week · simple staples",
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
    label: "Balanced spend",
    weeklyCost: "~$80/week · mix of basics and upgrades",
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
    label: "More variety",
    weeklyCost: "~$120/week · wider ingredient range",
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

const stepOrder = ["body", "activity", "goal", "target-weight", "cuisine", "diet", "ingredient-mode", "ingredients"] as const

type OnboardingStep = (typeof stepOrder)[number] | "quick-estimate"
const ONBOARDING_DRAFT_KEY = "nutriplan-onboarding-draft-v1"

const round1 = (n: number): string => String(Number(n.toFixed(1)))

function convertWeightValue(value: string, fromUnit: "kg" | "lbs", toUnit: "kg" | "lbs"): string {
  if (fromUnit === toUnit || !value.trim()) return value
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const converted = fromUnit === "kg" ? n * 2.20462 : n * 0.453592
  return round1(converted)
}

export function Onboarding() {
  const { setUserProfile, setCurrentStep, calculateMacros } = useMealStore()
  const [step, setStep] = useState<OnboardingStep>("body")
  const [sex, setSex] = useState<Sex>("male")
  const [unitSystem, setUnitSystem] = useState<RecipeUnitSystem>("metric")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [quickHeight, setQuickHeight] = useState("")
  const [quickAge, setQuickAge] = useState("")
  const [quickBodyType, setQuickBodyType] = useState<BodyType | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<ActivityLevel | null>(null)
  const [selectedDietType, setSelectedDietType] = useState<DietType | null>(null)
  const [targetWeightInput, setTargetWeightInput] = useState("")
  const [targetWeightSkipped, setTargetWeightSkipped] = useState(false)
  const [weightLossPace, setWeightLossPace] = useState<WeightLossPace>("moderate")
  const [selectedCuisines, setSelectedCuisines] = useState<CuisinePreference[]>([])
  const [ingredientMode, setIngredientMode] = useState<"recommend" | "custom" | null>(null)
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<"low" | "medium" | "high" | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<IngredientCategory>("protein")
  const [fetchingIngredient, setFetchingIngredient] = useState(false)

  const setUnitWithConversion = (nextUnit: "kg" | "lbs") => {
    setUnit((prevUnit) => {
      if (prevUnit === nextUnit) return prevUnit
      setWeight((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setMuscleMass((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setTargetWeightInput((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      return nextUnit
    })
  }

  const currentStepIndex = stepOrder.indexOf(step as (typeof stepOrder)[number])
  const displayStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex
  const totalSteps = stepOrder.length

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Partial<{
        step: OnboardingStep
        sex: Sex
        unitSystem: RecipeUnitSystem
        unit: "kg" | "lbs"
        weight: string
        bodyFat: string
        muscleMass: string
        quickHeight: string
        quickAge: string
        quickBodyType: BodyType | null
        selectedGoal: Goal | null
        selectedActivityLevel: ActivityLevel | null
        selectedDietType: DietType | null
        targetWeightInput: string
        targetWeightSkipped: boolean
        weightLossPace: WeightLossPace
        selectedCuisines: CuisinePreference[]
        ingredientMode: "recommend" | "custom" | null
        selectedBudgetPreset: "low" | "medium" | "high" | null
        selectedIngredients: string[]
        search: string
        activeCategory: IngredientCategory
      }>
      if (draft.step) setStep(draft.step)
      if (draft.sex === "male" || draft.sex === "female") setSex(draft.sex)
      if (draft.unitSystem === "metric" || draft.unitSystem === "imperial") setUnitSystem(draft.unitSystem)
      if (draft.unit === "kg" || draft.unit === "lbs") setUnit(draft.unit)
      if (typeof draft.weight === "string") setWeight(draft.weight)
      if (typeof draft.bodyFat === "string") setBodyFat(draft.bodyFat)
      if (typeof draft.muscleMass === "string") setMuscleMass(draft.muscleMass)
      if (typeof draft.quickHeight === "string") setQuickHeight(draft.quickHeight)
      if (typeof draft.quickAge === "string") setQuickAge(draft.quickAge)
      if (draft.quickBodyType === "lean" || draft.quickBodyType === "average" || draft.quickBodyType === "athletic" || draft.quickBodyType === "heavy-set") {
        setQuickBodyType(draft.quickBodyType)
      }
      if (draft.selectedGoal === "lose-fat" || draft.selectedGoal === "gain-muscle" || draft.selectedGoal === "recomposition") {
        setSelectedGoal(draft.selectedGoal)
      }
      if (draft.selectedActivityLevel === "sedentary" || draft.selectedActivityLevel === "light" || draft.selectedActivityLevel === "moderate" || draft.selectedActivityLevel === "very-active") {
        setSelectedActivityLevel(draft.selectedActivityLevel)
      }
      if (draft.selectedDietType === "keto" || draft.selectedDietType === "high-protein" || draft.selectedDietType === "balanced" || draft.selectedDietType === "intermittent-fasting") {
        setSelectedDietType(draft.selectedDietType)
      }
      if (typeof draft.targetWeightInput === "string") setTargetWeightInput(draft.targetWeightInput)
      if (typeof draft.targetWeightSkipped === "boolean") setTargetWeightSkipped(draft.targetWeightSkipped)
      if (draft.weightLossPace === "steady" || draft.weightLossPace === "moderate" || draft.weightLossPace === "aggressive") {
        setWeightLossPace(draft.weightLossPace)
      }
      if (Array.isArray(draft.selectedCuisines)) setSelectedCuisines(draft.selectedCuisines.filter(Boolean) as CuisinePreference[])
      if (draft.ingredientMode === "recommend" || draft.ingredientMode === "custom" || draft.ingredientMode === null) {
        setIngredientMode(draft.ingredientMode)
      }
      if (draft.selectedBudgetPreset === "low" || draft.selectedBudgetPreset === "medium" || draft.selectedBudgetPreset === "high" || draft.selectedBudgetPreset === null) {
        setSelectedBudgetPreset(draft.selectedBudgetPreset)
      }
      if (Array.isArray(draft.selectedIngredients)) setSelectedIngredients(draft.selectedIngredients.filter((x): x is string => typeof x === "string"))
      if (typeof draft.search === "string") setSearch(draft.search)
      if (draft.activeCategory === "protein" || draft.activeCategory === "carbs" || draft.activeCategory === "fats" || draft.activeCategory === "vegetables") {
        setActiveCategory(draft.activeCategory)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const draft = {
        step,
        sex,
        unitSystem,
        unit,
        weight,
        bodyFat,
        muscleMass,
        quickHeight,
        quickAge,
        quickBodyType,
        selectedGoal,
        selectedActivityLevel,
        selectedDietType,
        targetWeightInput,
        targetWeightSkipped,
        weightLossPace,
        selectedCuisines,
        ingredientMode,
        selectedBudgetPreset,
        selectedIngredients,
        search,
        activeCategory,
      }
      window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft))
    } catch {}
  }, [
    step,
    sex,
    unitSystem,
    unit,
    weight,
    bodyFat,
    muscleMass,
    quickHeight,
    quickAge,
    quickBodyType,
    selectedGoal,
    selectedActivityLevel,
    selectedDietType,
    targetWeightInput,
    targetWeightSkipped,
    weightLossPace,
    selectedCuisines,
    ingredientMode,
    selectedBudgetPreset,
    selectedIngredients,
    search,
    activeCategory,
  ])

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
  const ingredientMinimumMessage = "Select at least 2 proteins, 1 carb, and 1 fat to continue"

  const sustainabilityLabel = useMemo(() => {
    if (!selectedCatalogItems.length) return "Pick ingredients to see a cost mix"
    const scoreMap: Record<CostTier, number> = { "$": 1, "$$": 2, "$$$": 3 }
    const avgScore =
      selectedCatalogItems.reduce((sum, item) => sum + scoreMap[item.cost], 0) / selectedCatalogItems.length

    if (avgScore <= 1.5) return "Mostly budget-friendly"
    if (avgScore <= 2.2) return "Mix of price points"
    return "Includes pricier picks"
  }, [selectedCatalogItems])

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

  const macroPreview = useMemo(() => {
    if (!weight || !bodyFat || !selectedGoal || !selectedActivityLevel || !selectedDietType) return null
    const weightKg = unit === "lbs" ? parseFloat(weight) * 0.453592 : parseFloat(weight)
    if (!Number.isFinite(weightKg)) return null
    const tw =
      !targetWeightSkipped && targetWeightInput.trim()
        ? getWeightInKg(targetWeightInput)
        : undefined
    const twArg = tw != null && Number.isFinite(tw) ? tw : null
    return useMealStore.getState().calculateMacros(
      weightKg,
      parseFloat(bodyFat),
      selectedGoal,
      selectedActivityLevel,
      selectedDietType,
      sex,
      twArg,
      selectedGoal === "gain-muscle" ? null : weightLossPace
    )
  }, [
    weight,
    bodyFat,
    unit,
    selectedGoal,
    selectedActivityLevel,
    selectedDietType,
    sex,
    targetWeightSkipped,
    targetWeightInput,
    weightLossPace,
  ])

  const handleDietTypeSelect = (newDietType: DietType) => {
    console.log("Diet type changed to:", newDietType)
    console.log("Recalculating macros...")
    setSelectedDietType(newDietType)
  }

  const quickEstimateMap: Record<Sex, Record<BodyType, { bodyFatRange: [number, number]; muscleRatio: number }>> = {
    male: {
      lean: { bodyFatRange: [10, 14], muscleRatio: 0.45 },
      average: { bodyFatRange: [18, 22], muscleRatio: 0.4 },
      athletic: { bodyFatRange: [12, 16], muscleRatio: 0.48 },
      "heavy-set": { bodyFatRange: [25, 30], muscleRatio: 0.35 },
    },
    female: {
      lean: { bodyFatRange: [16, 20], muscleRatio: 0.35 },
      average: { bodyFatRange: [25, 30], muscleRatio: 0.3 },
      athletic: { bodyFatRange: [18, 22], muscleRatio: 0.38 },
      "heavy-set": { bodyFatRange: [32, 38], muscleRatio: 0.28 },
    },
  }

  const applyQuickEstimate = () => {
    if (!weight || !quickHeight || !quickAge || !quickBodyType) return
    const weightValue = parseFloat(weight)
    if (!Number.isFinite(weightValue)) return

    const estimate = quickEstimateMap[sex][quickBodyType]
    const estimatedBodyFat = (estimate.bodyFatRange[0] + estimate.bodyFatRange[1]) / 2
    const estimatedMuscleMass = weightValue * estimate.muscleRatio

    setBodyFat(String(Number(estimatedBodyFat.toFixed(1))))
    setMuscleMass(String(Number(estimatedMuscleMass.toFixed(1))))
    setStep("activity")
  }

  const moveToNextStep = () => {
    const next = stepOrder[displayStepIndex + 1]
    if (next) setStep(next)
  }

  const moveToPreviousStep = () => {
    const previous = stepOrder[displayStepIndex - 1]
    if (previous) setStep(previous)
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const toggleCuisine = (id: CuisinePreference) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length < 2) return [...prev, id]
      return [prev[1], id]
    })
  }

  const targetWeightStepValid =
    targetWeightSkipped ||
    (() => {
      const target = parseFloat(targetWeightInput)
      if (!Number.isFinite(target) || target <= 0) return false
      const current = parseFloat(weight)
      if (!Number.isFinite(current) || current <= 0 || !selectedGoal) return true
      if (selectedGoal === "lose-fat") return target < current
      if (selectedGoal === "gain-muscle") return target > current
      return true
    })()

  const targetWeightGoalWarning = (() => {
    const target = parseFloat(targetWeightInput)
    const current = parseFloat(weight)
    if (!Number.isFinite(target) || !Number.isFinite(current) || !selectedGoal) return null
    if (selectedGoal === "lose-fat" && target >= current) {
      return `Your target weight should be lower than your current weight (${current}${unit}) for a Lose Fat goal.`
    }
    if (selectedGoal === "gain-muscle" && target <= current) {
      return "Your target weight should be higher than your current weight for a Gain Muscle goal."
    }
    return null
  })()

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
      window.alert("We couldn’t look up that ingredient right now. Try another name or pick from the list.")
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

    const targetKg =
      !targetWeightSkipped && targetWeightInput.trim()
        ? getWeightInKg(targetWeightInput)
        : undefined

    const { calories, macros } = calculateMacros(
      getWeightInKg(weight),
      parseFloat(bodyFat),
      selectedGoal,
      selectedActivityLevel,
      selectedDietType,
      sex,
      targetKg != null && Number.isFinite(targetKg) ? targetKg : null,
      selectedGoal === "gain-muscle" ? null : weightLossPace
    )

    const now = new Date().toISOString()
    setUserProfile({
      sex,
      unitSystem,
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
      ...(targetWeightSkipped || !targetWeightInput.trim()
        ? {}
        : { targetWeight: parseFloat(targetWeightInput) }),
      ...(selectedGoal !== "gain-muscle" ? { weightLossPace } : {}),
      cuisinePreference: selectedCuisines,
      createdAt: now,
      lastUpdatedAt: now,
    })

    setCurrentStep(1)
    try {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    } catch {}
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background p-4 md:p-8" suppressHydrationWarning>
      <div className="mx-auto max-w-lg min-w-0" suppressHydrationWarning>
        <div
          className="mb-4 flex items-center justify-between text-sm text-muted-foreground"
          suppressHydrationWarning
        >
          <span>Step {displayStepIndex + 1} of {totalSteps}</span>
          <span>{Math.round(((displayStepIndex + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((displayStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NutriPlan</h1>
          <p className="mt-2 text-muted-foreground" suppressHydrationWarning>
            A plan you can actually follow—adjust when life gets in the way
          </p>
        </div>

        {step === "body" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl" suppressHydrationWarning>
                <Scale className="h-5 w-5 text-primary" />
                Your body stats
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                Add weight, body fat, and muscle mass from a scan or your best estimate—we&apos;ll set daily targets from there
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSex("male")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      sex === "male" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex("female")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      sex === "female" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitWithConversion("kg")}
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
                    onClick={() => setUnitWithConversion("lbs")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      unit === "lbs"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recipe units</Label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitSystem("metric")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      unitSystem === "metric"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Metric (°C, g, ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem("imperial")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      unitSystem === "imperial"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Imperial (°F, oz, cup)
                  </button>
                </div>
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
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep("quick-estimate")}>
                Don&apos;t have InBody data? Use quick estimate instead
              </Button>
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

        {step === "quick-estimate" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Scale className="h-5 w-5 text-primary" />
                Quick body estimate
              </CardTitle>
              <CardDescription>
                No InBody scan needed — just a few basics and we&apos;ll estimate the rest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSex("male")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      sex === "male" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex("female")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      sex === "female" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnitWithConversion("kg")}
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
                  onClick={() => setUnitWithConversion("lbs")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    unit === "lbs"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  lbs
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quickWeight">Weight ({unit})</Label>
                  <Input
                    id="quickWeight"
                    type="text"
                    inputMode="decimal"
                    placeholder={unit === "kg" ? "e.g., 80" : "e.g., 175"}
                    value={weight}
                    onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quickHeight">Height ({unit === "kg" ? "cm" : "in"})</Label>
                  <Input
                    id="quickHeight"
                    type="text"
                    inputMode="decimal"
                    placeholder={unit === "kg" ? "e.g., 175" : "e.g., 69"}
                    value={quickHeight}
                    onChange={(e) => handleNumericInput(e.target.value, setQuickHeight)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAge">Age</Label>
                <Input
                  id="quickAge"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 30"
                  value={quickAge}
                  onChange={(e) => handleNumericInput(e.target.value, setQuickAge)}
                />
              </div>
              <div className="space-y-2">
                <Label>Body type</Label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { id: "lean", label: "Lean", description: "Naturally slim, low body fat" },
                    { id: "average", label: "Average", description: "Typical build, some body fat" },
                    { id: "athletic", label: "Athletic", description: "Visibly muscular, active lifestyle" },
                    { id: "heavy-set", label: "Heavy-set", description: "Carrying extra weight currently" },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQuickBodyType(item.id)}
                      className={`rounded-lg border p-3 text-left ${quickBodyType === item.id ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                These are estimates — update anytime with real InBody data for better accuracy
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={() => setStep("body")}>
                  Back
                </Button>
                <Button
                  className="h-12 min-h-[44px] flex-1"
                  onClick={applyQuickEstimate}
                  disabled={!weight || !quickHeight || !quickAge || !quickBodyType}
                >
                  Apply estimate &amp; continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "activity" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl" suppressHydrationWarning>
                <HeartPulse className="h-5 w-5 text-primary" />
                How active is your week?
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                Pick what&apos;s closest—regular weeks vary, and you can update this anytime
              </CardDescription>
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
                  <span className="whitespace-nowrap font-medium text-primary">&times;{level.multiplier}</span>
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={moveToPreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button className="h-12 min-h-[44px] flex-1" onClick={moveToNextStep} disabled={!selectedActivityLevel}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "goal" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl" suppressHydrationWarning>
                <Target className="h-5 w-5 text-primary" />
                What are you aiming for?
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                No wrong answer—this just nudges calories and macros in the right direction
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

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-12 min-h-[44px] flex-1"
                  onClick={moveToPreviousStep}
                >
                  Back
                </Button>
                <Button
                  className="h-12 min-h-[44px] flex-1 text-lg font-semibold"
                  onClick={moveToNextStep}
                  disabled={!selectedGoal}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "target-weight" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl" suppressHydrationWarning>
                Set your target weight (optional)
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                We&apos;ll estimate how long your plan will take to get you there
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-weight">Target weight ({unit})</Label>
                <Input
                  id="target-weight"
                  inputMode="decimal"
                  placeholder={unit === "kg" ? "e.g. 72" : "e.g. 160"}
                  value={targetWeightInput}
                  onChange={(e) => {
                    setTargetWeightSkipped(false)
                    handleNumericInput(e.target.value, setTargetWeightInput)
                  }}
                  className="h-12 text-lg"
                />
              </div>
              {targetWeightGoalWarning && (
                <p className="text-sm text-amber-600 dark:text-amber-500">{targetWeightGoalWarning}</p>
              )}

              {selectedGoal === "gain-muscle" && (
                <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                  We&apos;ll add ~300 kcal to support muscle growth
                </p>
              )}

              {(selectedGoal === "lose-fat" || selectedGoal === "recomposition") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Weight loss pace</p>
                  <div className="space-y-2">
                    {weightLossPaceOptions.map((opt) => {
                      const weekly =
                        unit === "kg"
                          ? `~${opt.kgPerWeek}kg/week`
                          : `~${(opt.kgPerWeek * 2.20462).toFixed(1)}lb/week`
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setWeightLossPace(opt.id)}
                          className={`min-h-[44px] w-full rounded-xl border-2 p-3 text-left text-sm transition-all ${
                            weightLossPace === opt.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="break-words font-semibold text-foreground">
                            {opt.emoji} {opt.label} — {weekly} (deficit ~{opt.deficitKcal} kcal/day)
                          </div>
                          <div className="mt-1 break-words text-muted-foreground">{opt.hint}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {macroPreview?.calorieFloorApplied &&
                (selectedGoal === "lose-fat" || selectedGoal === "recomposition") && (
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    We&apos;ve adjusted your target to stay above the minimum safe intake.
                  </p>
                )}

              <div className="flex flex-col gap-3 pt-2">
                <Button variant="outline" className="h-12 min-h-[44px] w-full" onClick={moveToPreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  className="h-12 min-h-[44px] w-full whitespace-normal break-words py-3 leading-snug"
                  onClick={() => {
                    setTargetWeightSkipped(true)
                    setTargetWeightInput("")
                    moveToNextStep()
                  }}
                >
                  I&apos;ll focus on habits, not numbers
                </Button>
                <Button className="h-12 min-h-[44px] w-full" onClick={moveToNextStep} disabled={!targetWeightStepValid}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "cuisine" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl" suppressHydrationWarning>
                What kind of food do you usually eat?
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                We&apos;ll suggest ingredients you can actually find and afford
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-center text-xs text-muted-foreground">Pick one or two</p>
              <div className="space-y-2">
                {CUISINE_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCuisine(c.id)}
                    className={`min-h-[44px] w-full rounded-xl border-2 p-4 text-left transition-all ${
                      selectedCuisines.includes(c.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="break-words font-semibold text-foreground">{c.title}</div>
                    <div className="break-words text-sm text-muted-foreground">{c.hint}</div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={moveToPreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button className="h-12 min-h-[44px] flex-1" onClick={moveToNextStep} disabled={selectedCuisines.length < 1}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "diet" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl" suppressHydrationWarning>
                <Salad className="h-5 w-5 text-primary" />
                How do you like to eat?
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                Keep it simple: tap a style and see a rough calorie and macro preview below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dietTypes.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => handleDietTypeSelect(diet.id)}
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
                  <div className="text-sm font-medium text-foreground" suppressHydrationWarning>
                    Rough preview
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><div className="font-bold">{macroPreview.calories}</div><div className="text-muted-foreground">kcal</div></div>
                    <div><div className="font-bold">{macroPreview.macros.protein}g</div><div className="text-muted-foreground">Protein</div></div>
                    <div><div className="font-bold">{macroPreview.macros.carbs}g</div><div className="text-muted-foreground">Carbs</div></div>
                    <div><div className="font-bold">{macroPreview.macros.fat}g</div><div className="text-muted-foreground">Fat</div></div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button className="h-12 min-h-[44px] flex-1" onClick={moveToNextStep} disabled={!selectedDietType}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "ingredient-mode" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl" suppressHydrationWarning>
                Build your food list
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                Use a starter list by budget, or choose ingredients yourself—both are fine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <button
                type="button"
                onClick={() => setIngredientMode("recommend")}
                className={`w-full rounded-xl border-2 p-4 text-left ${
                  ingredientMode === "recommend" ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <div className="font-semibold" suppressHydrationWarning>
                  Suggest a list for me
                </div>
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                  Start from a budget-friendly, balanced, or wider-cost preset
                </div>
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
                <div className="font-semibold" suppressHydrationWarning>
                  I&apos;ll pick my own
                </div>
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                  Browse by protein, carbs, fats, and vegetables
                </div>
              </button>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button className="h-12 min-h-[44px] flex-1" onClick={moveToNextStep} disabled={!ingredientMode}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "ingredients" && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl" suppressHydrationWarning>
                Choose ingredients
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                For a workable plan: at least 2 proteins, 1 carb, and 1 fat (vegetables are a nice add-on)
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
                      <div className="font-semibold" suppressHydrationWarning>{preset.label}</div>
                      <div className="text-sm text-muted-foreground" suppressHydrationWarning>{preset.weeklyCost}</div>
                      <div className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>{preset.items.join(", ")}</div>
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
                        className="h-auto min-h-11 w-full whitespace-normal break-words py-3 leading-snug"
                        onClick={fetchIngredientViaClaude}
                        disabled={fetchingIngredient}
                        suppressHydrationWarning
                      >
                        {fetchingIngredient ? "Looking that up…" : "Can’t find it? Look up with AI"}
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {categoryTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id)}
                        className={`min-h-11 rounded-lg px-3 py-2 text-sm ${
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
                            className={`min-h-[44px] w-full rounded-xl border p-3 text-left ${
                              selected ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <div className="min-w-0 break-words font-medium">{item.name}</div>
                              <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs">{item.cost}</span>
                            </div>
                            <div className="mt-1 break-words text-xs text-muted-foreground">
                              {item.calories} kcal | P {item.protein} / C {item.carbs} / F {item.fat} per 100g
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </>
              )}

              <div className="rounded-xl bg-secondary p-3 text-sm">
                <div className="font-medium" suppressHydrationWarning>
                  Typical cost mix: {sustainabilityLabel}
                </div>
                <div className="text-muted-foreground" suppressHydrationWarning>
                  So far: Protein {ingredientCounts.protein}, Carbs {ingredientCounts.carbs}, Fats {ingredientCounts.fats}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={ingredientCounts.protein >= 2 ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}>
                    Proteins: {ingredientCounts.protein} {ingredientCounts.protein >= 2 ? "✓" : "⚠️"}
                  </span>
                  <span className={ingredientCounts.carbs >= 1 ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}>
                    Carbs: {ingredientCounts.carbs} {ingredientCounts.carbs >= 1 ? "✓" : "⚠️"}
                  </span>
                  <span className={ingredientCounts.fats >= 1 ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}>
                    Fats: {ingredientCounts.fats} {ingredientCounts.fats >= 1 ? "✓" : "⚠️"}
                  </span>
                </div>
              </div>
              {!isIngredientSelectionValid && (
                <p className="text-sm text-amber-600 dark:text-amber-500">{ingredientMinimumMessage}</p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={moveToPreviousStep}>
                  Back
                </Button>
                <Button
                  className="h-auto min-h-[44px] flex-1 whitespace-normal break-words py-3 leading-snug"
                  onClick={handleComplete}
                  disabled={!isIngredientSelectionValid}
                  suppressHydrationWarning
                >
                  Create my 7-day plan ({selectedIngredients.length} ingredients)
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
