import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateNutritionTargets, getLbmKgForNutrition, proteinGPerKgLbm } from '@/lib/nutrition'
import { validateMealPlan, type MealPlanValidationResult } from '@/lib/meal-validator'

export type Goal = 'lose-fat' | 'gain-muscle' | 'recomposition'
export type DietType = 'keto' | 'high-protein' | 'balanced' | 'intermittent-fasting'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
export type Sex = 'male' | 'female'
export type RecipeUnitSystem = 'metric' | 'imperial'
export type Language = 'en' | 'ko'

export type WeightLossPace = 'steady' | 'moderate' | 'aggressive'
export type BodyType = 'slim' | 'average' | 'athletic' | 'heavy'

export type CuisinePreference =
  | 'western'
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'mediterranean'
  | 'asian-fusion'

export interface UserProfile {
  profileName?: string
  sex?: Sex
  unitSystem?: RecipeUnitSystem
  language?: Language
  targetWeight?: number
  weightLossPace?: WeightLossPace
  bodyType?: BodyType
  cuisinePreference?: CuisinePreference[]
  height?: number
  age?: number
  usedQuickEstimate?: boolean
  weight: number
  bodyFat: number
  muscleMass: number
  unit: 'kg' | 'lbs'
  activityLevel: ActivityLevel
  goal: Goal
  dietType: DietType
  mealsPerDay: number
  selectedIngredients: string[]
  dailyCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    minerals: number
  }
  createdAt: string
  lastUpdatedAt: string
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: Ingredient[]
  instructions: string[]
  prepTime: number
  cookTime: number
}

export interface Ingredient {
  name: string
  amount: string
  category: 'protein' | 'vegetables' | 'carbs' | 'dairy' | 'fats' | 'fruits' | 'spices'
}

export interface DayPlan {
  day: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export interface MealPlanConfig {
  dietType: DietType
  mealsPerDay: number
}

export interface SwapCandidate {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: Ingredient[]
  instructions: string[]
}

interface AppPrefs {
  language: Language
  unitSystem: RecipeUnitSystem
  darkMode: boolean
}

interface MealStore {
  appPrefs: AppPrefs
  setAppPrefs: (patch: Partial<AppPrefs>) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile) => void
  setUnitSystem: (unitSystem: RecipeUnitSystem) => void
  clearAllData: () => void
  mealPlanConfig: MealPlanConfig | null
  setMealPlanConfig: (config: MealPlanConfig) => void
  weekPlan: DayPlan[]
  setWeekPlan: (plan: DayPlan[]) => void
  mealPlanValidation: MealPlanValidationResult
  isGeneratingMealPlan: boolean
  selectedDay: number
  setSelectedDay: (day: number) => void
  calculateMacros: (
    weightKg: number,
    bodyFat: number,
    goal: Goal,
    activityLevel: ActivityLevel,
    dietType: DietType,
    sex?: Sex,
    targetWeightKg?: number | null,
    weightLossPace?: WeightLossPace | null
  ) => { calories: number; macros: UserProfile['macros']; calorieFloorApplied: boolean }
  generateMealPlan: () => Promise<void>
  swapMeal: (dayIndex: number, mealIndex: number, newMeal: Meal) => void
  swapCandidates: SwapCandidate[]
  setSwapCandidates: (candidates: SwapCandidate[]) => void
  clearSwapCandidates: () => void
}

const PROFILE_VERSION = 2

const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'moderate'
const DEFAULT_DIET_TYPE: DietType = 'balanced'
const DEFAULT_MEALS_PER_DAY = 3
const DEFAULT_SEX: Sex = 'male'
const DEFAULT_RECIPE_UNIT_SYSTEM: RecipeUnitSystem = 'metric'
const DEFAULT_LANGUAGE: Language = 'en'

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const ensureIsoDate = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

const ensureGoal = (value: unknown): Goal =>
  value === 'lose-fat' || value === 'gain-muscle' || value === 'recomposition' ? value : 'recomposition'

const ensureDietType = (value: unknown): DietType =>
  value === 'keto' || value === 'high-protein' || value === 'balanced' || value === 'intermittent-fasting'
    ? value
    : DEFAULT_DIET_TYPE

const ensureActivityLevel = (value: unknown): ActivityLevel =>
  value === 'sedentary' || value === 'light' || value === 'moderate' || value === 'active' || value === 'very-active'
    ? value
    : DEFAULT_ACTIVITY_LEVEL

