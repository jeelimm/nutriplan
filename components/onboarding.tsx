"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  type RecipeUnitSystem,
  type Sex,
  type WeightLossPace,
} from "@/lib/meal-store"
import {
  TrendingUp,
  Dumbbell,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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
type BodyField = "weight" | "bodyFat" | "muscleMass"

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
const ONBOARDING_DRAFT_KEY = "nutriplan-onboarding-draft-v3"

const round1 = (n: number): string => String(Number(n.toFixed(1)))

function convertWeightValue(value: string, fromUnit: "kg" | "lbs", toUnit: "kg" | "lbs"): string {
  if (fromUnit === toUnit || !value.trim()) return value
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const converted = fromUnit === "kg" ? n * 2.20462 : n * 0.453592
  return round1(converted)
}

function convertHeightValue(value: string, fromUnit: "cm" | "in", toUnit: "cm" | "in"): string {
  if (fromUnit === toUnit || !value.trim()) return value
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const converted = fromUnit === "cm" ? n / 2.54 : n * 2.54
  return round1(converted)
}

const onboardingUi = {
  mainCard:
    "overflow-hidden rounded-[28px] border border-[#d8ccb9] dark:border-border bg-[#fffaf4] dark:bg-card shadow-[0_22px_50px_-30px_rgba(40,49,43,0.28)]",
  stepChip:
    "inline-flex w-fit items-center rounded-full bg-[#f1dfd1] dark:bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5b41] dark:text-muted-foreground",
  sectionSurface:
    "rounded-[22px] border border-[#e5d7c7] dark:border-border bg-[#f8f2ea] dark:bg-secondary/60 p-3.5 sm:p-4",
  sectionHeadingRow:
    "flex items-center gap-2",
  sectionAccentDot:
    "h-2.5 w-2.5 rounded-full bg-[#b77749] dark:bg-muted-foreground",
  sectionHeading:
    "text-sm font-semibold uppercase tracking-[0.14em] text-[#5e665f] dark:text-muted-foreground",
  sectionDescription:
    "mt-2 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground",
  segmentedGroup:
    "grid grid-cols-2 gap-1 rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#efe6d8] dark:bg-secondary p-1",
  inputNote:
    "text-xs leading-[1.35] text-[#7a8079] dark:text-muted-foreground",
  inputValidation:
    "text-xs leading-[1.35] text-[#8b5a47] dark:text-destructive/90",
  secondaryActionRow:
    "flex min-h-11 w-full items-center justify-between rounded-2xl border border-[#d8ccb9] dark:border-border bg-[#fff7ee] dark:bg-secondary/60 px-4 py-3 text-left text-sm font-medium text-[#5e665f] dark:text-muted-foreground transition-colors hover:bg-[#f8efe4] dark:hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20",
  primaryCtaBase:
    "min-h-12 w-full rounded-2xl text-base font-semibold transition-[background-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  progressShell:
    "mt-5 flex justify-center gap-1.5",
  progressTrack:
    "flex items-center gap-1.5 rounded-full border border-[#e2d6c5] dark:border-border bg-[#f7f1e8] dark:bg-secondary/60 px-2.5 py-1.5",
  boundedInputBase:
    "h-12 rounded-2xl border border-[#C8BDB0] dark:border-border bg-white dark:bg-card px-4 py-2.5 text-base text-[#1A1A1A] dark:text-foreground placeholder:text-[#8C8279] dark:placeholder:text-muted-foreground transition-[border-color,background-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:border-[#4A7C59] dark:focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[#4A7C59]/20 dark:focus-visible:ring-primary/20",
} as const

function OnboardingMainCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn(onboardingUi.mainCard, className)}>{children}</Card>
}

function OnboardingStepChip({ children }: { children: ReactNode }) {
  return <div className={onboardingUi.stepChip}>{children}</div>
}

function OnboardingSectionHeadingRow({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <>
      <div className={onboardingUi.sectionHeadingRow}>
        <span className={onboardingUi.sectionAccentDot} />
        <h3 className={onboardingUi.sectionHeading}>{title}</h3>
      </div>
      {description ? <p className={onboardingUi.sectionDescription}>{description}</p> : null}
    </>
  )
}

function OnboardingSegmentedGroup({ children }: { children: ReactNode }) {
  return <div className={onboardingUi.segmentedGroup}>{children}</div>
}

function OnboardingFieldNote({
  error,
  children,
}: {
  error?: boolean
  children: ReactNode
}) {
  return <p className={error ? onboardingUi.inputValidation : onboardingUi.inputNote}>{children}</p>
}

function OnboardingBoundedInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(onboardingUi.boundedInputBase, className)} />
}

function OnboardingSecondaryActionRow({
  children,
  onClick,
  className,
  icon,
  iconPosition = "end",
}: {
  children: ReactNode
  onClick: () => void
  className?: string
  icon?: ReactNode
  iconPosition?: "start" | "end"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(onboardingUi.secondaryActionRow, className)}
    >
      {iconPosition === "start" ? (
        <>
          {icon ?? <ChevronLeft className="h-4 w-4 shrink-0 text-[#7a5b41] dark:text-muted-foreground" />}
          <span className="pl-1 leading-6">{children}</span>
        </>
      ) : (
        <>
          <span className="pr-4 leading-6">{children}</span>
          {icon ?? <ChevronRight className="h-4 w-4 shrink-0 text-[#7a5b41] dark:text-muted-foreground" />}
        </>
      )}
    </button>
  )
}

function OnboardingPrimaryCta({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(onboardingUi.primaryCtaBase, className)}
    >
      {children}
    </Button>
  )
}

