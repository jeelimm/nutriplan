"use client"

import { useEffect } from "react"
import { useMealStore } from "@/lib/meal-store"
import { Onboarding } from "@/components/onboarding"
import { MealPlanConfig } from "@/components/meal-plan-config"
import { DailyView } from "@/components/daily-view"
import { GroceryList } from "@/components/grocery-list"
import { SettingsScreen } from "@/components/settings-screen"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function MealPlanApp() {
  const { appPrefs, currentStep, userProfile, setCurrentStep } = useMealStore()
  const showSettingsFab = currentStep !== 4

  useEffect(() => {
    document.documentElement.classList.toggle("dark", appPrefs.darkMode)
  }, [appPrefs.darkMode])

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden">
      <div className={currentStep === 0 ? "block" : "hidden"}>
        <Onboarding />
      </div>
      <div className={currentStep === 1 ? "block" : "hidden"}>
        <MealPlanConfig />
      </div>
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