const ensureUnit = (value: unknown): 'kg' | 'lbs' => (value === 'lbs' ? 'lbs' : 'kg')
const ensureSex = (value: unknown): Sex => (value === 'female' ? 'female' : DEFAULT_SEX)
const ensureRecipeUnitSystem = (value: unknown): RecipeUnitSystem =>
  value === 'imperial' ? 'imperial' : DEFAULT_RECIPE_UNIT_SYSTEM
const ensureLanguage = (value: unknown): Language => (value === 'ko' ? 'ko' : DEFAULT_LANGUAGE)

const CUISINE_IDS = new Set<CuisinePreference>([
  'western',
  'korean',
  'japanese',
  'chinese',
  'mediterranean',
  'asian-fusion',
])

export const CUISINE_OPTIONS: { id: CuisinePreference; title: string; hint: string }[] = [
  { id: 'western', title: '🌍 Western', hint: 'bread, pasta, chicken, beef' },
  { id: 'korean', title: '🇰🇷 Korean', hint: 'rice, kimchi, tofu, pork, seafood' },
  { id: 'japanese', title: '🇯🇵 Japanese', hint: 'rice, fish, miso, tofu, noodles' },
  { id: 'chinese', title: '🇨🇳 Chinese', hint: 'rice, noodles, pork, vegetables' },
  { id: 'mediterranean', title: '🫒 Mediterranean', hint: 'olive oil, fish, legumes, grains' },
  { id: 'asian-fusion', title: '🌏 Asian Fusion', hint: 'mix of Asian ingredients' },
]

function ensureCuisinePreference(value: unknown): CuisinePreference[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is CuisinePreference => typeof item === 'string' && CUISINE_IDS.has(item as CuisinePreference))
}

function ensureWeightLossPace(value: unknown): WeightLossPace | undefined {
  if (value === 'steady' || value === 'moderate' || value === 'aggressive') return value
  return undefined
}

function ensureBodyType(value: unknown): BodyType | undefined {
  if (value === 'slim' || value === 'average' || value === 'athletic' || value === 'heavy') return value
  return undefined
}

function normalizeUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const profile = raw as Partial<UserProfile> & { bodyFatPercentage?: number }
  const now = new Date().toISOString()
  const dailyCalories = toNumber(profile.dailyCalories, 0)

  return {
    profileName: typeof profile.profileName === 'string' ? profile.profileName : '',
    sex: ensureSex(profile.sex),
    unitSystem: ensureRecipeUnitSystem(profile.unitSystem),
    language: ensureLanguage(profile.language),
    targetWeight:
      profile.targetWeight !== undefined && profile.targetWeight !== null && Number.isFinite(Number(profile.targetWeight))
        ? toNumber(profile.targetWeight, 0)
        : undefined,
    weightLossPace: ensureWeightLossPace(profile.weightLossPace),
    bodyType: ensureBodyType(profile.bodyType),
    cuisinePreference: ensureCuisinePreference(profile.cuisinePreference),
    usedQuickEstimate: profile.usedQuickEstimate === true ? true : undefined,
    weight: toNumber(profile.weight, 0),
    bodyFat: toNumber(profile.bodyFat ?? profile.bodyFatPercentage, 0),
    muscleMass: toNumber(profile.muscleMass, 0),
    unit: ensureUnit(profile.unit),
    activityLevel: ensureActivityLevel(profile.activityLevel),
    goal: ensureGoal(profile.goal),
    dietType: ensureDietType(profile.dietType),
    mealsPerDay: Math.max(1, Math.floor(toNumber(profile.mealsPerDay, DEFAULT_MEALS_PER_DAY))),
    selectedIngredients: Array.isArray(profile.selectedIngredients)
      ? profile.selectedIngredients.filter((item): item is string => typeof item === 'string')
      : [],
    dailyCalories,
    macros: {
      protein: toNumber(profile.macros?.protein, 0),
      carbs: toNumber(profile.macros?.carbs, 0),
      fat: toNumber(profile.macros?.fat, 0),
      minerals: toNumber(profile.macros?.minerals, 0),
    },
    createdAt: ensureIsoDate(profile.createdAt, now),
    lastUpdatedAt: ensureIsoDate(profile.lastUpdatedAt, now),
  }
}

