"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMealStore, type Goal } from "@/lib/meal-store"
import { Scale, Target, TrendingUp, Activity, Dumbbell, RefreshCw } from "lucide-react"

const goals: { id: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "lose-fat", label: "Lose Fat", description: "Caloric deficit with high protein", icon: <TrendingUp className="h-6 w-6" /> },
  { id: "gain-muscle", label: "Gain Muscle", description: "Caloric surplus for growth", icon: <Dumbbell className="h-6 w-6" /> },
  { id: "recomposition", label: "Lean Recomposition", description: "Build muscle while losing fat", icon: <RefreshCw className="h-6 w-6" /> },
]

export function Onboarding() {
  const { setUserProfile, setCurrentStep, calculateMacros } = useMealStore()
  const [step, setStep] = useState<"body" | "goal">("body")
  const [unit, setUnit] = useState<"kg" | "lbs">("kg")
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, "")
    // Prevent multiple decimal points
    const parts = sanitized.split(".")
    if (parts.length > 2) return
    setter(sanitized)
  }

  const getWeightInKg = (value: string): number => {
    const num = parseFloat(value)
    return unit === "lbs" ? num * 0.453592 : num
  }

  const handleBodySubmit = () => {
    if (weight && bodyFat && muscleMass) {
      setStep("goal")
    }
  }

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal)
  }

  const handleComplete = () => {
    if (!selectedGoal || !weight || !bodyFat || !muscleMass) return

    const { calories, macros } = calculateMacros(
      getWeightInKg(weight),
      parseFloat(bodyFat),
      selectedGoal
    )

    setUserProfile({
      weight: parseFloat(weight),
      bodyFatPercentage: parseFloat(bodyFat),
      muscleMass: parseFloat(muscleMass),
      goal: selectedGoal,
      dailyCalories: calories,
      macros,
    })

    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NutriPlan</h1>
          <p className="mt-2 text-muted-foreground">Your personalized nutrition journey starts here</p>
        </div>

        {step === "body" ? (
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
                onClick={handleBodySubmit}
                disabled={!weight || !bodyFat || !muscleMass}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        ) : (
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
                  onClick={() => handleGoalSelect(goal.id)}
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
                  onClick={() => setStep("body")}
                >
                  Back
                </Button>
                <Button
                  className="h-12 flex-1 text-lg font-semibold"
                  onClick={handleComplete}
                  disabled={!selectedGoal}
                >
                  Calculate Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <div className={`h-2 w-8 rounded-full ${step === "body" ? "bg-primary" : "bg-border"}`} />
          <div className={`h-2 w-8 rounded-full ${step === "goal" ? "bg-primary" : "bg-border"}`} />
        </div>
      </div>
    </div>
  )
}
