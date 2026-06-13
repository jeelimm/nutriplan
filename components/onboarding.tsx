"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { localizeIngredientName } from "@/lib/ingredient-i18n"
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
  AlertCircle,
} from "lucide-react"

const goals: { id: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "lose-fat", label: "체지방 감량", description: "칼로리는 살짝 줄이고, 포만감을 위해 단백질은 충분히", icon: <TrendingUp className="h-6 w-6" /> },
  { id: "gain-muscle", label: "근육 증가", description: "근력 운동과 회복을 돕도록 칼로리를 조금 더", icon: <Dumbbell className="h-6 w-6" /> },
  { id: "recomposition", label: "린 리컴프(체지방↓근육↑)", description: "꾸준히 먹으면서 시간을 두고 체지방을 줄이고 근육은 유지", icon: <RefreshCw className="h-6 w-6" /> },
]

const activityLevels: { id: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { id: "sedentary", label: "거의 안 움직임", description: "주로 책상·집에서 생활, 계획된 운동은 거의 없음", multiplier: 1.2 },
  { id: "light", label: "가벼운 활동", description: "가벼운 산책·운동, 또는 서서 일하는 날", multiplier: 1.375 },
  { id: "moderate", label: "보통", description: "대부분 주에 규칙적인 운동 또는 활동적인 직업", multiplier: 1.55 },
  { id: "very-active", label: "매우 활발", description: "주 대부분 강도 높은 훈련이나 육체 활동", multiplier: 1.725 },
]