// Sample meal database
const mealDatabase: Record<DietType, Meal[]> = {
  'keto': [
    { id: '1', name: 'Avocado Egg Scramble', calories: 420, protein: 22, carbs: 8, fat: 35, ingredients: [{ name: 'Eggs', amount: '3 large', category: 'protein' }, { name: 'Avocado', amount: '1/2', category: 'fats' }, { name: 'Butter', amount: '1 tbsp', category: 'fats' }, { name: 'Spinach', amount: '1 cup', category: 'vegetables' }], instructions: ['Melt butter in a non-stick pan over medium heat.', 'Crack eggs into the pan and scramble gently for 2-3 minutes.', 'Add spinach and cook until wilted.', 'Top with sliced avocado and season with salt and pepper.'], prepTime: 5, cookTime: 8 },
    { id: '2', name: 'Grilled Salmon with Asparagus', calories: 480, protein: 42, carbs: 6, fat: 32, ingredients: [{ name: 'Salmon fillet', amount: '6 oz', category: 'protein' }, { name: 'Asparagus', amount: '8 spears', category: 'vegetables' }, { name: 'Olive oil', amount: '2 tbsp', category: 'fats' }, { name: 'Lemon', amount: '1/2', category: 'fruits' }], instructions: ['Preheat grill or grill pan to medium-high heat.', 'Brush salmon and asparagus with olive oil, season with salt and pepper.', 'Grill salmon for 4-5 minutes per side until cooked through.', 'Grill asparagus for 3-4 minutes, turning occasionally.', 'Squeeze fresh lemon over salmon before serving.'], prepTime: 10, cookTime: 12 },
    { id: '3', name: 'Beef Stir Fry', calories: 520, protein: 38, carbs: 10, fat: 38, ingredients: [{ name: 'Beef strips', amount: '5 oz', category: 'protein' }, { name: 'Broccoli', amount: '1 cup', category: 'vegetables' }, { name: 'Bell peppers', amount: '1/2 cup', category: 'vegetables' }, { name: 'Coconut oil', amount: '2 tbsp', category: 'fats' }], instructions: ['Heat coconut oil in a wok or large skillet over high heat.', 'Add beef strips and stir-fry for 2-3 minutes until browned.', 'Add broccoli and bell peppers, stir-fry for 4-5 minutes.', 'Season with salt and pepper, serve immediately.'], prepTime: 10, cookTime: 8 },
    { id: '4', name: 'Chicken Caesar Salad', calories: 390, protein: 35, carbs: 8, fat: 25, ingredients: [{ name: 'Chicken breast', amount: '5 oz', category: 'protein' }, { name: 'Romaine lettuce', amount: '2 cups', category: 'vegetables' }, { name: 'Parmesan', amount: '2 tbsp', category: 'dairy' }, { name: 'Caesar dressing', amount: '2 tbsp', category: 'fats' }], instructions: ['Season chicken breast with salt and pepper.', 'Grill or pan-fry chicken for 6-7 minutes per side until cooked.', 'Let chicken rest for 3 minutes, then slice.', 'Toss romaine with Caesar dressing in a large bowl.', 'Top with sliced chicken and shaved parmesan.'], prepTime: 10, cookTime: 15 },
    { id: '5', name: 'Bacon Wrapped Chicken', calories: 450, protein: 40, carbs: 2, fat: 32, ingredients: [{ name: 'Chicken thigh', amount: '5 oz', category: 'protein' }, { name: 'Bacon', amount: '3 strips', category: 'protein' }, { name: 'Garlic', amount: '2 cloves', category: 'spices' }], instructions: ['Preheat oven to 400F (200C).', 'Season chicken thigh with minced garlic, salt, and pepper.', 'Wrap bacon strips around the chicken thigh.', 'Place on a baking sheet and bake for 25-30 minutes until bacon is crispy.'], prepTime: 10, cookTime: 30 },
  ],
  'high-protein': [
    { id: '6', name: 'Greek Yogurt Power Bowl', calories: 380, protein: 35, carbs: 40, fat: 8, ingredients: [{ name: 'Greek yogurt', amount: '1 cup', category: 'dairy' }, { name: 'Protein powder', amount: '1 scoop', category: 'protein' }, { name: 'Berries', amount: '1/2 cup', category: 'fruits' }, { name: 'Granola', amount: '1/4 cup', category: 'carbs' }], instructions: ['Add Greek yogurt to a bowl.', 'Mix in protein powder until smooth.', 'Top with fresh berries and granola.', 'Drizzle with honey if desired.'], prepTime: 5, cookTime: 0 },
    { id: '7', name: 'Grilled Chicken Breast', calories: 350, protein: 45, carbs: 20, fat: 10, ingredients: [{ name: 'Chicken breast', amount: '8 oz', category: 'protein' }, { name: 'Brown rice', amount: '1/2 cup', category: 'carbs' }, { name: 'Steamed broccoli', amount: '1 cup', category: 'vegetables' }], instructions: ['Cook brown rice according to package directions.', 'Season chicken breast with salt, pepper, and garlic powder.', 'Grill chicken for 6-7 minutes per side until internal temp reaches 165F.', 'Steam broccoli for 4-5 minutes until tender-crisp.', 'Plate chicken over rice with broccoli on the side.'], prepTime: 10, cookTime: 25 },
    { id: '8', name: 'Tuna Steak with Quinoa', calories: 420, protein: 48, carbs: 28, fat: 12, ingredients: [{ name: 'Tuna steak', amount: '6 oz', category: 'protein' }, { name: 'Quinoa', amount: '1/2 cup', category: 'carbs' }, { name: 'Mixed greens', amount: '1 cup', category: 'vegetables' }, { name: 'Olive oil', amount: '1 tbsp', category: 'fats' }], instructions: ['Cook quinoa according to package directions.', 'Brush tuna steak with olive oil, season with salt and pepper.', 'Sear tuna in a hot pan for 2 minutes per side for medium-rare.', 'Let tuna rest for 2 minutes, then slice.', 'Serve over quinoa with mixed greens.'], prepTime: 10, cookTime: 20 },
    { id: '9', name: 'Egg White Omelette', calories: 280, protein: 32, carbs: 12, fat: 10, ingredients: [{ name: 'Egg whites', amount: '6 large', category: 'protein' }, { name: 'Turkey breast', amount: '2 oz', category: 'protein' }, { name: 'Spinach', amount: '1 cup', category: 'vegetables' }, { name: 'Feta cheese', amount: '1 oz', category: 'dairy' }], instructions: ['Whisk egg whites with a pinch of salt.', 'Heat a non-stick pan over medium heat and add egg whites.', 'When edges set, add turkey, spinach, and feta to one half.', 'Fold omelette over and cook for 1-2 more minutes.'], prepTime: 5, cookTime: 8 },
    { id: '10', name: 'Lean Beef Burger', calories: 450, protein: 42, carbs: 30, fat: 18, ingredients: [{ name: 'Lean ground beef', amount: '6 oz', category: 'protein' }, { name: 'Whole wheat bun', amount: '1', category: 'carbs' }, { name: 'Lettuce', amount: '2 leaves', category: 'vegetables' }, { name: 'Tomato', amount: '2 slices', category: 'vegetables' }], instructions: ['Form ground beef into a patty, season with salt and pepper.', 'Grill or pan-fry patty for 4-5 minutes per side for medium.', 'Toast the whole wheat bun lightly.', 'Assemble burger with lettuce and tomato slices.'], prepTime: 10, cookTime: 12 },
  ],
  'balanced': [
    { id: '11', name: 'Overnight Oats', calories: 350, protein: 15, carbs: 52, fat: 10, ingredients: [{ name: 'Rolled oats', amount: '1/2 cup', category: 'carbs' }, { name: 'Almond milk', amount: '1 cup', category: 'dairy' }, { name: 'Chia seeds', amount: '1 tbsp', category: 'fats' }, { name: 'Banana', amount: '1/2', category: 'fruits' }, { name: 'Honey', amount: '1 tbsp', category: 'carbs' }], instructions: ['Combine oats, almond milk, and chia seeds in a jar.', 'Stir well and refrigerate overnight (or at least 4 hours).', 'In the morning, top with sliced banana.', 'Drizzle with honey and enjoy cold or warmed.'], prepTime: 5, cookTime: 0 },
    { id: '12', name: 'Mediterranean Chicken Bowl', calories: 480, protein: 35, carbs: 42, fat: 18, ingredients: [{ name: 'Chicken breast', amount: '5 oz', category: 'protein' }, { name: 'Couscous', amount: '1/2 cup', category: 'carbs' }, { name: 'Cucumber', amount: '1/4 cup', category: 'vegetables' }, { name: 'Tomatoes', amount: '1/4 cup', category: 'vegetables' }, { name: 'Feta', amount: '1 oz', category: 'dairy' }], instructions: ['Cook couscous according to package directions.', 'Season and grill chicken for 6-7 minutes per side.', 'Dice cucumber and tomatoes for the salad.', 'Slice chicken and arrange over couscous.', 'Top with vegetables and crumbled feta.'], prepTime: 15, cookTime: 20 },
    { id: '13', name: 'Salmon Rice Bowl', calories: 520, protein: 32, carbs: 48, fat: 22, ingredients: [{ name: 'Salmon', amount: '5 oz', category: 'protein' }, { name: 'White rice', amount: '3/4 cup', category: 'carbs' }, { name: 'Edamame', amount: '1/4 cup', category: 'vegetables' }, { name: 'Avocado', amount: '1/4', category: 'fats' }], instructions: ['Cook rice according to package directions.', 'Season salmon with salt and pepper, pan-sear for 4 minutes per side.', 'Cook edamame in boiling water for 3-4 minutes.', 'Assemble bowl with rice, flaked salmon, edamame, and sliced avocado.'], prepTime: 10, cookTime: 20 },
    { id: '14', name: 'Turkey Wrap', calories: 380, protein: 28, carbs: 38, fat: 14, ingredients: [{ name: 'Turkey slices', amount: '4 oz', category: 'protein' }, { name: 'Whole wheat wrap', amount: '1 large', category: 'carbs' }, { name: 'Hummus', amount: '2 tbsp', category: 'fats' }, { name: 'Mixed greens', amount: '1 cup', category: 'vegetables' }], instructions: ['Lay the whole wheat wrap flat on a clean surface.', 'Spread hummus evenly across the wrap.', 'Layer turkey slices and mixed greens on top.', 'Roll tightly, tucking in the sides as you go.', 'Slice in half diagonally and serve.'], prepTime: 5, cookTime: 0 },
    { id: '15', name: 'Vegetable Stir Fry with Tofu', calories: 400, protein: 22, carbs: 45, fat: 16, ingredients: [{ name: 'Firm tofu', amount: '5 oz', category: 'protein' }, { name: 'Brown rice', amount: '1/2 cup', category: 'carbs' }, { name: 'Mixed vegetables', amount: '2 cups', category: 'vegetables' }, { name: 'Soy sauce', amount: '2 tbsp', category: 'spices' }], instructions: ['Press tofu for 15 minutes, then cube.', 'Cook brown rice according to package directions.', 'Stir-fry tofu in a hot pan until golden, about 5 minutes.', 'Add vegetables and soy sauce, cook for 5-6 minutes.', 'Serve over brown rice.'], prepTime: 20, cookTime: 25 },
  ],
  'intermittent-fasting': [
    { id: '16', name: 'Hearty Brunch Bowl', calories: 650, protein: 40, carbs: 55, fat: 30, ingredients: [{ name: 'Eggs', amount: '3 large', category: 'protein' }, { name: 'Sweet potato', amount: '1 medium', category: 'carbs' }, { name: 'Bacon', amount: '2 strips', category: 'protein' }, { name: 'Avocado', amount: '1/2', category: 'fats' }, { name: 'Spinach', amount: '1 cup', category: 'vegetables' }], instructions: ['Dice sweet potato and roast at 400F for 25 minutes.', 'Cook bacon in a pan until crispy, set aside.', 'Fry eggs sunny-side up in the bacon fat.', 'Wilt spinach in the same pan for 1-2 minutes.', 'Assemble bowl with all components and sliced avocado.'], prepTime: 10, cookTime: 30 },
    { id: '17', name: 'Loaded Salmon Plate', calories: 720, protein: 48, carbs: 50, fat: 35, ingredients: [{ name: 'Salmon', amount: '8 oz', category: 'protein' }, { name: 'Quinoa', amount: '1 cup', category: 'carbs' }, { name: 'Roasted vegetables', amount: '1.5 cups', category: 'vegetables' }, { name: 'Tahini', amount: '2 tbsp', category: 'fats' }], instructions: ['Cook quinoa according to package directions.', 'Season salmon with salt, pepper, and lemon zest.', 'Bake salmon at 400F for 12-15 minutes.', 'Roast vegetables at the same temperature for 20 minutes.', 'Plate quinoa, top with salmon and vegetables, drizzle with tahini.'], prepTime: 15, cookTime: 25 },
    { id: '18', name: 'Protein Power Dinner', calories: 680, protein: 55, carbs: 45, fat: 28, ingredients: [{ name: 'Ribeye steak', amount: '8 oz', category: 'protein' }, { name: 'Baked potato', amount: '1 medium', category: 'carbs' }, { name: 'Grilled asparagus', amount: '8 spears', category: 'vegetables' }, { name: 'Butter', amount: '1 tbsp', category: 'fats' }], instructions: ['Preheat oven to 400F. Pierce potato and bake for 45-50 minutes.', 'Let steak come to room temperature, season generously.', 'Sear steak in a hot cast iron pan for 4 minutes per side.', 'Rest steak for 5 minutes before slicing.', 'Grill asparagus with butter and serve alongside.'], prepTime: 10, cookTime: 50 },
    { id: '19', name: 'Mediterranean Feast', calories: 600, protein: 35, carbs: 58, fat: 25, ingredients: [{ name: 'Grilled chicken', amount: '6 oz', category: 'protein' }, { name: 'Pita bread', amount: '2', category: 'carbs' }, { name: 'Greek salad', amount: '2 cups', category: 'vegetables' }, { name: 'Tzatziki', amount: '3 tbsp', category: 'dairy' }], instructions: ['Marinate chicken in olive oil, lemon, and oregano for 30 minutes.', 'Grill chicken for 6-7 minutes per side.', 'Prepare Greek salad with cucumber, tomato, olives, and feta.', 'Warm pita bread on the grill for 30 seconds per side.', 'Serve chicken with pita, salad, and tzatziki on the side.'], prepTime: 35, cookTime: 15 },
    { id: '20', name: 'Asian Fusion Bowl', calories: 640, protein: 38, carbs: 65, fat: 24, ingredients: [{ name: 'Teriyaki chicken', amount: '6 oz', category: 'protein' }, { name: 'Jasmine rice', amount: '1 cup', category: 'carbs' }, { name: 'Stir fry vegetables', amount: '1.5 cups', category: 'vegetables' }, { name: 'Sesame oil', amount: '1 tbsp', category: 'fats' }], instructions: ['Cook jasmine rice according to package directions.', 'Cut chicken into strips and cook in sesame oil for 5 minutes.', 'Add teriyaki sauce and cook until caramelized.', 'Stir fry vegetables in the same pan for 4-5 minutes.', 'Assemble bowl with rice, chicken, and vegetables.'], prepTime: 15, cookTime: 20 },
  ],
}

function apiFirstNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""))
    if (Number.isFinite(n)) return n
  }
  return 0
}

function apiNormalizeIngredientsList(meal: any): any[] {
  if (Array.isArray(meal?.ingredients)) return meal.ingredients
  if (Array.isArray(meal?.ingredientList)) return meal.ingredientList
  if (typeof meal?.ingredients === "string") {
    return meal.ingredients.split(",").map((s: string) => ({
      name: s.trim(),
      amount: "",
      category: "",
    }))
  }
  return []
}

function extractRecipeFromApiMeal(meal: any): { prepTime: number; cookTime: number; instructions: string[] } {
  const r = meal?.recipe ?? {}
  const prepTime = Math.round(apiFirstNumber(r.prepTime, r.prep_time, meal?.prepTime))
  const cookTime = Math.round(apiFirstNumber(r.cookTime, r.cook_time, meal?.cookTime))
  let instructions: string[] = []
  if (Array.isArray(r.instructions)) {
    instructions = r.instructions.map((s: unknown) => String(s))
  } else if (Array.isArray(meal?.instructions)) {
    instructions = meal.instructions.map((s: unknown) => String(s))
  } else if (typeof r.instructions === "string") {
    instructions = [r.instructions]
  } else if (typeof meal?.instructions === "string") {
    instructions = [meal.instructions]
  }
  return { prepTime, cookTime, instructions }
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      appPrefs: { language: DEFAULT_LANGUAGE, unitSystem: DEFAULT_RECIPE_UNIT_SYSTEM, darkMode: false },
      setAppPrefs: (patch) => set((state) => ({ appPrefs: { ...state.appPrefs, ...patch } })),
      currentStep: 0,
      setCurrentStep: (step) => set({ currentStep: step }),
      userProfile: null,
      setUserProfile: (profile) =>
        set({
          userProfile: normalizeUserProfile({
            ...profile,
            lastUpdatedAt: new Date().toISOString(),
          }),
        }),
      setUnitSystem: (unitSystem) =>
        set((state) => {
          if (!state.userProfile) return state
          return {
            userProfile: normalizeUserProfile({
              ...state.userProfile,
              unitSystem,
              lastUpdatedAt: new Date().toISOString(),
            }),
          }
        }),
      clearAllData: () =>
        set({
          currentStep: 0,
          userProfile: null,
          mealPlanConfig: null,
          weekPlan: [],
          mealPlanValidation: { isValid: true, errors: [], warnings: [] },
          isGeneratingMealPlan: false,
          selectedDay: 0,
        }),
      mealPlanConfig: null,
      setMealPlanConfig: (config) => set({ mealPlanConfig: config }),
      weekPlan: [],
      setWeekPlan: (plan) => set({ weekPlan: plan }),
      swapMeal: (dayIndex, mealIndex, newMeal) =>
        set((state) => {
          const weekPlan = state.weekPlan.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day
            const meals = day.meals.map((meal, mIdx) => (mIdx === mealIndex ? newMeal : meal))
            return {
              ...day,
              meals,
              totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
              totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
              totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
              totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
            }
          })
          return { weekPlan }
        }),
      swapCandidates: [],
      setSwapCandidates: (candidates) => set({ swapCandidates: candidates }),
      clearSwapCandidates: () => set({ swapCandidates: [] }),
      mealPlanValidation: { isValid: true, errors: [], warnings: [] },
      isGeneratingMealPlan: false,
      selectedDay: 0,
      setSelectedDay: (day) => set({ selectedDay: day }),
      
      calculateMacros: (
        weightKg,
        bodyFat,
        goal,
        activityLevel,
        dietType,
        sex = DEFAULT_SEX,
        targetWeightKg = null,
        weightLossPace = null
      ) => {
        const calculatedLbm = getLbmKgForNutrition(weightKg, bodyFat)
        const proteinMultiplier = proteinGPerKgLbm(goal, dietType)
        const result = calculateNutritionTargets({
          weightKg,
          bodyFat,
          goal,
          activityLevel,
          dietType,
          sex,
          targetWeightKg: targetWeightKg ?? undefined,
          weightLossPace: weightLossPace ?? undefined,
        })
        console.log('[meal-store] calculateMacros', {
          weightKg,
          bodyFat,
          calculatedLbmKg: calculatedLbm,
          goal,
          dietType,
          proteinMultiplierGPerKgLbm: proteinMultiplier,
          finalProteinGrams: result.macros.protein,
        })
        return result
      },
      
      generateMealPlan: async () => {
        const { mealPlanConfig, userProfile } = get()
        if (!mealPlanConfig || !userProfile) return
        set({ isGeneratingMealPlan: true })
        try {

        const payload = {
          unitSystem: userProfile.unitSystem ?? DEFAULT_RECIPE_UNIT_SYSTEM,
          language: userProfile.language ?? DEFAULT_LANGUAGE,
          cuisinePreference: userProfile.cuisinePreference ?? [],
          weight: userProfile.weight,
          bodyFat: userProfile.bodyFat,
          muscleMass: userProfile.muscleMass,
          unit: userProfile.unit,
          goal: userProfile.goal,
          dietType: mealPlanConfig.dietType,
          activityLevel: userProfile.activityLevel,
          mealsPerDay: mealPlanConfig.mealsPerDay,
          dailyCalories: userProfile.dailyCalories,
          macros: userProfile.macros,
          selectedIngredients: userProfile.selectedIngredients,
        }

        let data: unknown
        try {
          const res = await fetch("/api/generate-meal-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            cache: "no-store",
          })

          if (!res.ok) {
            set({
              weekPlan: [],
              mealPlanValidation: {
                isValid: false,
                errors: ["We couldn’t generate a plan that time. Try again in a moment."],
                warnings: [],
              },
            })
            return
          }

          data = (await res.json()) as unknown
          console.log("[meal-store] Received from /api/generate-meal-plan:", JSON.stringify(data, null, 2))
          const parsedPlan = data as { days?: { meals?: unknown[] }[] }
          if (parsedPlan?.days?.[0]?.meals?.[0]) {
            console.log(
              "First meal:",
              JSON.stringify(parsedPlan.days[0].meals[0], null, 2)
            )
          }
        } catch (err) {
          set({
            weekPlan: [],
            mealPlanValidation: {
              isValid: false,
              errors: ["Connection hiccup—check your network and try generating again."],
              warnings: [],
            },
          })
          return
        }

        // Map Claude JSON -> internal DayPlan/Meal structures.
        const mappedPlan: DayPlan[] = (data as any)?.days?.map((day: any, dayIdx: number) => {
          const dayName = typeof day?.day === "string" ? day.day : days[dayIdx] ?? "Monday"
          const dayMeals: Meal[] = Array.isArray(day?.meals)
            ? day.meals.map((meal: any, mealIdx: number) => {
                const safeLower = (s: string) => s.toLowerCase()
                const macros = meal?.macros ?? meal?.macro ?? {}
                const nutrition = meal?.nutrition ?? {}
                const rawIngredients = apiNormalizeIngredientsList(meal)
                const categoryRaw = safeLower(String(rawIngredients[0]?.category ?? ""))
                const mapCategory = (cat: unknown): Ingredient["category"] => {
                  const c = safeLower(String(cat ?? ""))
                  if (c.includes("protein")) return "protein"
                  if (c.includes("carb")) return "carbs"
                  if (c.includes("fat")) return "fats"
                  if (c.includes("veget")) return "vegetables"
                  if (c.includes("dairy")) return "dairy"
                  if (c.includes("fruit")) return "fruits"
                  if (c.includes("spice")) return "spices"
                  return categoryRaw ? "protein" : "protein"
                }

                const ingredients: Ingredient[] = rawIngredients.map((ing: any) => ({
                  name: String(ing?.name ?? ing?.item ?? ing?.ingredient ?? "").trim(),
                  amount: String(ing?.amount ?? ing?.quantity ?? ing?.qty ?? "").trim(),
                  category: mapCategory(ing?.category),
                }))

                const { prepTime, cookTime, instructions } = extractRecipeFromApiMeal(meal)

                return {
                  id: `${dayName}-${mealIdx}`,
                  name: String(meal?.name ?? ""),
                  calories: Math.round(
                    apiFirstNumber(meal?.calories, macros.calories, nutrition.calories)
                  ),
                  protein: Math.round(
                    apiFirstNumber(meal?.protein, macros.protein, nutrition.protein)
                  ),
                  carbs: Math.round(apiFirstNumber(meal?.carbs, macros.carbs, nutrition.carbs)),
                  fat: Math.round(apiFirstNumber(meal?.fat, macros.fat, nutrition.fat)),
                  ingredients,
                  instructions,
                  prepTime,
                  cookTime,
                }
              })
            : []

          return {
            day: dayName,
            meals: dayMeals,
            totalCalories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
            totalProtein: dayMeals.reduce((sum, m) => sum + m.protein, 0),
            totalCarbs: dayMeals.reduce((sum, m) => sum + m.carbs, 0),
            totalFat: dayMeals.reduce((sum, m) => sum + m.fat, 0),
          }
        })

        if (mappedPlan[0]?.meals?.[0]) {
          console.log(
            "[meal-store] First meal after internal mapping:",
            JSON.stringify(mappedPlan[0].meals[0], null, 2)
          )
        }

        const validation = validateMealPlan({
          plan: mappedPlan,
          selectedIngredients: userProfile.selectedIngredients ?? [],
          avoidedIngredients: [],
          dailyCalorieTarget: userProfile.dailyCalories,
          dailyProteinTarget: userProfile.macros.protein,
          rawClaudeResponse: data,
        })

        if (!validation.isValid) {
          set({ weekPlan: [], mealPlanValidation: validation })
          return
        }

        set({ weekPlan: mappedPlan, mealPlanValidation: validation })
        } finally {
          set({ isGeneratingMealPlan: false })
        }
      },
    }),
    {
      name: 'meal-plan-storage',
      version: PROFILE_VERSION,
      migrate: (persistedState) => {
        const state = persistedState as Partial<MealStore> | undefined
        if (!state) return state as MealStore
        return {
          ...state,
          userProfile: normalizeUserProfile(state.userProfile),
        } as MealStore
      },
      partialize: (state) => ({
        appPrefs: state.appPrefs,
        userProfile: state.userProfile,
        weekPlan: state.weekPlan,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const normalized = normalizeUserProfile(state.userProfile)
        if (!normalized) {
          state.setCurrentStep(0)
          return
        }

        state.setUserProfile(normalized)
        state.setMealPlanConfig({
          dietType: normalized.dietType,
          mealsPerDay: normalized.mealsPerDay,
        })
        const hasPlan = Array.isArray(state.weekPlan) && state.weekPlan.length > 0
        state.setCurrentStep(hasPlan ? 2 : 1)
      },
    }
  )
)
