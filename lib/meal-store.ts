import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateNutritionTargets } from '@/lib/nutrition'

export type Goal = 'lose-fat' | 'gain-muscle' | 'recomposition'
export type DietType = 'keto' | 'high-protein' | 'balanced' | 'intermittent-fasting'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'

export interface UserProfile {
  profileName?: string
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

interface MealStore {
  currentStep: number
  setCurrentStep: (step: number) => void
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile) => void
  mealPlanConfig: MealPlanConfig | null
  setMealPlanConfig: (config: MealPlanConfig) => void
  weekPlan: DayPlan[]
  setWeekPlan: (plan: DayPlan[]) => void
  selectedDay: number
  setSelectedDay: (day: number) => void
  calculateMacros: (
    weightKg: number,
    bodyFat: number,
    goal: Goal,
    activityLevel: ActivityLevel,
    dietType: DietType
  ) => { calories: number; macros: UserProfile['macros'] }
  generateMealPlan: () => void
}

const PROFILE_VERSION = 2

const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'moderate'
const DEFAULT_DIET_TYPE: DietType = 'balanced'
const DEFAULT_MEALS_PER_DAY = 3

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

function normalizeUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const profile = raw as Partial<UserProfile> & { bodyFatPercentage?: number }
  const now = new Date().toISOString()
  const dailyCalories = toNumber(profile.dailyCalories, 0)

  return {
    profileName: typeof profile.profileName === 'string' ? profile.profileName : '',
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

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
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
      mealPlanConfig: null,
      setMealPlanConfig: (config) => set({ mealPlanConfig: config }),
      weekPlan: [],
      setWeekPlan: (plan) => set({ weekPlan: plan }),
      selectedDay: 0,
      setSelectedDay: (day) => set({ selectedDay: day }),
      
      calculateMacros: (weightKg, bodyFat, goal, activityLevel, dietType) =>
        calculateNutritionTargets({
          weightKg,
          bodyFat,
          goal,
          activityLevel,
          dietType,
        }),
      
      generateMealPlan: () => {
        const { mealPlanConfig, userProfile } = get()
        if (!mealPlanConfig || !userProfile) return
        
        const meals = mealDatabase[mealPlanConfig.dietType]
        const plan: DayPlan[] = days.map((day) => {
          const dayMeals: Meal[] = []
          const targetCaloriesPerMeal = userProfile.dailyCalories / mealPlanConfig.mealsPerDay
          
          for (let i = 0; i < mealPlanConfig.mealsPerDay; i++) {
            // Select a random meal and adjust portions
            const randomMeal = { ...meals[Math.floor(Math.random() * meals.length)] }
            const scaleFactor = targetCaloriesPerMeal / randomMeal.calories
            
            dayMeals.push({
              ...randomMeal,
              id: `${day}-${i}`,
              calories: Math.round(randomMeal.calories * scaleFactor),
              protein: Math.round(randomMeal.protein * scaleFactor),
              carbs: Math.round(randomMeal.carbs * scaleFactor),
              fat: Math.round(randomMeal.fat * scaleFactor),
            })
          }
          
          return {
            day,
            meals: dayMeals,
            totalCalories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
            totalProtein: dayMeals.reduce((sum, m) => sum + m.protein, 0),
            totalCarbs: dayMeals.reduce((sum, m) => sum + m.carbs, 0),
            totalFat: dayMeals.reduce((sum, m) => sum + m.fat, 0),
          }
        })
        
        set({ weekPlan: plan })
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
        userProfile: state.userProfile,
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
        state.generateMealPlan()
        state.setCurrentStep(2)
      },
    }
  )
)