const dietTypes: { id: DietType; label: string; description: string }[] = [
  { id: "keto", label: "키토", description: "탄수화물은 적게, 지방은 많게 — 이런 식사를 선호한다면" },
  { id: "high-protein", label: "고단백", description: "매일 단백질 비중을 더 높게" },
  { id: "balanced", label: "균형", description: "탄수화물·단백질·지방을 고르게 배분" },
  { id: "intermittent-fasting", label: "간헐적 단식", description: "정해진 시간대에 끼니는 적게, 양은 크게" },
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
    label: "천천히",
    kgPerWeek: 0.5,
    deficitKcal: 550,
    hint: "유지하기 쉽고 근손실 최소",
  },
  {
    id: "moderate",
    emoji: "🚶",
    label: "보통",
    kgPerWeek: 0.75,
    deficitKcal: 820,
    hint: "균형 잡힌 속도, 대부분에게 적합",
  },
  {
    id: "aggressive",
    emoji: "🏃",
    label: "빠르게",
    kgPerWeek: 1,
    deficitKcal: 1100,
    hint: "결과는 빠르지만 더 큰 절제가 필요",
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
    label: "가성비",
    weeklyCost: "주당 ~$50 · 기본 식재료 위주",
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
    label: "적당한 지출",
    weeklyCost: "주당 ~$80 · 기본 + 약간의 업그레이드",
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
    label: "다양하게",
    weeklyCost: "주당 ~$120 · 더 다양한 재료 구성",
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
  { id: "protein", label: "단백질" },
  { id: "carbs", label: "탄수화물" },
  { id: "fats", label: "지방" },
  { id: "vegetables", label: "채소" },
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
    "flex items-start gap-2 rounded-md border border-[#DC2626] bg-[#FEF2F2] px-[14px] py-[10px] text-xs font-semibold leading-[1.35] text-[#B91C1C]",
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
  if (error) {
    return (
      <p className={onboardingUi.inputValidation}>
        <AlertCircle size={16} className="mt-px shrink-0 text-[#DC2626]" />
        <span>{children}</span>
      </p>
    )
  }
  return <p className={onboardingUi.inputNote}>{children}</p>
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
  const { setUserProfile, setCurrentStep, calculateMacros, appPrefs } = useMealStore()
  const language = appPrefs.language
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
  const [pendingClaudeIngredient, setPendingClaudeIngredient] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number; cost: number } | null>(null)
  const [selectedClaudeCategory, setSelectedClaudeCategory] = useState<string | null>(null)
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
  const ingredientMinimumMessage = "계속하려면 단백질 2개, 탄수화물 1개, 지방 1개 이상 선택하세요"

  const sustainabilityLabel = useMemo(() => {
    if (!selectedCatalogItems.length) return "재료를 고르면 가격 구성을 보여드려요"
    const scoreMap: Record<CostTier, number> = { "$": 1, "$$": 2, "$$$": 3 }
    const avgScore =
      selectedCatalogItems.reduce((sum, item) => sum + scoreMap[item.cost], 0) / selectedCatalogItems.length

    if (avgScore <= 1.5) return "대체로 가성비 좋은 구성"
    if (avgScore <= 2.2) return "다양한 가격대가 섞인 구성"
    return "다소 비싼 재료 포함"
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
      selectedGoal === "lose-fat" ? weightLossPace : null
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
      return `체지방 감량 목표에서는 목표 체중이 현재 체중(${current}${unit})보다 낮아야 해요.`
    }
    if (selectedGoal === "gain-muscle" && target <= current) {
      return "근육 증가 목표에서는 목표 체중이 현재 체중보다 높아야 해요."
    }
    if (selectedGoal === "recomposition" && target >= current) {
      return "린 리컴프에서는 더 낮은 목표 체중을 쓰거나, 이 단계를 건너뛰고 체성분 변화에 집중하세요."
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
      ? "원한다면 목표 체중과 속도를 정해보세요. 대략적인 일정을 추정하는 데 사용하며, 건너뛰고 먼저 습관에 집중해도 좋아요."
      : isGainMuscleGoal
        ? "생각해둔 목표 체중이 있다면 참고용으로 입력하세요. 건너뛰고 먼저 꾸준한 진전에 집중해도 좋아요."
        : isRecompositionGoal
          ? "느슨한 체중 기준이 필요하면 여기에 입력하세요. 부드러운 리컴프 방식을 사용하며, 건너뛰고 먼저 꾸준함에 집중해도 좋아요."
          : "플랜의 기준점이 필요하면 목표를 입력하고, 아니면 건너뛰고 간단하게 진행하세요."

  const stepFourTargetDescription =
    isLoseFatGoal
      ? "대략적인 일정을 원하면 숫자를 입력하세요. 아니라면 아래 건너뛰기를 눌러 루틴에 집중하세요."
      : isGainMuscleGoal
        ? "생각해둔 목표가 있으면 숫자를 입력하세요. 아니라면 아래 건너뛰기를 눌러 꾸준한 진전에 집중하세요."
        : isRecompositionGoal
          ? "느슨한 체중 기준을 원하면 숫자를 입력하세요. 아니라면 아래 건너뛰기를 눌러 꾸준함에 집중하세요."
          : "원하면 목표를 입력하고, 아니면 아래 건너뛰기를 사용하세요."

  const stepFourTargetHelper =
    isLoseFatGoal
      ? "아직 체중 목표를 정하고 싶지 않다면 아래 건너뛰기를 사용하세요."
      : isGainMuscleGoal
        ? "먼저 꾸준한 운동과 식사에 집중하고 싶다면 아래 건너뛰기를 사용하세요."
        : isRecompositionGoal
          ? "체중 변화보다 체성분에 집중하고 싶다면 아래 건너뛰기를 사용하세요."
          : "유연하게 두고 싶다면 아래 건너뛰기를 사용하세요."

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
      if (typeof data.name !== "string" || !data.name.trim()) throw new Error("Invalid response")

      if (ingredientCatalog.some((item) => item.name === data.name)) {
        addIngredientFromSearch(data.name)
      } else {
        setPendingClaudeIngredient({
          name: data.name,
          calories: Number(data.calories) || 0,
          protein: Number(data.protein) || 0,
          carbs: Number(data.carbs) || 0,
          fat: Number(data.fat) || 0,
          cost: Number(data.cost) || 0,
        })
        setSelectedClaudeCategory(null)
      }
    } catch {
      window.alert("지금은 해당 재료를 찾을 수 없어요. 다른 이름으로 시도하거나 목록에서 선택하세요.")
    } finally {
      setFetchingIngredient(false)
    }
  }

  const confirmClaudeIngredient = (category: string) => {
    ingredientCatalog.unshift({ ...pendingClaudeIngredient!, category: category as IngredientCategory })
    addIngredientFromSearch(pendingClaudeIngredient!.name)
    setPendingClaudeIngredient(null)
    setSelectedClaudeCategory(null)
  }

  const cancelClaudeIngredient = () => {
    setPendingClaudeIngredient(null)
    setSelectedClaudeCategory(null)
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
      selectedGoal === "lose-fat" ? weightLossPace : null
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
      usedQuickEstimate: firstStep === "quick-estimate",
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
      return "시작점을 설정할 수 있도록 입력해 주세요."
    }

    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) {
      return "0보다 큰 숫자를 입력하세요."
    }

    if (field === "bodyFat" && (value < 1 || value > 75)) {
      return "체지방률은 1에서 75 사이로 입력하세요."
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
              ? "설정 옵션으로 돌아가기"
              : step === "activity"
                ? (firstStep === "quick-estimate" ? "기본 설정으로 돌아가기" : "신체 정보로 돌아가기")
                : step === "goal"
                  ? "활동량으로 돌아가기"
                  : step === "target-weight"
                    ? "목표로 돌아가기"
                    : step === "cuisine"
                      ? "목표 체중으로 돌아가기"
                      : step === "diet"
                        ? "요리 선택으로 돌아가기"
                        : step === "ingredient-mode"
                          ? "식단 스타일로 돌아가기"
                          : "재료 설정으로 돌아가기"}
          </OnboardingSecondaryActionRow>
        )}

        {step === "body" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 1단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                상세 신체 정보 사용
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                체지방률이나 인바디 측정값이 있다면 가장 좋아요. 더 정확한 칼로리·단백질 목표를 잡을 수 있어요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <Label>성별</Label>
                  <OnboardingSegmentedGroup>
                    <button
                      type="button"
                      onClick={() => setSex("male")}
                      className={optionButtonClass(sex === "male")}
                      aria-pressed={sex === "male"}
                    >
                      남성
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex("female")}
                      className={optionButtonClass(sex === "female")}
                      aria-pressed={sex === "female"}
                    >
                      여성
                    </button>
                  </OnboardingSegmentedGroup>
                </div>
                <div className="space-y-2.5">
                  <Label>단위 시스템</Label>
                  <OnboardingSegmentedGroup>
                    <button
                      type="button"
                      onClick={() => setMeasurementSystem("metric")}
                      className={optionButtonClass(unitSystem === "metric")}
                      aria-pressed={unitSystem === "metric"}
                    >
                      미터법
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeasurementSystem("imperial")}
                      className={optionButtonClass(unitSystem === "imperial")}
                      aria-pressed={unitSystem === "imperial"}
                    >
                      야드파운드법
                    </button>
                  </OnboardingSegmentedGroup>
                  <OnboardingFieldNote>신체 입력값과 레시피 단위를 함께 설정해요.</OnboardingFieldNote>
                </div>
              </div>

              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="신체 정보"
                  description="인바디 측정, 스마트 체중계, 또는 대략적인 추정값을 입력하세요."
                />

                <div className="mt-3.5 grid gap-3 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className={getBodyLabelClassName("weight")}>체중 ({unit})</Label>
                    <OnboardingBoundedInput
                      id="weight"
                      type="text"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "예: 80" : "예: 175"}
                      value={weight}
                      onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                      onFocus={() => setFocusedBodyField("weight")}
                      onBlur={() => handleBodyFieldBlur("weight")}
                      aria-invalid={Boolean(weightError)}
                      className={getBodyFieldClassName("weight", weight)}
                    />
                    <OnboardingFieldNote error={Boolean(weightError)}>
                      {weightError ?? "현재 체중 또는 최근 평균값."}
                    </OnboardingFieldNote>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bodyFat" className={getBodyLabelClassName("bodyFat")}>체지방률 (%)</Label>
                    <OnboardingBoundedInput
                      id="bodyFat"
                      type="text"
                      inputMode="decimal"
                      placeholder="예: 18"
                      value={bodyFat}
                      onChange={(e) => handleNumericInput(e.target.value, setBodyFat)}
                      onFocus={() => setFocusedBodyField("bodyFat")}
                      onBlur={() => handleBodyFieldBlur("bodyFat")}
                      aria-invalid={Boolean(bodyFatError)}
                      className={getBodyFieldClassName("bodyFat", bodyFat)}
                    />
                    <OnboardingFieldNote error={Boolean(bodyFatError)}>
                      {bodyFatError ?? "인바디 측정, 스마트 체중계, 또는 대략적인 추정값."}
                    </OnboardingFieldNote>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="muscleMass" className={getBodyLabelClassName("muscleMass")}>근육량 ({unit})</Label>
                    <OnboardingBoundedInput
                      id="muscleMass"
                      type="text"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "예: 65" : "예: 140"}
                      value={muscleMass}
                      onChange={(e) => handleNumericInput(e.target.value, setMuscleMass)}
                      onFocus={() => setFocusedBodyField("muscleMass")}
                      onBlur={() => handleBodyFieldBlur("muscleMass")}
                      aria-invalid={Boolean(muscleMassError)}
                      className={getBodyFieldClassName("muscleMass", muscleMass)}
                    />
                    <OnboardingFieldNote error={Boolean(muscleMassError)}>
                      {muscleMassError ?? "인바디 측정이나 스마트 체중계 값. 없다면 기본 설정에서 대신 추정해 드려요."}
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
                      목표를 설정하는 중...
                    </span>
                  ) : (
                    "목표 설정하기"
                  )}
                </OnboardingPrimaryCta>

                <p className="text-center text-[11px] leading-[1.45] text-[#7a8079] dark:text-muted-foreground">
                  지금은 대략적인 추정값을 사용하세요. 나중에 수정할 수 있어요.
                </p>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "quick-estimate" && !entryChosen && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
              <CardTitle className="text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                어떻게 시작할까요?
              </CardTitle>
              <CardDescription className="mt-2 max-w-sm text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                칼로리 목표를 설정할 방법을 선택하세요.
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
                    <div className="text-[15px] font-semibold text-[#243128] dark:text-foreground">추정하기</div>
                    <div className="mt-0.5 text-sm leading-5 text-[#4f5e56] dark:text-muted-foreground">체형으로 체성분을 추정해요</div>
                  </div>
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
                    <div className="text-[15px] font-semibold text-[#28312b] dark:text-foreground">정밀 (인바디)</div>
                    <div className="mt-0.5 text-sm leading-5 text-[#5e665f] dark:text-muted-foreground">정확한 인바디 측정값 입력</div>
                  </div>
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
            설정 옵션으로 돌아가기
          </OnboardingSecondaryActionRow>
        )}

        {step === "quick-estimate" && entryChosen && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 1단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                기본 정보부터 시작
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                키, 체중, 나이, 체형으로 더 빠르게 설정해요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="기본 정보"
                  description="대략적인 추정값을 입력하세요 — 언제든 수정할 수 있어요."
                />

                <div className="mt-3.5 grid gap-4 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label>성별</Label>
                      <OnboardingSegmentedGroup>
                        <button
                          type="button"
                          onClick={() => setSex("male")}
                          className={optionButtonClass(sex === "male")}
                          aria-pressed={sex === "male"}
                        >
                          남성
                        </button>
                        <button
                          type="button"
                          onClick={() => setSex("female")}
                          className={optionButtonClass(sex === "female")}
                          aria-pressed={sex === "female"}
                        >
                          여성
                        </button>
                      </OnboardingSegmentedGroup>
                    </div>
                    <div className="space-y-2.5">
                      <Label>단위 시스템</Label>
                      <OnboardingSegmentedGroup>
                        <button
                          type="button"
                          onClick={() => setMeasurementSystem("metric")}
                          className={optionButtonClass(unitSystem === "metric")}
                          aria-pressed={unitSystem === "metric"}
                        >
                          미터법
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeasurementSystem("imperial")}
                          className={optionButtonClass(unitSystem === "imperial")}
                          aria-pressed={unitSystem === "imperial"}
                        >
                          야드파운드법
                        </button>
                      </OnboardingSegmentedGroup>
                      <OnboardingFieldNote>추정 입력값과 레시피 단위를 함께 전환해요.</OnboardingFieldNote>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="quickWeight">체중 ({unit})</Label>
                      <OnboardingBoundedInput
                        id="quickWeight"
                        type="text"
                        inputMode="decimal"
                        placeholder={unit === "kg" ? "예: 80" : "예: 175"}
                        value={weight}
                        onChange={(e) => handleNumericInput(e.target.value, setWeight)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quickHeight">키 ({unit === "kg" ? "cm" : "in"})</Label>
                      <OnboardingBoundedInput
                        id="quickHeight"
                        type="text"
                        inputMode="decimal"
                        placeholder={unit === "kg" ? "예: 175" : "예: 69"}
                        value={quickHeight}
                        onChange={(e) => handleNumericInput(e.target.value, setQuickHeight)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quickAge">나이</Label>
                    <OnboardingBoundedInput
                      id="quickAge"
                      type="text"
                      inputMode="numeric"
                      placeholder="예: 30"
                      value={quickAge}
                      onChange={(e) => handleNumericInput(e.target.value, setQuickAge)}
                    />
                  </div>
                </div>
              </div>

              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="체형"
                  description="가장 비슷한 것을 고르세요. 완벽하지 않아도 괜찮아요."
                />

                <div className="mt-3.5 grid gap-2 border-t border-[#eadfce] dark:border-border pt-3">
                  {([
                    { id: "lean", label: "마른 편", description: "타고나게 마른 체형, 낮은 체지방" },
                    { id: "average", label: "보통", description: "평균 체형, 보통 체지방" },
                    { id: "athletic", label: "탄탄한 편", description: "눈에 띄게 근육질, 활동적인 생활" },
                    { id: "heavy-set", label: "건장한 편", description: "현재 체중이 다소 있는 편" },
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

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  weight && quickHeight && quickAge && quickBodyType
                    ? "max-h-[72px] opacity-100"
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-2.5 pt-0.5">
                  <OnboardingPrimaryCta
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={applyQuickEstimate}
                  >
                    목표 설정하기
                  </OnboardingPrimaryCta>
                </div>
              </div>

              <p className="text-center text-[11px] leading-[1.45] text-[#7a8079] dark:text-muted-foreground">
                나중에 상세 정보로 더 정교하게 조정할 수 있어요.
              </p>

              <div className="border-t border-[#eadfce] dark:border-border pt-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">상세 신체 정보 사용</p>
                <p className="mt-1 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground">체지방률이나 인바디 측정값이 있다면 가장 좋아요.</p>
                <button
                  type="button"
                  onClick={() => setStep("body")}
                  className="mt-2 text-sm font-medium text-[#7a5b41] dark:text-muted-foreground underline underline-offset-2 hover:text-[#5e3e27] dark:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:rounded"
                >
                  상세 신체 정보가 있어요 (인바디, 스마트 체중계 등)
                </button>
              </div>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e4b]/20 focus-visible:rounded"
                >
                  처음부터 다시
                </button>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "activity" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 2단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                한 주가 얼마나 활동적인가요?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                평소 한 주와 가장 비슷한 것을 고르세요. 신체 정보를 현실적인 칼로리 시작점으로 바꾸는 데 도움이 되며, 나중에 수정할 수 있어요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="주간 활동량"
                  description="평소 한 주와 가장 비슷하게 들리는 것을 고르세요."
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
                완벽한 루틴이 아니라 실제 한 주의 느낌에 맞춰 식단을 구성하는 데 도움이 돼요.
              </OnboardingFieldNote>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  selectedActivityLevel ? "max-h-[72px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-2.5 pt-0.5">
                  <OnboardingPrimaryCta
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={moveToNextStep}
                  >
                    계속 — {activityLevels.find(l => l.id === selectedActivityLevel)?.label}
                  </OnboardingPrimaryCta>
                </div>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "goal" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 3단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                무엇을 목표로 하나요?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                정답은 없어요. 칼로리와 영양소를 알맞은 방향으로 살짝 조정할 뿐이에요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="목표"
                  description="이 플랜이 먼저 지원했으면 하는 방향을 고르세요."
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
                목표 체중과 속도는 다음 단계에서 세밀하게 조정할 수 있어요.
              </OnboardingFieldNote>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  selectedGoal ? "max-h-[72px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-2.5 pt-0.5">
                  <OnboardingPrimaryCta
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={moveToNextStep}
                  >
                    계속 — {goals.find(g => g.id === selectedGoal)?.label}
                  </OnboardingPrimaryCta>
                </div>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "target-weight" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 4단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                목표 체중 설정 (선택)
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                {stepFourSupportingCopy}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="목표 체중"
                  description={stepFourTargetDescription}
                />

                <div className="mt-3.5 grid gap-3 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="target-weight">목표 체중 ({unit})</Label>
                    <OnboardingBoundedInput
                      id="target-weight"
                      inputMode="decimal"
                      placeholder={unit === "kg" ? "예: 72" : "예: 160"}
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
                    title="근육 증가 방식"
                    description="근육 성장을 돕기 위해 약 300kcal의 꾸준한 잉여 칼로리를 사용해요."
                  />
                </div>
              )}

              {isLoseFatGoal && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="감량 속도"
                    description="한 주에 현실적으로 느껴지는 속도를 고르세요."
                  />

                  <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                    {weightLossPaceOptions.map((opt) => {
                      const weekly =
                        unit === "kg"
                          ? `주당 ~${opt.kgPerWeek}kg`
                          : `주당 ~${(opt.kgPerWeek * 2.20462).toFixed(1)}lb`

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
                            {opt.emoji} {opt.label} — {weekly} (하루 ~{opt.deficitKcal} kcal 부족)
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
                    title="리컴프 방식"
                    description="부드러운 칼로리 부족을 사용하고, 시간에 따라 몸이 변하면 맞춰 조정해요."
                  />
                </div>
              )}

              {macroPreview?.calorieFloorApplied &&
                (isLoseFatGoal || isRecompositionGoal) && (
                  <OnboardingFieldNote error>
                    최소 안전 섭취량 이상을 유지하도록 목표를 조정했어요.
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
                  숫자보다 습관에 집중할게요
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
                  이 목표로 계속
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "cuisine" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 5단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                평소 어떤 음식을 드시나요?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                실제 한 주와 가장 가까운 요리를 한두 개 고르세요. 실제로 구할 수 있고, 부담 없고, 계속 먹고 싶은 음식 위주로 구성해요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="요리 취향"
                  description="처음부터 익숙하게 느껴지도록 한두 가지 스타일을 고르세요."
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
                  ? "최소 하나를 고르세요. 요리는 최대 두 개까지 선택할 수 있어요."
                  : selectedCuisines.length === 1
                    ? "평소 여러 스타일을 섞어 드신다면 요리를 하나 더 추가할 수 있어요."
                    : "두 가지 요리를 선택했어요. 두 스타일을 균형 있게 반영할게요."}
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
                  {selectedCuisines.length > 1 ? "이 요리들로 계속" : "이 요리로 계속"}
                </OnboardingPrimaryCta>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "diet" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 6단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                어떻게 드시는 걸 좋아하나요?
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                간단하게 — 가장 지키기 쉬울 것 같은 스타일을 고르면, 아래에 대략적인 영양소 시작점을 보여드려요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="식단 스타일"
                  description="일상 식사에 가장 현실적으로 느껴지는 스타일을 고르세요."
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
                실생활에서 가장 반복하기 쉬울 것 같은 스타일을 고르세요. 플랜이 너무 빡빡하면 나중에 조정할 수 있어요.
              </OnboardingFieldNote>

              {macroPreview && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="대략 미리보기"
                    description="신체 정보, 활동량, 목표, 식단 스타일을 바탕으로 한 시작점이에요."
                  />

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eadfce] dark:border-border pt-3 sm:grid-cols-4">
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">kcal</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.calories}</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">단백질</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.protein}g</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">탄수화물</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.carbs}g</div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5 text-center shadow-[0_8px_18px_-28px_rgba(40,49,43,0.24)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">지방</div>
                      <div className="mt-1 text-[1.1rem] font-semibold tabular-nums leading-none text-[#28312b] dark:text-foreground">{macroPreview.macros.fat}g</div>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  selectedDietType ? "max-h-[72px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-2.5 pt-0.5">
                  <OnboardingPrimaryCta
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={moveToNextStep}
                  >
                    계속 — {dietTypes.find(d => d.id === selectedDietType)?.label}
                  </OnboardingPrimaryCta>
                </div>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "ingredient-mode" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 7단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                식재료 목록 만들기
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-md pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                예산별 추천 목록을 쓰거나, 직접 재료를 고르세요. 둘 다 괜찮으니 시작하기 편한 쪽을 고르세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-5 sm:px-7 sm:pb-6">
              <div className={onboardingUi.sectionSurface}>
                <OnboardingSectionHeadingRow
                  title="재료 설정"
                  description="첫 플랜의 재료 목록을 어떻게 만들지 고르세요."
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
                      목록을 추천해 주세요
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm leading-5 transition-colors",
                        ingredientMode === "recommend" ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      가성비, 균형, 또는 더 다양한 가격대 프리셋으로 시작해요
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
                      직접 고를게요
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm leading-5 transition-colors",
                        ingredientMode === "custom" ? "text-[#4f5e56] dark:text-muted-foreground" : "text-[#5e665f] dark:text-muted-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      단백질, 탄수화물, 지방, 채소별로 둘러봐요
                    </div>
                  </button>
                </div>
              </div>

              <OnboardingFieldNote>
                {ingredientMode === "recommend"
                  ? "더 빠르게 시작하기 좋아요. 다음 단계에서 프리셋을 고르게 돼요."
                  : ingredientMode === "custom"
                    ? "평소 사고 요리하는 재료를 잘 안다면 좋아요."
                    : "프리셋으로 간단히 시작하거나 직접 목록을 만들 수 있어요. 둘 다 같은 플랜 생성기로 이어져요."}
              </OnboardingFieldNote>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  ingredientMode ? "max-h-[72px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-2.5 pt-0.5">
                  <OnboardingPrimaryCta
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={moveToNextStep}
                  >
                    {ingredientMode === "recommend"
                      ? "추천 재료로 계속"
                      : ingredientMode === "custom"
                        ? "선택한 재료로 계속"
                        : "이 구성으로 계속"}
                  </OnboardingPrimaryCta>
                </div>
              </div>
            </CardContent>
          </OnboardingMainCard>
        )}

        {step === "ingredients" && (
          <OnboardingMainCard>
            <CardHeader className="px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
              <OnboardingStepChip>8단계 중 8단계</OnboardingStepChip>
              <CardTitle className="mt-3 text-[1.78rem] leading-[1.08] text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                재료 선택
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-xl pr-1 text-[14px] leading-6 text-[#5e665f] dark:text-muted-foreground sm:text-[15px]" suppressHydrationWarning>
                장 보고 반복하기에 현실적인 목록을 만드세요. 쓸 만한 플랜을 위해 단백질 2개, 탄수화물 1개, 지방 1개 이상을 목표로 하세요. 채소는 더하면 좋아요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4.5 px-5 pb-24 sm:px-7 sm:pb-8">
              {ingredientMode === "recommend" && (
                <div className={onboardingUi.sectionSurface}>
                  <OnboardingSectionHeadingRow
                    title="추천 프리셋"
                    description="한 주에 가장 현실적으로 느껴지는 예산대를 고르세요."
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
                            <span className={ingredientPresetStatusBadgeClass(isActive)}>{isActive ? "선택됨" : "프리셋"}</span>
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
                      title="재료 찾기"
                      description="먼저 특정 재료를 검색하거나, 아래에서 카테고리별로 둘러보세요."
                    />

                    <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8079] dark:text-muted-foreground" />
                        <OnboardingBoundedInput
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (!search.trim() || fetchingIngredient) return
                              void fetchIngredientViaClaude()
                            }
                          }}
                          placeholder="재료 검색..."
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
                                <span className="min-w-0 break-words">{localizeIngredientName(item.name, language)}</span>
                                <span className="shrink-0 text-[11px] font-medium text-[#7a8079] dark:text-muted-foreground">탭하여 추가</span>
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
                            {fetchingIngredient ? "찾는 중…" : "못 찾으셨나요? AI로 찾아보기"}
                          </Button>
                          {pendingClaudeIngredient !== null && (
                            <div className="mt-3 flex flex-col gap-2">
                              <p className="text-xs font-medium text-[#5e665f] dark:text-muted-foreground">
                                <span className="font-semibold text-[#28312b] dark:text-foreground">{localizeIngredientName(pendingClaudeIngredient.name, language)}</span>은(는) 어떤 카테고리인가요?
                              </p>
                              {(() => {
                                const tokens: string[] = []
                                if (typeof pendingClaudeIngredient.calories === "number") tokens.push(`${Math.round(pendingClaudeIngredient.calories)} kcal`)
                                if (typeof pendingClaudeIngredient.protein === "number") tokens.push(`P ${Math.round(pendingClaudeIngredient.protein)}g`)
                                if (typeof pendingClaudeIngredient.carbs === "number") tokens.push(`C ${Math.round(pendingClaudeIngredient.carbs)}g`)
                                if (typeof pendingClaudeIngredient.fat === "number") tokens.push(`F ${Math.round(pendingClaudeIngredient.fat)}g`)
                                return tokens.length > 0 ? (
                                  <p className="text-sm text-muted-foreground">{tokens.join(" · ")} <span className="text-xs">(100g당)</span></p>
                                ) : null
                              })()}
                              <div className="grid grid-cols-4 gap-2">
                                {([["단백질", "protein"], ["탄수화물", "carbs"], ["지방", "fats"], ["채소", "vegetables"]] as const).map(([label, value]) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSelectedClaudeCategory(value)}
                                    className={cn(
                                      "min-h-[44px] rounded-[14px] text-xs font-medium transition-colors",
                                      selectedClaudeCategory === value
                                        ? "bg-primary text-primary-foreground"
                                        : "border border-input bg-background text-foreground"
                                    )}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <Button
                                type="button"
                                className="w-full min-h-[44px] rounded-[14px]"
                                disabled={!selectedClaudeCategory}
                                onClick={() => confirmClaudeIngredient(selectedClaudeCategory!)}
                              >
                                {localizeIngredientName(pendingClaudeIngredient.name, language)} 추가
                              </Button>
                              <button
                                type="button"
                                onClick={cancelClaudeIngredient}
                                className="text-xs text-[#7a8079] dark:text-muted-foreground underline underline-offset-2 self-center"
                              >
                                취소
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={onboardingUi.sectionSurface}>
                    <OnboardingSectionHeadingRow
                      title="카테고리별 둘러보기"
                      description="재료를 탭하여 목록에 추가하거나 제거하세요."
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
                                      {localizeIngredientName(item.name, language)}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs leading-5 text-[#7a8079] dark:text-muted-foreground">
                                      <span>{item.calories} kcal</span>
                                      <span>P {item.protein}</span>
                                      <span>C {item.carbs}</span>
                                      <span>F {item.fat}</span>
                                      <span>100g당</span>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className={ingredientPriceBadgeClass(item.cost, selected)}>{item.cost}</span>
                                    {selected ? <span className="text-[11px] font-medium text-[#617055] dark:text-primary">추가됨</span> : null}
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
                  title="선택 요약"
                  description="첫 식단을 실용적으로 유지하기 위한 간단한 확인이에요."
                />

                <div className="mt-3.5 grid gap-2.5 border-t border-[#eadfce] dark:border-border pt-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">가격 구성</div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                        {sustainabilityLabel}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-[#e1d5c5] dark:border-border bg-[#fffdf9] dark:bg-card px-3 py-2.5">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a8079] dark:text-muted-foreground">선택됨</div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[#28312b] dark:text-foreground" suppressHydrationWarning>
                        재료 {selectedIngredients.length}개
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={ingredientRequirementPillClass(ingredientCounts.protein >= 2)}>
                      단백질: {ingredientCounts.protein} {ingredientCounts.protein >= 2 ? "충족" : "2개 필요"}
                    </span>
                    <span className={ingredientRequirementPillClass(ingredientCounts.carbs >= 1)}>
                      탄수화물: {ingredientCounts.carbs} {ingredientCounts.carbs >= 1 ? "충족" : "1개 필요"}
                    </span>
                    <span className={ingredientRequirementPillClass(ingredientCounts.fats >= 1)}>
                      지방: {ingredientCounts.fats} {ingredientCounts.fats >= 1 ? "충족" : "1개 필요"}
                    </span>
                  </div>

                  <OnboardingFieldNote>
                    현재: 단백질 {ingredientCounts.protein}, 탄수화물 {ingredientCounts.carbs}, 지방 {ingredientCounts.fats}
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
                  7일 플랜 만들기 (재료 {selectedIngredients.length}개)
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
