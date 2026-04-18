"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  useMealStore,
  CUISINE_OPTIONS,
} from "@/lib/meal-store"
import { toKg } from "@/lib/nutrition"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const FONT_STACK = "'Avenir Next', 'Avenir', 'Segoe UI', 'Noto Sans KR', 'Apple SD Gothic Neo', -apple-system, sans-serif"

const GOAL_LABELS: Record<string, string> = {
  "lose-fat": "Lose Fat",
  "gain-muscle": "Gain Muscle",
  "recomposition": "Lean Recomposition",
}
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  "very-active": "Very Active",
}
const DIET_LABELS: Record<string, string> = {
  keto: "Keto",
  "high-protein": "High Protein",
  balanced: "Balanced",
  "intermittent-fasting": "Time-restricted",
}
const PACE_LABELS: Record<string, string> = {
  steady: "Steady",
  moderate: "Moderate",
  aggressive: "Aggressive",
}

function calcWeeksToGoal(
  weight: number,
  targetWeight: number | undefined,
  unit: "kg" | "lbs",
  pace: string | undefined
): number | null {
  if (!targetWeight) return null
  const diff = Math.abs(toKg(weight, unit) - toKg(targetWeight, unit))
  if (diff < 0.1) return 0
  const rate = pace === "steady" ? 0.35 : pace === "aggressive" ? 0.75 : 0.5
  return Math.ceil(diff / rate)
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div style={{ paddingTop: 24, paddingLeft: 20, paddingRight: 20, paddingBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#b77749", flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--muted-foreground)", textTransform: "uppercase", fontFamily: FONT_STACK }}>
        {label}
      </span>
    </div>
  )
}

function SettingsRow({
  label,
  value,
  destructive = false,
  onClick,
  last = false,
}: {
  label: string
  value?: string
  destructive?: boolean
  onClick?: () => void
  last?: boolean
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 48,
          padding: "12px 18px",
          width: "100%",
          background: "none",
          border: "none",
          cursor: onClick ? "pointer" : "default",
          fontFamily: FONT_STACK,
          textAlign: "left",
        }}
      >
        <span style={{
          flex: 1,
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: destructive ? "var(--destructive)" : "var(--foreground)",
        }}>
          {label}
        </span>
        {value && (
          <span style={{
            fontSize: 15,
            fontWeight: 400,
            color: "var(--muted-foreground)",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            marginLeft: 8,
          }}>
            {value}
          </span>
        )}
        {!destructive && (
          <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)", marginLeft: 6, flexShrink: 0 }} />
        )}
      </button>
      {!last && (
        <div style={{ height: 1, background: "var(--border)", marginLeft: 18 }} />
      )}
    </>
  )
}

function BridgeCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 24,
      margin: "0 16px",
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "0 18px 40px -28px rgba(18,33,23,0.38)",
      overflow: "hidden",
    }}>
      {children}
    </div>
  )
}

function SectionFooter({ text }: { text: string }) {
  return (
    <p style={{ padding: "10px 20px 0 12px", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6, fontFamily: FONT_STACK }}>
      {text}
    </p>
  )
}