function OnboardingProgressIndicator({
  activeStep,
}: {
  activeStep: (typeof stepOrder)[number] | "quick-estimate"
}) {
  const resolvedStep = activeStep === "quick-estimate" ? "body" : activeStep

  return (
    <div className={onboardingUi.progressShell}>
      <div className={onboardingUi.progressTrack}>
        {stepOrder.map((item) => (
          <div
            key={item}
            className={cn(
              "h-1.5 rounded-full transition-all",
              resolvedStep === item
                ? "w-7 bg-[#5f7654] dark:bg-primary"
                : "w-4 bg-[#dccfbe] dark:bg-secondary"
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function Onboarding() {
  const { setUserProfile, setCurrentStep, calculateMacros } = useMealStore()
  const [step, setStep] = useState<OnboardingStep>("quick-estimate")
  const [firstStep, setFirstStep] = useState<"quick-estimate" | "body">("quick-estimate")
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
  const [focusedBodyField, setFocusedBodyField] = useState<BodyField | null>(null)
  const [touchedBodyFields, setTouchedBodyFields] = useState<Record<BodyField, boolean>>({
    weight: false,
    bodyFat: false,
    muscleMass: false,
  })
  const [showBodyValidation, setShowBodyValidation] = useState(false)
  const [isAdvancingBody, setIsAdvancingBody] = useState(false)
  const [entryChosen, setEntryChosen] = useState(false)

  const setUnitWithConversion = (nextUnit: "kg" | "lbs") => {
    setUnit((prevUnit) => {
      if (prevUnit === nextUnit) return prevUnit
      setWeight((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setMuscleMass((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setTargetWeightInput((prev) => convertWeightValue(prev, prevUnit, nextUnit))
      setQuickHeight((prev) => convertHeightValue(prev, prevUnit === "kg" ? "cm" : "in", nextUnit === "kg" ? "cm" : "in"))
      return nextUnit
    })
  }

  const setMeasurementSystem = (nextSystem: RecipeUnitSystem) => {
    setUnitSystem(nextSystem)
    setUnitWithConversion(nextSystem === "metric" ? "kg" : "lbs")
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
      if (draft.step) setStep(draft.step === "body" || draft.step === "quick-estimate" || stepOrder.includes(draft.step as (typeof stepOrder)[number]) ? draft.step : "quick-estimate")
      if (draft.sex === "male" || draft.sex === "female") setSex(draft.sex)
      if (draft.unit === "kg" || draft.unit === "lbs") {
        setUnit(draft.unit)
        setUnitSystem(draft.unit === "lbs" ? "imperial" : "metric")
      } else if (draft.unitSystem === "metric" || draft.unitSystem === "imperial") {
        setUnitSystem(draft.unitSystem)
        setUnit(draft.unitSystem === "imperial" ? "lbs" : "kg")
      }
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
    const heightCm = quickHeight
      ? (unit === "lbs" ? parseFloat(quickHeight) * 2.54 : parseFloat(quickHeight))
      : null
    const age = quickAge ? parseFloat(quickAge) : null
    return useMealStore.getState().calculateMacros(
      weightKg,
      parseFloat(bodyFat),
      selectedGoal,
      selectedActivityLevel,
      selectedDietType,
      sex,
      twArg,
      selectedGoal === "lose-fat" ? weightLossPace : null,
      heightCm && Number.isFinite(heightCm) ? heightCm : null,
      age && Number.isFinite(age) ? age : null
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
    quickHeight,
    quickAge,
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
    setFirstStep("quick-estimate")
    setStep("activity")
  }

  const moveToNextStep = () => {
    const next = stepOrder[displayStepIndex + 1]
    if (next) setStep(next)
  }

  const moveToPreviousStep = () => {
    if (displayStepIndex === 1) {
      setStep(firstStep)
      return
    }
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
      if (selectedGoal === "lose-fat" || selectedGoal === "recomposition") return target < current
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
    if (selectedGoal === "recomposition" && target >= current) {
      return "For recomposition, use a lower scale target or skip this step and focus on body composition instead."
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

  const isLoseFatGoal = selectedGoal === "lose-fat"
  const isGainMuscleGoal = selectedGoal === "gain-muscle"
  const isRecompositionGoal = selectedGoal === "recomposition"

  const stepFourSupportingCopy =
    isLoseFatGoal
      ? "If you want, add a goal weight and choose a pace. We’ll use it to estimate a rough timeline, or you can skip this and focus on habits first."
      : isGainMuscleGoal
        ? "If you have a goal weight in mind, add it here as a reference point. You can also skip this and focus on steady progress first."
        : isRecompositionGoal
          ? "If you want a loose scale reference, add it here. We’ll use a gentle recomposition approach, or you can skip this and focus on consistency first."
          : "Add a target if you want a reference point for your plan, or skip this and keep things simple."

  const stepFourTargetDescription =
    isLoseFatGoal
      ? "Add a number if you want a rough timeline. If not, use the skip option below and focus on the routine."
      : isGainMuscleGoal
        ? "Add a number if you have a goal in mind. If not, use the skip option below and keep the focus on steady progress."
        : isRecompositionGoal
          ? "Add a number if you want a loose scale reference. If not, use the skip option below and focus on consistency."
          : "Add a target if you want one, or use the skip option below."

  const stepFourTargetHelper =
    isLoseFatGoal
      ? "Use the skip option below if you’d rather not set a scale target yet."
      : isGainMuscleGoal
        ? "Use the skip option below if you’d rather focus on consistent training and meals first."
        : isRecompositionGoal
          ? "Use the skip option below if you’d rather focus on body composition, not scale changes."
          : "Use the skip option below if you’d rather keep this flexible."

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

    const heightCm = quickHeight
      ? (unit === "lbs" ? parseFloat(quickHeight) * 2.54 : parseFloat(quickHeight))
      : null
    const age = quickAge ? parseFloat(quickAge) : null

    const { calories, macros } = calculateMacros(
      getWeightInKg(weight),
      parseFloat(bodyFat),
      selectedGoal,
      selectedActivityLevel,
      selectedDietType,
      sex,
      targetKg != null && Number.isFinite(targetKg) ? targetKg : null,
      selectedGoal === "lose-fat" ? weightLossPace : null,
      heightCm && Number.isFinite(heightCm) ? heightCm : null,
      age && Number.isFinite(age) ? age : null
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
      ...(selectedGoal === "lose-fat" ? { weightLossPace } : {}),
      cuisinePreference: selectedCuisines,
      ...(heightCm && Number.isFinite(heightCm) ? { height: heightCm } : {}),
      ...(age && Number.isFinite(age) ? { age } : {}),
      createdAt: now,
      lastUpdatedAt: now,
    })

    setCurrentStep(1)
    try {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    } catch {}
  }

  const optionButtonClass = (active: boolean) =>
    cn(
      "min-h-11 rounded-[16px] border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#5f7654] dark:bg-primary text-[#fffaf4] dark:text-primary-foreground shadow-[0_10px_18px_-16px_rgba(40,70,47,0.5)]"
        : "border-transparent bg-transparent text-[#28312b] dark:text-foreground hover:bg-[#fffaf4]/90 dark:hover:bg-secondary/60"
    )

  const activityOptionButtonClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#edf3e8] dark:bg-primary/15 shadow-[0_14px_28px_-24px_rgba(40,70,47,0.42)]"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card hover:border-[#bfae95] dark:hover:border-primary/40 hover:bg-white dark:hover:bg-secondary"
    )

  const goalOptionButtonClass = (active: boolean) =>
    cn(
      "group flex w-full items-start gap-4 rounded-[20px] border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_30px_-24px_rgba(40,70,47,0.48)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_10px_22px_-26px_rgba(40,49,43,0.28)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_14px_28px_-24px_rgba(40,49,43,0.32)]"
    )

  const goalIconTileClass = (active: boolean) =>
    cn(
      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-[background-color,border-color,color,box-shadow] duration-150",
      active
        ? "border-[#526847] dark:border-primary bg-[#5f7654] dark:bg-primary text-[#fffaf4] dark:text-primary-foreground shadow-[0_12px_20px_-18px_rgba(40,70,47,0.48)]"
        : "border-[#ddd1c1] dark:border-border bg-[#f7efe5] dark:bg-secondary text-[#7a5b41] dark:text-muted-foreground group-hover:border-[#cfbfaa] dark:group-hover:border-primary/40 group-hover:bg-[#fbf3e8] dark:group-hover:bg-secondary/80"
    )

  const paceOptionButtonClass = (active: boolean) =>
    cn(
      "group w-full rounded-[20px] border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_30px_-24px_rgba(40,70,47,0.48)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_10px_22px_-26px_rgba(40,49,43,0.28)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_14px_28px_-24px_rgba(40,49,43,0.32)]"
    )

  const cuisineOptionButtonClass = (active: boolean) =>
    cn(
      "group flex w-full items-start justify-between gap-2.5 rounded-[20px] border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_28px_-24px_rgba(40,70,47,0.5)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_12px_22px_-26px_rgba(40,49,43,0.28)]"
    )

  const cuisineSelectionBadgeClass = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center justify-center border transition-[background-color,border-color,color,box-shadow] duration-150",
      active
        ? "min-w-10 rounded-full border-[#5f7654] dark:border-primary bg-[#5f7654] dark:bg-primary px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[#fffaf4] dark:text-primary-foreground shadow-[0_10px_20px_-18px_rgba(40,70,47,0.48)]"
        : "h-8 w-8 rounded-full border-[#d9ccb9] dark:border-border bg-[#fcf6ee] dark:bg-secondary text-[15px] font-semibold text-[#7a5b41] dark:text-muted-foreground"
    )

  const dietOptionButtonClass = (active: boolean) =>
    cn(
      "group w-full rounded-[20px] border px-4 py-3.25 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_28px_-24px_rgba(40,70,47,0.5)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_12px_24px_-26px_rgba(40,49,43,0.3)]"
    )

  const ingredientPresetButtonClass = (active: boolean) =>
    cn(
      "group w-full rounded-[20px] border px-4 py-3.25 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_28px_-24px_rgba(40,70,47,0.5)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_12px_24px_-26px_rgba(40,49,43,0.3)]"
    )

  const ingredientCategoryTabClass = (active: boolean) =>
    cn(
      "min-h-11 rounded-[16px] border px-3.5 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#5f7654] dark:bg-primary text-[#fffaf4] dark:text-primary-foreground shadow-[0_10px_18px_-16px_rgba(40,70,47,0.5)]"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card text-[#5e665f] dark:text-muted-foreground hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary"
    )

  const ingredientCatalogButtonClass = (active: boolean) =>
    cn(
      "w-full rounded-[20px] border px-4 py-2.75 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
      active
        ? "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 ring-1 ring-[#d8e4d1] dark:ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_14px_24px_-24px_rgba(40,70,47,0.44)]"
        : "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_6px_14px_-28px_rgba(40,49,43,0.2)] hover:border-[#c3b198] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary"
    )

  const ingredientRequirementPillClass = (met: boolean) =>
    cn(
      "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
      met
        ? "border-[#d8e4d1] dark:border-primary/30 bg-[#eef4e8] dark:bg-primary/15 text-[#526847] dark:text-primary"
        : "border-[#ead2c1] dark:border-border bg-[#fdf1e8] dark:bg-secondary text-[#8b5a47] dark:text-muted-foreground"
    )

  const ingredientPresetStatusBadgeClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em]",
      active
        ? "border-[#cfe0c9] dark:border-primary/30 bg-[#edf3e8] dark:bg-primary/15 text-[#526847] dark:text-primary"
        : "border-[#d9ccb9] dark:border-border bg-[#f7efe5] dark:bg-secondary text-[#7a5b41] dark:text-muted-foreground"
    )

  const ingredientPriceBadgeClass = (cost: CostTier, selected: boolean) =>
    cn(
      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] transition-[border-color,background-color,color,box-shadow] duration-150",
      cost === "$"
        ? selected
          ? "border-[#cad8c3] dark:border-primary/30 bg-[#eef4e8] dark:bg-primary/15 text-[#526847] dark:text-primary"
          : "border-[#dbe6d5] dark:border-border bg-[#f4f8f1] dark:bg-secondary text-[#617055] dark:text-muted-foreground"
        : cost === "$$"
          ? selected
            ? "border-[#ddd0bf] dark:border-border bg-[#f8efe4] dark:bg-secondary text-[#7a5b41] dark:text-muted-foreground"
            : "border-[#e6dacb] dark:border-border bg-[#fbf4ec] dark:bg-secondary text-[#816650] dark:text-muted-foreground"
          : selected
            ? "border-[#decab8] dark:border-border bg-[#f5ebe1] dark:bg-secondary text-[#8b5f45] dark:text-muted-foreground"
            : "border-[#eadfd2] dark:border-border bg-[#fbf6f0] dark:bg-secondary text-[#8f7056] dark:text-muted-foreground"
    )

  const getBodyFieldError = (field: BodyField): string | null => {
    const rawValue =
      field === "weight" ? weight
      : field === "bodyFat" ? bodyFat
      : muscleMass
    const trimmed = rawValue.trim()
    const shouldValidate = showBodyValidation || touchedBodyFields[field]

    if (!shouldValidate) return null
    if (!trimmed) {
      return "Enter this so we can set a starting point."
    }

    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) {
      return "Use a number greater than 0."
    }

    if (field === "bodyFat" && (value < 1 || value > 75)) {
      return "Use a body fat estimate between 1 and 75."
    }

    return null
  }

  const weightError = getBodyFieldError("weight")
  const bodyFatError = getBodyFieldError("bodyFat")
  const muscleMassError = getBodyFieldError("muscleMass")
  const canAdvanceBodyStep =
    !weightError &&
    !bodyFatError &&
    !muscleMassError &&
    weight.trim().length > 0 &&
    bodyFat.trim().length > 0 &&
    muscleMass.trim().length > 0

  const getBodyFieldClassName = (field: BodyField, value: string) => {
    const hasValue = value.trim().length > 0
    const isFocused = focusedBodyField === field
    const hasError = Boolean(getBodyFieldError(field))

    return cn(
      onboardingUi.boundedInputBase,
      hasValue
        ? "border-[#C8BDB0] dark:border-border border-b-[#C8BDB0] dark:border-b-border bg-white dark:bg-card shadow-[0_5px_12px_-14px_rgba(40,49,43,0.25)]"
        : "border-[#C8BDB0] dark:border-border border-b-[#C8BDB0] dark:border-b-border bg-white dark:bg-card shadow-none",
      isFocused && !hasError && "border-[#4A7C59] dark:border-primary border-b-[#4A7C59] dark:border-b-primary bg-white dark:bg-card ring-2 ring-[#4A7C59]/20 dark:ring-primary/20 shadow-[0_12px_24px_-18px_rgba(74,124,89,0.35)]",
      hasError && "border-[#b77749] border-b-[#b77749] bg-[#fff6f0] dark:bg-[#2a1a14] text-[#7a4d2a] dark:text-destructive-foreground ring-2 ring-[#b77749]/12 shadow-none"
    )
  }

  const getBodyLabelClassName = (field: BodyField) => {
    const hasError = Boolean(getBodyFieldError(field))
    const isFocused = focusedBodyField === field

    return cn(
      "transition-colors",
      hasError
        ? "text-[#8b5a47] dark:text-destructive/90"
        : isFocused
          ? "text-[#4e5b52] dark:text-primary/80"
          : "text-[#6f756e] dark:text-muted-foreground"
    )
  }

  const handleBodyFieldBlur = (field: BodyField) => {
    setFocusedBodyField((prev) => (prev === field ? null : prev))
    setTouchedBodyFields((prev) => ({ ...prev, [field]: true }))
  }

  const handleBodyContinue = () => {
    if (isAdvancingBody) return

    setShowBodyValidation(true)
    setTouchedBodyFields({
      weight: true,
      bodyFat: true,
      muscleMass: true,
    })

    if (!canAdvanceBodyStep) return

    setIsAdvancingBody(true)
    setFirstStep("body")

    window.setTimeout(() => {
      setIsAdvancingBody(false)
      moveToNextStep()
    }, 140)
  }

  const handleStartOver = () => {
    try { window.localStorage.removeItem(ONBOARDING_DRAFT_KEY) } catch {}
    setStep("quick-estimate")
    setFirstStep("quick-estimate")
    setSex("male")
    setUnitSystem("metric")
    setUnit("kg")
    setWeight("")
    setBodyFat("")
    setMuscleMass("")
    setQuickHeight("")
    setQuickAge("")
    setQuickBodyType(null)
    setSelectedGoal(null)
    setSelectedActivityLevel(null)
    setSelectedDietType(null)
    setTargetWeightInput("")
    setTargetWeightSkipped(false)
    setWeightLossPace("moderate")
    setSelectedCuisines([])
    setIngredientMode(null)
    setSelectedBudgetPreset(null)
    setSelectedIngredients([])
    setSearch("")
    setActiveCategory("protein")
    setShowBodyValidation(false)
    setTouchedBodyFields({ weight: false, bodyFat: false, muscleMass: false })
    setEntryChosen(false)
  }

  return (
    <div className={cn("app-shell px-4 py-6 md:px-8 md:py-9", step === "body" || step === "quick-estimate" || step === "activity" || step === "goal" || step === "target-weight" || step === "cuisine" || step === "diet" || step === "ingredient-mode" || step === "ingredients" ? "bg-[#f5f1ea] dark:bg-background" : "bg-background")} suppressHydrationWarning>
      <div className="page-column" suppressHydrationWarning>
        {(step === "body" || (step !== "quick-estimate" && displayStepIndex > 0)) && (
          <OnboardingSecondaryActionRow
            onClick={step === "body" ? () => setStep("quick-estimate") : moveToPreviousStep}
            iconPosition="start"
            className="justify-start mb-3"
          >
            {step === "body"
              ? "Back to setup options"
              : step === "activity"
                ? (firstStep === "quick-estimate" ? "Back to basics setup" : "Back to body stats")
                : step === "goal"
                  ? "Back to activity"
                  : step === "target-weight"
                    ? "Back to goal"
                    : step === "cuisine"
                      ? "Back to target weight"
                      : step === "diet"
                        ? "Back to cuisines"
                        : step === "ingredient-mode"
                          ? "Back to diet style"
                          : "Back to ingredient setup"}
          </OnboardingSecondaryActionRow>
        )}

        {step === "body" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 1 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                Use detailed body stats
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Best if you have body fat or scan-based measurements. These give us a more precise calorie and protein target.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label>Gender</Label>
                  <OnboardingSegmentedGroup>
                    <button
                      type="button"
                      onClick={() => setSex("male")}
                      className={optionButtonClass(sex === "male")}
                      aria-pressed={sex === "male"}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex("female")}
                      className={optionButtonClass(sex === "female")}
                      aria-pressed={sex === "female"}
                    >
                      Female
                    </button>
                  </OnboardingSegmentedGroup>
                </div>
                <div className="space-y-2.5">
                  <Label>Measurement system</Label>
                  <OnboardingSegmentedGroup>
                    <button
                      type="button"
                      onClick={() => setMeasurementSystem("metric")}
                      className={optionButtonClass(unitSystem === "metric")}
                      aria-pressed={unitSystem === "metric"}
                    >
                      Metric
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeasurementSystem("imperial")}
                      className={optionButtonClass(unitSystem === "imperial")}
                      aria-pressed={unitSystem === "imperial"}
                    >
                      Imperial
                    </button>
                  </OnboardingSegmentedGroup>
                  <OnboardingFieldNote>This sets both your body inputs and recipe measurements.</OnboardingFieldNote>
                </div>
              </div>

              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Your body stats"
                  description="Enter your numbers from an InBody scan, smart scale, or your best estimate."
                />

                <div className="mt-3.5 grid gap-3 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className={getBodyLabelClassName("weight")}>Weight ({unit})</Label>
                    <OnboardingBoundedInput
                      id="weight"
                      type="text"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "e.g., 80" : "e.g., 175"}
                      value={weight}
                      onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                      onFocus={() => setFocusedBodyField("weight")}
                      onBlur={() => handleBodyFieldBlur("weight")}
                      aria-invalid={Boolean(weightError)}
                      className={getBodyFieldClassName("weight", weight)}
                    />
                    <OnboardingFieldNote error={Boolean(weightError)}>
                      {weightError ?? "Your current weight or best recent average."}
                    </OnboardingFieldNote>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bodyFat" className={getBodyLabelClassName("bodyFat")}>Body Fat (%)</Label>
                    <OnboardingBoundedInput
                      id="bodyFat"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g., 18"
                      value={bodyFat}
                      onChange={(e) => handleNumericInput(e.target.value, setBodyFat)}
                      onFocus={() => setFocusedBodyField("bodyFat")}
                      onBlur={() => handleBodyFieldBlur("bodyFat")}
                      aria-invalid={Boolean(bodyFatError)}
                      className={getBodyFieldClassName("bodyFat", bodyFat)}
                    />
                    <OnboardingFieldNote error={Boolean(bodyFatError)}>
                      {bodyFatError ?? "From an InBody scan, smart scale, or your best estimate."}
                    </OnboardingFieldNote>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="muscleMass" className={getBodyLabelClassName("muscleMass")}>Muscle Mass ({unit})</Label>
                    <OnboardingBoundedInput
                      id="muscleMass"
                      type="text"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "e.g., 65" : "e.g., 140"}
                      value={muscleMass}
                      onChange={(e) => handleNumericInput(e.target.value, setMuscleMass)}
                      onFocus={() => setFocusedBodyField("muscleMass")}
                      onBlur={() => handleBodyFieldBlur("muscleMass")}
                      aria-invalid={Boolean(muscleMassError)}
                      className={getBodyFieldClassName("muscleMass", muscleMass)}
                    />
                    <OnboardingFieldNote error={Boolean(muscleMassError)}>
                      {muscleMassError ?? "From an InBody scan or smart scale. If you don&apos;t have it, the basics setup estimates this for you."}
                    </OnboardingFieldNote>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    isAdvancingBody
                      ? "bg-primary/80 text-primary-foreground cursor-wait"
                      : canAdvanceBodyStep
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={handleBodyContinue}
                  disabled={!canAdvanceBodyStep || isAdvancingBody}
                >
                  {isAdvancingBody ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4 text-[#fffaf4]" />
                      Setting up your targets...
                    </span>
                  ) : (
                    "Set my targets"
                  )}
                </OnboardingPrimaryCta>

                <p className="text-center text-[11px] leading-[1.45] text-[#7a8079] dark:text-muted-foreground">
                  Use your best estimate for now. You can update these details later.
                </p>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "quick-estimate" && !entryChosen && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
              <CardTitle className="text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                How do you want to start?
              </CardTitle>
              <CardDescription className="mt-2 max-w-sm text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Choose how you&apos;d like to set up your calorie targets.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-5 pb-6 sm:px-7">
              <button
                type="button"
                onClick={() => setEntryChosen(true)}
                className={cn(
                  "group w-full rounded-[20px] border px-5 py-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
                  "border-[#5f7654] dark:border-primary bg-[#eef4e8] dark:bg-primary/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_30px_-24px_rgba(40,70,47,0.48)] hover:border-[#526847] dark:hover:border-primary hover:bg-[#f2f6ee] dark:hover:bg-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#243128] dark:text-foreground">Quick Start</div>
                    <div className="mt-0.5 text-sm leading-5 text-[#4f5e56] dark:text-muted-foreground">Estimate your body type</div>
                  </div>
                  <span className={cn(onboardingUi.stepChip, "shrink-0 mt-0.5")}>2 min</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setFirstStep("body"); setStep("body") }}
                className={cn(
                  "group w-full rounded-[20px] border px-5 py-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
                  "border-[#d8ccb9] dark:border-border bg-[#fffdf9] dark:bg-card shadow-[0_10px_22px_-26px_rgba(40,49,43,0.28)] hover:border-[#bfae95] dark:hover:border-primary/40 hover:bg-[#fffaf4] dark:hover:bg-secondary hover:shadow-[0_14px_28px_-24px_rgba(40,49,43,0.32)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#28312b] dark:text-foreground">Precise Setup</div>
                    <div className="mt-0.5 text-sm leading-5 text-[#5e665f] dark:text-muted-foreground">Enter exact measurements</div>
                  </div>
                  <span className={cn(onboardingUi.stepChip, "shrink-0 mt-0.5")}>5 min</span>
                </div>
              </button>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "quick-estimate" && entryChosen && (
          <OnboardingSecondaryActionRow
            onClick={() => setEntryChosen(false)}
            iconPosition="start"
            className="justify-start mb-3"
          >
            Back to setup options
          </OnboardingSecondaryActionRow>
        )}

        {step === "quick-estimate" && entryChosen && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 1 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                Start with the basics
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                A faster setup using height, weight, age, and body type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Basic details"
                  description="Enter your best estimates — you can update these anytime."
                />

                <div className="mt-3.5 grid gap-4 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label>Sex</Label>
                      <OnboardingSegmentedGroup>
                        <button
                          type="button"
                          onClick={() => setSex("male")}
                          className={optionButtonClass(sex === "male")}
                          aria-pressed={sex === "male"}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setSex("female")}
                          className={optionButtonClass(sex === "female")}
                          aria-pressed={sex === "female"}
                        >
                          Female
                        </button>
                      </OnboardingSegmentedGroup>
                    </div>
                    <div className="space-y-2.5">
                      <Label>Measurement system</Label>
                      <OnboardingSegmentedGroup>
                        <button
                          type="button"
                          onClick={() => setMeasurementSystem("metric")}
                          className={optionButtonClass(unitSystem === "metric")}
                          aria-pressed={unitSystem === "metric"}
                        >
                          Metric
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeasurementSystem("imperial")}
                          className={optionButtonClass(unitSystem === "imperial")}
                          aria-pressed={unitSystem === "imperial"}
                        >
                          Imperial
                        </button>
                      </OnboardingSegmentedGroup>
                      <OnboardingFieldNote>This switches both your estimate inputs and recipe measurements.</OnboardingFieldNote>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="quickWeight">Weight ({unit})</Label>
                      <OnboardingBoundedInput
                        id="quickWeight"
                        type="text"
                        inputMode="decimal"
                        placeholder={unit === "kg" ? "e.g., 80" : "e.g., 175"}
                        value={weight}
                        onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quickHeight">Height ({unit === "kg" ? "cm" : "in"})</Label>
                      <OnboardingBoundedInput
                        id="quickHeight"
                        type="text"
                        inputMode="decimal"
                        placeholder={unit === "kg" ? "e.g., 175" : "e.g., 69"}
                        value={quickHeight}
                        onChange={(e) => handleNumericInput(e.target.value, setQuickHeight)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quickAge">Age</Label>
                    <OnboardingBoundedInput
                      id="quickAge"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g., 30"
                      value={quickAge}
                      onChange={(e) => handleNumericInput(e.target.value, setQuickAge)}
                    />
                  </div>
                </div>
              </div>

              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Body type"
                  description="Pick the closest match. It doesn&apos;t need to be perfect."
                />

                <div className="mt-3.5 grid gap-2 border-t border-[#eadfce] dark:border-border pt-3">
                  {([
                    { id: "lean", label: "Slim", description: "Naturally lean build, lower body fat" },
                    { id: "average", label: "Average", description: "Typical build, moderate body fat" },
                    { id: "athletic", label: "Athletic", description: "Visibly muscular, active lifestyle" },
                    { id: "heavy-set", label: "Heavy", description: "Carrying extra weight currently" },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQuickBodyType(item.id)}
                      aria-pressed={quickBodyType === item.id}
                      className={dietOptionButtonClass(quickBodyType === item.id)}
                    >
                      <div
                        className={cn(
                          "text-[15px] font-semibold leading-5 transition-colors",
                          quickBodyType === item.id ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                        )}
                      >
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-sm leading-5 transition-colors",
                          quickBodyType === item.id ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    weight && quickHeight && quickAge && quickBodyType
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={applyQuickEstimate}
                  disabled={!weight || !quickHeight || !quickAge || !quickBodyType}
                >
                  Set my targets
                </OnboardingPrimaryCta>

                <p className="text-center text-[11px] leading-[1.45] text-[#7a8079] dark:text-muted-foreground">
                  You can refine this later with detailed stats.
                </p>
              </div>

              <div className="border-t border-[#eadfce] dark:border-border pt-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Use detailed body stats</p>
                <p className="mt-1 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground">Best if you have body fat or scan-based measurements.</p>
                <button
                  type="button"
                  onClick={() => setStep("body")}
                  className="mt-2 text-sm font-medium text-[#7a5b41] dark:text-muted-foreground underline underline-offset-2 hover:text-[#5e3e27] dark:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:rounded"
                >
                  I have detailed body stats (InBody, smart scale, etc.)
                </button>
              </div>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:rounded"
                >
                  Start over
                </button>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "activity" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 2 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                How active is your week?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Pick the option that feels closest to a normal week. This helps us turn your body stats into a realistic calorie starting point, and you can update it later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Weekly activity"
                  description="Choose the option that sounds most like a regular week."
                />

                <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                  {activityLevels.map((level) => {
                    const isActive = selectedActivityLevel === level.id

                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setSelectedActivityLevel(level.id)}
                        aria-pressed={isActive}
                        className={activityOptionButtonClass(isActive)}
                      >
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#28312b] dark:text-foreground">{level.label}</div>
                          <div className="mt-1 text-sm leading-5 text-[#5e665f] dark:text-muted-foreground">{level.description}</div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em]",
                            isActive
                              ? "border-[#5f7654] dark:border-primary bg-[#5f7654] dark:bg-primary text-[#fffaf4] dark:text-primary-foreground"
                              : "border-[#d9ccb9] dark:border-border bg-[#f7efe5] dark:bg-secondary text-[#7a5b41] dark:text-muted-foreground"
                          )}
                        >
                          x{level.multiplier}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <OnboardingFieldNote>
                This helps us match your meal plan to how your week actually feels, not a perfect routine.
              </OnboardingFieldNote>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    selectedActivityLevel
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={!selectedActivityLevel}
                >
                  Continue with this activity
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "goal" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 3 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                What are you aiming for?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                No wrong answer here. This just nudges calories and macros in the right direction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Your goal"
                  description="Choose the direction you want this plan to support first."
                />

                <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                  {goals.map((goal) => {
                    const isActive = selectedGoal === goal.id

                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        aria-pressed={isActive}
                        className={goalOptionButtonClass(isActive)}
                      >
                        <div className={goalIconTileClass(isActive)}>{goal.icon}</div>
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "text-[15px] font-semibold transition-colors",
                              isActive ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                            )}
                          >
                            {goal.label}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-sm leading-5 transition-colors",
                              isActive ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                            )}
                          >
                            {goal.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <OnboardingFieldNote>
                You can fine-tune your target weight and pace on the next step.
              </OnboardingFieldNote>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    selectedGoal
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={!selectedGoal}
                >
                  Continue with this goal
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "target-weight" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 4 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                Set your target weight (optional)
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                {stepFourSupportingCopy}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Target weight"
                  description={stepFourTargetDescription}
                />

                <div className="mt-3.5 grid gap-3 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="target-weight">Target weight ({unit})</Label>
                    <OnboardingBoundedInput
                      id="target-weight"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "e.g. 72" : "e.g. 160"}
                      value={targetWeightInput}
                      onChange={(e) => {
                        setTargetWeightSkipped(false)
                        handleNumericInput(e.target.value, setTargetWeightInput)
                      }}
                    />
                    <OnboardingFieldNote error={Boolean(targetWeightGoalWarning)}>
                      {targetWeightGoalWarning ?? stepFourTargetHelper}
                    </OnboardingFieldNote>
                  </div>
                </div>
              </div>

              {isGainMuscleGoal && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="Muscle gain approach"
                    description="We&apos;ll use a steady calorie surplus of about 300 kcal to support muscle growth."
                  />
                </div>
              )}

              {isLoseFatGoal && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="Weight loss pace"
                    description="Pick the pace that feels realistic for your week."
                  />

                  <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
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
                          aria-pressed={weightLossPace === opt.id}
                          className={paceOptionButtonClass(weightLossPace === opt.id)}
                        >
                          <div
                            className={cn(
                              "break-words text-[15px] font-semibold transition-colors",
                              weightLossPace === opt.id ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                            )}
                          >
                            {opt.emoji} {opt.label} — {weekly} (deficit ~{opt.deficitKcal} kcal/day)
                          </div>
                          <div
                            className={cn(
                              "mt-1 break-words text-sm leading-5 transition-colors",
                              weightLossPace === opt.id ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                            )}
                          >
                            {opt.hint}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {isRecompositionGoal && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="Recomposition approach"
                    description="We&apos;ll use a gentle calorie deficit and adapt as your body changes over time."
                  />
                </div>
              )}

              {macroPreview?.calorieFloorApplied &&
                (isLoseFatGoal || isRecompositionGoal) && (
                  <OnboardingFieldNote error>
                    We&apos;ve adjusted your target to stay above the minimum safe intake.
                  </OnboardingFieldNote>
                )}

              <div className="space-y-2.5 pt-0.5">
                <OnboardingSecondaryActionRow
                  onClick={() => {
                    setTargetWeightSkipped(true)
                    setTargetWeightInput("")
                    moveToNextStep()
                  }}
                  className="whitespace-normal break-words py-3 leading-snug"
                >
                  I&apos;ll focus on habits, not numbers
                </OnboardingSecondaryActionRow>
                <OnboardingPrimaryCta
                  className={cn(
                    targetWeightStepValid
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={!targetWeightStepValid}
                >
                  Continue with this target
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "cuisine" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 5 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                What kind of food do you usually eat?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Pick one or two cuisines that feel closest to your real week. We&apos;ll lean toward foods you can actually find, afford, and want to keep eating.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Cuisine preferences"
                  description="Choose one or two styles so the plan feels familiar from the start."
                />

                <div className="mt-3.5 grid gap-2 border-t border-[#eadfce] dark:border-border pt-2.5">
                  {CUISINE_OPTIONS.map((c) => {
                    const isActive = selectedCuisines.includes(c.id)
                    const selectedCuisineIndex = selectedCuisines.indexOf(c.id)

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCuisine(c.id)}
                        aria-pressed={isActive}
                        className={cuisineOptionButtonClass(isActive)}
                      >
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "break-words text-[15px] font-semibold leading-5 transition-colors",
                              isActive ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                            )}
                          >
                            {c.title}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 break-words text-sm leading-5 transition-colors",
                              isActive ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                            )}
                          >
                            {c.hint}
                          </div>
                        </div>
                        <span className={cuisineSelectionBadgeClass(isActive)}>
                          {isActive ? `${selectedCuisineIndex + 1}/2` : "+"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <OnboardingFieldNote>
                {selectedCuisines.length === 0
                  ? "Pick at least one. You can choose up to two cuisines."
                  : selectedCuisines.length === 1
                    ? "You can add one more cuisine if your meals usually mix styles."
                    : "Two cuisines selected. We’ll balance your plan across both styles."}
              </OnboardingFieldNote>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    selectedCuisines.length >= 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={selectedCuisines.length < 1}
                >
                  {selectedCuisines.length > 1 ? "Continue with these cuisines" : "Continue with this cuisine"}
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "diet" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 6 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                How do you like to eat?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Keep it simple: choose the style that sounds easiest to stick with, and we&apos;ll show a rough macro starting point below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Diet style"
                  description="Pick the style that feels most realistic for your day-to-day meals."
                />

                <div className="mt-3.5 grid gap-2 border-t border-[#eadfce] dark:border-border pt-3">
                  {dietTypes.map((diet) => {
                    const isActive = selectedDietType === diet.id

                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => handleDietTypeSelect(diet.id)}
                        aria-pressed={isActive}
                        className={dietOptionButtonClass(isActive)}
                      >
                          <div
                            className={cn(
                              "text-[15px] font-semibold leading-5 transition-colors",
                              isActive ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                            )}
                          >
                            {diet.label}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 text-sm leading-5 transition-colors",
                              isActive ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                            )}
                          >
                            {diet.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <OnboardingFieldNote>
                Choose the style that sounds easiest to repeat in real life. You can adjust it later if your plan feels too restrictive.
              </OnboardingFieldNote>

              {macroPreview && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="Rough preview"
                    description="A starting point based on your body stats, activity, goal, and diet style."
                  />

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eadfce] dark:border-border pt-3 sm:grid-cols-4">
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">kcal</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.calories}</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Protein</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.protein}g</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Carbs</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.carbs}g</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Fat</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.fat}g</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    selectedDietType
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={!selectedDietType}
                >
                  Continue with this style
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "ingredient-mode" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 7 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                Build your food list
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Use a starter list by budget, or choose ingredients yourself. Both paths work, so pick the one that feels easiest to start with.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Ingredient setup"
                  description="Choose how you want to build the ingredient list for your first plan."
                />

                <div className="mt-3.5 grid gap-2 border-t border-[#eadfce] dark:border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setIngredientMode("recommend")}
                    aria-pressed={ingredientMode === "recommend"}
                    className={dietOptionButtonClass(ingredientMode === "recommend")}
                  >
                    <div
                      className={cn(
                        "text-[15px] font-semibold leading-5 transition-colors",
                        ingredientMode === "recommend" ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      Suggest a list for me
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm leading-5 transition-colors",
                        ingredientMode === "recommend" ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      Start from a budget-friendly, balanced, or wider-cost preset
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIngredientMode("custom")
                      setSelectedBudgetPreset(null)
                    }}
                    aria-pressed={ingredientMode === "custom"}
                    className={dietOptionButtonClass(ingredientMode === "custom")}
                  >
                    <div
                      className={cn(
                        "text-[15px] font-semibold leading-5 transition-colors",
                        ingredientMode === "custom" ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      I&apos;ll pick my own
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm leading-5 transition-colors",
                        ingredientMode === "custom" ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      Browse by protein, carbs, fats, and vegetables
                    </div>
                  </button>
                </div>
              </div>

              <OnboardingFieldNote>
                {ingredientMode === "recommend"
                  ? "Good for a faster start. You’ll choose a preset on the next step."
                  : ingredientMode === "custom"
                    ? "Good if you already know what you like to buy and cook."
                    : "You can start simple with a preset or build the list yourself. Both lead to the same plan generator."}
              </OnboardingFieldNote>

              <div className="space-y-2.5 pt-0.5">
                <OnboardingPrimaryCta
                  className={cn(
                    ingredientMode
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={moveToNextStep}
                  disabled={!ingredientMode}
                >
                  {ingredientMode === "recommend"
                    ? "Continue with a starter list"
                    : ingredientMode === "custom"
                      ? "Continue with custom ingredients"
                      : "Continue with this setup"}
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "ingredients" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>Step 8 of 8</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                Choose ingredients
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-xl pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                Build a list that feels realistic to shop for and repeat. For a workable plan, aim for at least 2 proteins, 1 carb, and 1 fat. Vegetables are a nice add-on.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-24 sm:px-7 sm:pb-8">
              {ingredientMode === "recommend" && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="Starter presets"
                    description="Choose the budget range that feels most realistic for your week."
                  />

                  <div className="mt-3.5 max-h-[40vh] space-y-1.5 overflow-y-auto border-t border-[#eadfce] dark:border-border pt-3 pr-1 sm:max-h-[44vh]">
                    {budgetPresets.map((preset) => {
                      const isActive = selectedBudgetPreset === preset.id

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => chooseBudgetPreset(preset.id, preset.items)}
                          aria-pressed={isActive}
                          className={ingredientPresetButtonClass(isActive)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  "break-words text-[15px] font-semibold leading-5 transition-colors",
                                  isActive ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                                )}
                                suppressHydrationWarning
                              >
                                {preset.label}
                              </div>
                              <div
                                className={cn(
                                  "mt-0.5 text-sm leading-5 transition-colors",
                                  isActive ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                                )}
                                suppressHydrationWarning
                              >
                                {preset.weeklyCost}
                              </div>
                            </div>
                            <span className={ingredientPresetStatusBadgeClass(isActive)}>{isActive ? "Selected" : "Preset"}</span>
                          </div>
                          <div className="mt-1.5 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground" suppressHydrationWarning>
                            {preset.items.join(", ")}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {ingredientMode === "custom" && (
                <>
                  <div className={onboardingUi.sectionSurface}>
                    <OnboardingSectionHeadingRow
                      title="Find ingredients"
                      description="Search for something specific first, or browse by category below."
                    />

                    <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8079] dark:text-muted-foreground" />
                        <OnboardingBoundedInput
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search ingredients..."
                          className="pl-10"
                        />
                      </div>

                      {search.trim() && (
                        <div className="space-y-2 rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card p-2.5 shadow-[0_8px_18px_-28px_rgba(40,49,43,0.2)]">
                          {ingredientCatalog
                            .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
                            .slice(0, 6)
                            .map((item) => (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => addIngredientFromSearch(item.name)}
                                className="flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-[#28312b] dark:text-foreground transition-colors hover:bg-[#f7efe5] dark:hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20"
                              >
                                <span className="min-w-0 break-words">{item.name}</span>
                                <span className="shrink-0 text-[11px] font-medium text-[#7a8079] dark:text-muted-foreground">Tap to add</span>
                              </button>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-full justify-start rounded-[18px] border-[#d8ccb9] dark:border-border bg-[#fff7ee] dark:bg-secondary/60 px-3.5 py-2.5 text-sm font-medium text-[#5e665f] dark:text-muted-foreground hover:bg-[#f8efe4] dark:hover:bg-secondary hover:text-[#28312b] dark:hover:text-foreground"
                            onClick={fetchIngredientViaClaude}
                            disabled={fetchingIngredient}
                            >
                            <Search className="mr-2 h-4 w-4 shrink-0 text-[#7a5b41] dark:text-muted-foreground" />
                            {fetchingIngredient ? "Looking that up…" : "Can’t find it? Look up with AI"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={onboardingUi.sectionSurface}>
                    <OnboardingSectionHeadingRow
                      title="Browse by category"
                      description="Tap ingredients to add or remove them from your list."
                    />

                    <div className="mt-3.5 grid gap-3 border-t border-[#eadfce] dark:border-border pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {categoryTabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveCategory(tab.id)}
                            aria-pressed={activeCategory === tab.id}
                            className={ingredientCategoryTabClass(activeCategory === tab.id)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1 sm:max-h-[44vh]">
                        {ingredientCatalog
                          .filter((item) => item.category === activeCategory)
                          .map((item) => {
                            const selected = selectedIngredients.includes(item.name)

                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => toggleIngredient(item.name)}
                                aria-pressed={selected}
                                className={ingredientCatalogButtonClass(selected)}
                              >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div
                                      className={cn(
                                        "break-words text-[15px] font-semibold leading-5 transition-colors",
                                        selected ? "text-[#243128] dark:text-foreground" : "text-[#28312b] dark:text-foreground"
                                      )}
                                    >
                                      {item.name}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground">
                                      <span>{item.calories} kcal</span>
                                      <span>P {item.protein}</span>
                                      <span>C {item.carbs}</span>
                                      <span>F {item.fat}</span>
                                      <span>per 100g</span>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className={ingredientPriceBadgeClass(item.cost, selected)}>{item.cost}</span>
                                    {selected ? <span className="text-[11px] font-medium text-[#617055] dark:text-primary">Added</span> : null}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="Selection snapshot"
                  description="A quick check to keep the first meal plan practical."
                />

                <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Cost mix</div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                        {sustainabilityLabel}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">Selected</div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                        {selectedIngredients.length} ingredients
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={ingredientRequirementPillClass(ingredientCounts.protein >= 2)}>
                      Proteins: {ingredientCounts.protein} {ingredientCounts.protein >= 2 ? "OK" : "Need 2"}
                    </span>
                    <span className={ingredientRequirementPillClass(ingredientCounts.carbs >= 1)}>
                      Carbs: {ingredientCounts.carbs} {ingredientCounts.carbs >= 1 ? "OK" : "Need 1"}
                    </span>
                    <span className={ingredientRequirementPillClass(ingredientCounts.fats >= 1)}>
                      Fats: {ingredientCounts.fats} {ingredientCounts.fats >= 1 ? "OK" : "Need 1"}
                    </span>
                  </div>

                  <OnboardingFieldNote>
                    So far: Protein {ingredientCounts.protein}, Carbs {ingredientCounts.carbs}, Fats {ingredientCounts.fats}
                  </OnboardingFieldNote>
                </div>
              </div>

              {!isIngredientSelectionValid && (
                <OnboardingFieldNote error>{ingredientMinimumMessage}</OnboardingFieldNote>
              )}

              <div className="sticky bottom-0 z-10 -mx-5 border-t border-[#eadfce] dark:border-border bg-[#fffaf4]/95 dark:bg-card/95 px-5 pt-3 backdrop-blur sm:-mx-7 sm:px-7">
                <OnboardingPrimaryCta
                  className={cn(
                    isIngredientSelectionValid
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onClick={handleComplete}
                  disabled={!isIngredientSelectionValid}
                  suppressHydrationWarning
                >
                  Create my 7-day plan ({selectedIngredients.length} ingredients)
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        <OnboardingProgressIndicator activeStep={step} />
      </div>
    </div>
  )
}
