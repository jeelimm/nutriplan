"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMealStore, type ActivityLevel, type DietType, type Goal } from "@/lib/meal-store"
import { ChevronLeft, Settings } from "lucide-react"

const activityLevels: { id: ActivityLevel; label: string }[] = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Light activity" },
  { id: "moderate", label: "Moderate" },
  { id: "very-active", label: "Very active" },
]

const goals: { id: Goal; label: string }[] = [
  { id: "lose-fat", label: "Lose Fat" },
  { id: "gain-muscle", label: "Gain Muscle" },
  { id: "recomposition", label: "Lean Recomposition" },
]

const dietTypes: { id: DietType; label: string }[] = [
  { id: "keto", label: "Keto" },
  { id: "high-protein", label: "High Protein" },
  { id: "balanced", label: "Balanced" },
  { id: "intermittent-fasting", label: "IF" },
]

export function SettingsScreen() {
  const {
    userProfile,
    setUserProfile,
    setMealPlanConfig,
    setCurrentStep,
    generateMealPlan,
    clearAllData,
  } = useMealStore()

  if (!userProfile) return null

  const updateProfile = (patch: Partial<typeof userProfile>) => {
    setUserProfile({
      ...userProfile,
      ...patch,
    })
  }

  const handleRegenerate = async () => {
    setMealPlanConfig({ dietType: userProfile.dietType, mealsPerDay: userProfile.mealsPerDay })
    await generateMealPlan()
    setCurrentStep(2)
  }

  const handleClearAll = () => {
    if (!window.confirm("Clear all saved data? This cannot be undone.")) return
    clearAllData()
    window.localStorage.removeItem("meal-plan-storage")
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setCurrentStep(2)}>
              Edit body stats
            </Button>
            <div className="grid grid-cols-3 gap-2">
              {goals.map((item) => (
                <Button key={item.id} variant={userProfile.goal === item.id ? "default" : "outline"} onClick={() => updateProfile({ goal: item.id })}>
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {activityLevels.map((item) => (
                <Button key={item.id} variant={userProfile.activityLevel === item.id ? "default" : "outline"} onClick={() => updateProfile({ activityLevel: item.id })}>
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant={userProfile.unitSystem === "metric" ? "default" : "outline"} onClick={() => updateProfile({ unitSystem: "metric" })}>
                Metric
              </Button>
              <Button variant={userProfile.unitSystem === "imperial" ? "default" : "outline"} onClick={() => updateProfile({ unitSystem: "imperial" })}>
                Imperial
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant={userProfile.language !== "ko" ? "default" : "outline"} onClick={() => updateProfile({ language: "en" })}>
                English
              </Button>
              <Button variant={userProfile.language === "ko" ? "default" : "outline"} onClick={() => updateProfile({ language: "ko" })}>
                한국어
              </Button>
            </div>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((count) => (
                <Button key={count} variant={userProfile.mealsPerDay === count ? "default" : "outline"} onClick={() => updateProfile({ mealsPerDay: count })}>
                  {count}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Meal Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {dietTypes.map((item) => (
                <Button key={item.id} variant={userProfile.dietType === item.id ? "default" : "outline"} onClick={() => updateProfile({ dietType: item.id })}>
                  {item.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setCurrentStep(0)}>
              Update ingredients
            </Button>
            <Button className="w-full" onClick={handleRegenerate}>
              Regenerate plan
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>App version: v0.1.0</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={handleClearAll}>
              Clear all data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