export function SettingsScreen() {
  const { appPrefs, setAppPrefs, userProfile, setCurrentStep, clearAllData } = useMealStore()

  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const handleClearAll = () => {
    clearAllData()
    window.localStorage.removeItem("meal-plan-storage")
  }

  // No-profile state: only show preferences
  if (!userProfile) {
    return (
      <div className="app-shell bg-background pb-28" style={{ fontFamily: FONT_STACK }}>
        <div className="page-column" style={{ paddingTop: 16 }}>
          <div style={{ padding: "0 16px 8px" }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, borderRadius: 999, background: "#f8f2ea", padding: "0 14px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--foreground)", fontFamily: FONT_STACK }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              Back to Plan
            </button>
          </div>

          <SectionEyebrow label="PREFERENCES" />
          <BridgeCard>
            <SettingsRow
              label="Measurement system"
              value={appPrefs.unitSystem === "imperial" ? "Imperial" : "Metric"}
              onClick={() => setAppPrefs({ unitSystem: appPrefs.unitSystem === "imperial" ? "metric" : "imperial" })}
            />
            <SettingsRow
              label="Language"
              value={appPrefs.language === "ko" ? "한국어" : "English"}
              onClick={() => setAppPrefs({ language: appPrefs.language === "ko" ? "en" : "ko" })}
            />
            <SettingsRow
              label="Appearance"
              value={appPrefs.darkMode ? "Dark" : "Light"}
              onClick={() => setAppPrefs({ darkMode: !appPrefs.darkMode })}
              last
            />
          </BridgeCard>
          <div style={{ height: 24 }} />
        </div>
      </div>
    )
  }

  const goalLabel = GOAL_LABELS[userProfile.goal] ?? userProfile.goal
  const weeksToGoal = calcWeeksToGoal(userProfile.weight, userProfile.targetWeight, userProfile.unit, userProfile.weightLossPace)

  const heightDisplay = userProfile.height
    ? userProfile.unit === "kg"
      ? `${userProfile.height} cm`
      : `${userProfile.height} in`
    : "—"
  const weightDisplay = userProfile.weight > 0 ? `${userProfile.weight} ${userProfile.unit}` : "—"
  const bodyFatDisplay = userProfile.bodyFat > 0 ? `${userProfile.bodyFat}%` : "—"
  const muscleMassDisplay = userProfile.muscleMass > 0 ? `${userProfile.muscleMass} ${userProfile.unit}` : "—"
  const targetWeightDisplay = userProfile.targetWeight ? `${userProfile.targetWeight} ${userProfile.unit}` : "—"

  const cuisineNames = (userProfile.cuisinePreference ?? [])
    .map(id => CUISINE_OPTIONS.find(c => c.id === id)?.title ?? id)
    .join(", ") || "—"

  return (
    <div className="app-shell bg-background pb-28" style={{ fontFamily: FONT_STACK }}>
      <div className="page-column" style={{ paddingTop: 16 }}>

        {/* Back to Plan pill */}
        <div style={{ padding: "0 16px 8px" }}>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, borderRadius: 999, background: "#f8f2ea", padding: "0 14px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--foreground)", fontFamily: FONT_STACK }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
            Back to Plan
          </button>
        </div>

        {/* Header panel */}
        <div style={{ margin: "0 16px 8px", borderRadius: 28, border: "1px solid var(--border)", boxShadow: "0 4px 24px -8px rgba(18,33,23,0.12)", padding: 18, background: "var(--card)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 8, fontFamily: FONT_STACK }}>
            PROFILE &amp; PLAN SETTINGS
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px", lineHeight: 1.2, fontFamily: FONT_STACK }}>
            Keep your plan aligned
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "0 0 16px", fontFamily: FONT_STACK }}>
            {goalLabel}{weeksToGoal !== null ? ` · ${weeksToGoal} weeks to goal` : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--background)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT_STACK }}>
                DAILY TARGET
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", fontFamily: FONT_STACK }}>
                {userProfile.dailyCalories} kcal
              </div>
            </div>
            <div style={{ background: "var(--background)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT_STACK }}>
                PLAN SETUP
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", fontFamily: FONT_STACK }}>
                {userProfile.mealsPerDay} meals / day
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE section */}
        <SectionEyebrow label="PROFILE" />
        <BridgeCard>
          <SettingsRow label="Profile name" value={userProfile.profileName || "—"} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Age" value={userProfile.age ? String(userProfile.age) : "—"} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Sex" value={userProfile.sex ? (userProfile.sex === "male" ? "Male" : "Female") : "—"} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Height" value={heightDisplay} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Weight" value={weightDisplay} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Body fat" value={bodyFatDisplay} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Muscle mass" value={muscleMassDisplay} onClick={() => setCurrentStep(0)} last />
        </BridgeCard>
        <SectionFooter text="Shapes calories, macros, and the meals we build around your week." />

        {/* GOALS section */}
        <SectionEyebrow label="GOALS" />
        <BridgeCard>
          <SettingsRow label="Goal" value={goalLabel} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Goal weight" value={targetWeightDisplay} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Pace" value={PACE_LABELS[userProfile.weightLossPace ?? ""] ?? "—"} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Activity level" value={ACTIVITY_LABELS[userProfile.activityLevel] ?? userProfile.activityLevel} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Diet type" value={DIET_LABELS[userProfile.dietType] ?? userProfile.dietType} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Meals per day" value={String(userProfile.mealsPerDay)} onClick={() => setCurrentStep(0)} last />
        </BridgeCard>
        <SectionFooter text="Changes show up the next time you regenerate your plan." />

        {/* PREFERENCES section */}
        <SectionEyebrow label="PREFERENCES" />
        <BridgeCard>
          <SettingsRow label="Cuisine focus" value={cuisineNames} onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Budget" value="—" onClick={() => setCurrentStep(0)} />
          <SettingsRow label="Ingredient exclusions" value="—" onClick={() => setCurrentStep(0)} />
          <SettingsRow
            label="Measurement system"
            value={appPrefs.unitSystem === "imperial" ? "Imperial" : "Metric"}
            onClick={() => setAppPrefs({ unitSystem: appPrefs.unitSystem === "imperial" ? "metric" : "imperial" })}
          />
          <SettingsRow
            label="Language"
            value={appPrefs.language === "ko" ? "한국어" : "English"}
            onClick={() => setAppPrefs({ language: appPrefs.language === "ko" ? "en" : "ko" })}
          />
          <SettingsRow
            label="Appearance"
            value={appPrefs.darkMode ? "Dark" : "Light"}
            onClick={() => setAppPrefs({ darkMode: !appPrefs.darkMode })}
            last
          />
        </BridgeCard>

        {/* ACCOUNT section */}
        <SectionEyebrow label="ACCOUNT" />
        <BridgeCard>
          <SettingsRow label="Clear all data" destructive onClick={() => setClearDialogOpen(true)} />
          <SettingsRow label="Reset &amp; start over" destructive onClick={() => setResetDialogOpen(true)} last />
        </BridgeCard>
        <SectionFooter text={'Destructive actions are permanent. "Clear all data" keeps your profile; "Reset" removes it.'} />

        <div style={{ height: 24 }} />
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your saved meal plan, grocery list, and ingredient setup from this device. Your profile will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear all data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset &amp; start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current meal plan and profile completely. You&apos;ll go back to onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setCurrentStep(0)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
