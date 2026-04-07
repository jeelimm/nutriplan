"use client"

import { useMealStore } from "@/lib/meal-store"
import { Onboarding } from "@/components/onboarding"
import { MealPlanConfig } from "@/components/meal-plan-config"
import { DailyView } from "@/components/daily-view"
import { GroceryList } from "@/components/grocery-list"
import { SettingsScreen } from "@/components/settings-screen"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function MealPlanApp() {
  const { currentStep, userProfile, setCurrentStep } = useMealStore()
  const showSettingsFab = userProfile && currentStep !== 0 && currentStep !== 4

  return (
    <main className="min-h-screen">
      {currentStep === 0 && <Onboarding />}
      {currentStep === 1 && <MealPlanConfig />}
      {currentStep === 2 && <DailyView />}
      {currentStep === 3 && <GroceryList />}
      {currentStep === 4 && <SettingsScreen />}
      {showSettingsFab && (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-4 z-50 h-12 w-12 rounded-full shadow-lg md:right-8"
          onClick={() => setCurrentStep(4)}
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}
    </main>
  )
}
