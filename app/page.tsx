"use client"

import { useMealStore } from "@/lib/meal-store"
import { Onboarding } from "@/components/onboarding"
import { MealPlanConfig } from "@/components/meal-plan-config"
import { DailyView } from "@/components/daily-view"
import { GroceryList } from "@/components/grocery-list"

export default function MealPlanApp() {
  const { currentStep } = useMealStore()

  return (
    <main className="min-h-screen">
      {currentStep === 0 && <Onboarding />}
      {currentStep === 1 && <MealPlanConfig />}
      {currentStep === 2 && <DailyView />}
      {currentStep === 3 && <GroceryList />}
    </main>
  )
}
