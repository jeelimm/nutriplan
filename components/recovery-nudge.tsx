"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMealStore } from "@/lib/meal-store"

interface RecoveryNudgeProps {
  dayIndex: number
}

export function RecoveryNudge({ dayIndex }: RecoveryNudgeProps) {
  const { weekPlan, userProfile, appPrefs } = useMealStore()
  const language = appPrefs.language
  const [state, setState] = useState<"idle" | "redistributed" | "dismissed">("idle")

  if (state === "dismissed") return null
  if (!userProfile) return null

  const day = weekPlan[dayIndex]
  if (!day) return null

  const skippedCount = day.meals.filter((m) => m.status === "skipped").length
  const eatenKcal = day.meals
    .filter((m) => m.status === "eaten")
    .reduce((sum, m) => sum + m.calories, 0)
  const targetKcal = userProfile.dailyCalories
  const gap = targetKcal - eatenKcal

  if (skippedCount === 0 || gap <= 200) return null

  const remainingDays = 6 - dayIndex
  const perDay = remainingDays > 0 ? Math.round(gap / remainingDays) : 0

  const headline =
    language === "ko"
      ? `오늘 ${gap} kcal 부족해요`
      : `You're ${gap} kcal short today`

  const redistributeLabel =
    language === "ko" ? "남은 요일로 나누기" : "Redistribute over remaining days"
  const acceptLabel =
    language === "ko" ? "괜찮아요, 다음 식사부터" : "Accept and move on"
  const gotItLabel = language === "ko" ? "알겠어요" : "Got it"
  const breakdownText =
    language === "ko"
      ? `남은 ${remainingDays}일에 하루 ~${perDay} kcal씩 추가하세요.`
      : `Add ~${perDay} kcal per day to the next ${remainingDays} days.`

  return (
    <div
      style={{
        backgroundColor: "#F1F5F2",
        borderLeft: "4px solid #26603F",
        padding: "16px",
      }}
      className="rounded-md"
    >
      <div className="flex items-start gap-2">
        <Sparkles size={18} color="#26603F" className="mt-0.5 shrink-0" />
        <div className="text-sm font-medium text-foreground">{headline}</div>
      </div>

      <div className="mt-3">
        {state === "redistributed" ? (
          <div className="space-y-2">
            {remainingDays > 0 && (
              <p className="text-sm text-muted-foreground">{breakdownText}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState("dismissed")}
            >
              {gotItLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            {remainingDays > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState("redistributed")}
              >
                {redistributeLabel}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState("dismissed")}
            >
              {acceptLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
