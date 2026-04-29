"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  useMealStore,
  CUISINE_OPTIONS,
  type Goal,
  type ActivityLevel,
  type DietType,
  type WeightLossPace,
  type CuisinePreference,
  type Sex,
  type RecipeUnitSystem,
  type Language,
  type UserProfile,
} from "@/lib/meal-store"
import { toKg } from "@/lib/nutrition"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

const PRIMARY = "var(--primary)"
const PRIMARY_BG = "color-mix(in srgb, var(--primary) 10%, var(--card))"
const FONT_STACK = "'Avenir Next', 'Avenir', 'Segoe UI', 'Noto Sans KR', 'Apple SD Gothic Neo', -apple-system, sans-serif"

const GOAL_OPTIONS: { value: Goal; label: string; hint: string }[] = [
  { value: "lose-fat", label: "Lose Fat", hint: "Calorie deficit with high protein" },
  { value: "gain-muscle", label: "Gain Muscle", hint: "+300 kcal surplus, high protein" },
  { value: "recomposition", label: "Lean Recomposition", hint: "Slight deficit, preserve muscle" },
]

const PACE_OPTIONS: { value: WeightLossPace; label: string; hint: string }[] = [
  { value: "steady", label: "Steady", hint: "−0.35 kg/wk — sustainable, less hunger" },
  { value: "moderate", label: "Moderate", hint: "−0.5 kg/wk — balanced approach" },
  { value: "aggressive", label: "Aggressive", hint: "−0.75 kg/wk — faster, harder to maintain" },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little or no exercise" },
  { value: "light", label: "Light", hint: "1–3 light workouts/week" },
  { value: "moderate", label: "Moderate", hint: "3–5 moderate sessions/week" },
  { value: "active", label: "Active", hint: "6–7 hard sessions/week" },
  { value: "very-active", label: "Very Active", hint: "Physical job + daily training" },
]

const DIET_OPTIONS: { value: DietType; label: string; hint: string }[] = [
  { value: "balanced", label: "Balanced", hint: "Even carb/fat split" },
  { value: "high-protein", label: "High Protein", hint: "2–2.2 g/kg LBM protein" },
  { value: "keto", label: "Keto", hint: "<50 g carbs/day, high fat" },
  { value: "intermittent-fasting", label: "Time-restricted", hint: "16:8 eating window" },
]

const MEALS_OPTIONS: { value: string; label: string }[] = [
  { value: "2", label: "2 meals" },
  { value: "3", label: "3 meals" },
  { value: "4", label: "4 meals" },
  { value: "5", label: "5 meals" },
]

const BUDGET_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "low", label: "Budget", hint: "Simple staples, ~$50–$70/week" },
  { value: "medium", label: "Moderate", hint: "Balanced variety, ~$70–$100/week" },
  { value: "high", label: "Premium", hint: "Quality ingredients, ~$100+/week" },
]

const UNIT_OPTIONS: { value: RecipeUnitSystem; label: string }[] = [
  { value: "metric", label: "Metric (kg, cm)" },
  { value: "imperial", label: "Imperial (lbs, in)" },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
]

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

function EditButtons({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <button
        type="button"
        onClick={onCancel}
        style={{
          flex: 1, height: 44, borderRadius: 16,
          border: `1.5px solid ${PRIMARY}`,
          background: "transparent",
          color: PRIMARY,
          fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_STACK,
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        style={{
          flex: 1, height: 44, borderRadius: 16,
          border: "none",
          background: PRIMARY,
          color: "var(--primary-foreground)",
          fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_STACK,
        }}
      >
        Save
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 16,
  border: `1px solid ${PRIMARY}`,
  padding: "0 18px",
  fontSize: 16,
  fontFamily: FONT_STACK,
  background: "var(--background)",
  color: "var(--foreground)",
  boxSizing: "border-box",
  outline: "none",
}

function UnitChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 56, height: 40, borderRadius: 14,
        border: active ? `1.5px solid ${PRIMARY}` : "1.5px solid var(--border)",
        background: active ? PRIMARY_BG : "transparent",
        color: active ? PRIMARY : "var(--muted-foreground)",
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_STACK,
        padding: "0 12px",
      }}
    >
      {label}
    </button>
  )
}

function ChoiceCard({
  label,
  hint,
  selected,
  onClick,
  rightLabel,
}: {
  label: string
  hint?: string
  selected: boolean
  onClick: () => void
  rightLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center",
        width: "100%", padding: "13px 16px",
        borderRadius: 14,
        border: selected ? `1.5px solid ${PRIMARY}` : "1.5px solid var(--border)",
        background: selected ? PRIMARY_BG : "var(--card)",
        cursor: "pointer", textAlign: "left", fontFamily: FONT_STACK,
        gap: 0,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      {rightLabel ? (
        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? PRIMARY : "var(--muted-foreground)", marginLeft: 10, flexShrink: 0 }}>
          {rightLabel}
        </span>
      ) : selected ? (
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: PRIMARY,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: 10, flexShrink: 0,
        }}>
          <span style={{ color: "var(--primary-foreground)", fontSize: 11, lineHeight: 1 }}>✓</span>
        </div>
      ) : null}
    </button>
  )
}

function ExpandableRow({
  rowId,
  label,
  value,
  expandedRow,
  collapsingRow,
  onTap,
  isLast = false,
  noChevron = false,
  destructive = false,
  children,
}: {
  rowId: string
  label: string
  value?: string
  expandedRow: string | null
  collapsingRow: string | null
  onTap: (rowId: string) => void
  isLast?: boolean
  noChevron?: boolean
  destructive?: boolean
  children?: React.ReactNode
}) {
  const isExpanded = expandedRow === rowId
  const isCollapsing = collapsingRow === rowId
  const isActive = isExpanded || isCollapsing

  return (
    <>
      <div
        style={{
          position: "relative",
          zIndex: isActive ? 1 : 0,
          ...(isActive ? {
            background: destructive ? "color-mix(in srgb, var(--destructive) 10%, var(--card))" : PRIMARY_BG,
            borderTop: destructive ? "1px solid color-mix(in srgb, var(--destructive) 35%, transparent)" : `1px solid ${PRIMARY}`,
            borderBottom: destructive ? "1px solid color-mix(in srgb, var(--destructive) 35%, transparent)" : `1px solid ${PRIMARY}`,
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent)",
            margin: "-1px 0",
          } : {}),
        }}
      >
        <button
          type="button"
          onClick={() => onTap(rowId)}
          style={{
            display: "flex", alignItems: "center",
            minHeight: 48, padding: "12px 18px",
            width: "100%", background: "none", border: "none",
            cursor: "pointer", fontFamily: FONT_STACK, textAlign: "left",
          }}
        >
          <span style={{
            flex: 1, fontSize: 15,
            fontWeight: isExpanded ? 600 : 500,
            letterSpacing: "-0.01em",
            color: destructive ? "var(--destructive)" : "var(--foreground)",
          }}>
            {label}
          </span>
          {isExpanded ? (
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: PRIMARY, textTransform: "uppercase" }}>
              EDITING
            </span>
          ) : (
            <>
              {value && (
                <span style={{
                  fontSize: 15, fontWeight: 400,
                  color: "var(--muted-foreground)",
                  maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", marginLeft: 8,
                }}>
                  {value}
                </span>
              )}
              {!noChevron && (
                <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)", marginLeft: 6, flexShrink: 0 }} />
              )}
            </>
          )}
        </button>

        <div style={{
          maxHeight: isExpanded ? "900px" : "0px",
          overflow: "hidden",
          transition: isExpanded
            ? "max-height 200ms ease-out"
            : isCollapsing
              ? "max-height 150ms ease-in"
              : "none",
        }}>
          <div style={{ padding: "0 18px 16px" }}>
            {children}
          </div>
        </div>
      </div>

      {!isLast && !isActive && (
        <div style={{ height: 1, background: "var(--border)", marginLeft: 18 }} />
      )}
    </>
  )
}

export function SettingsScreen() {
  const { appPrefs, setAppPrefs, userProfile, setUserProfile, calculateMacros, setCurrentStep, clearAllData, setResetGroceryOnRegen, generateMealPlan } = useMealStore()

  // Row open/close state
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [collapsingRow, setCollapsingRow] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shared draft state (only one row open at a time)
  const [draftStr, setDraftStr] = useState("")
  const [draftNum, setDraftNum] = useState(0)
  const [draftUnit, setDraftUnit] = useState<"kg" | "lbs" | "cm" | "in">("kg")
  const [draftSelect, setDraftSelect] = useState("")
  const [draftMulti, setDraftMulti] = useState<string[]>([])

  function initDraftFor(rowId: string) {
    if (!userProfile) return
    switch (rowId) {
      case "profile-name": setDraftStr(userProfile.profileName || ""); break
      case "age": setDraftNum(userProfile.age || 0); break
      case "sex": setDraftSelect(userProfile.sex || "male"); break
      case "height":
        setDraftNum(userProfile.height || 0)
        setDraftUnit(userProfile.unit === "lbs" ? "in" : "cm")
        break
      case "weight":
        setDraftNum(userProfile.weight)
        setDraftUnit(userProfile.unit)
        break
      case "body-fat": setDraftNum(userProfile.bodyFat); break
      case "muscle-mass": setDraftNum(userProfile.muscleMass); break
      case "goal": setDraftSelect(userProfile.goal); break
      case "goal-weight": setDraftNum(userProfile.targetWeight ?? userProfile.weight); break
      case "pace": setDraftSelect(userProfile.weightLossPace || "moderate"); break
      case "activity-level": setDraftSelect(userProfile.activityLevel); break
      case "diet-type": setDraftSelect(userProfile.dietType); break
      case "meals-per-day": setDraftSelect(String(userProfile.mealsPerDay)); break
      case "cuisine-focus": setDraftMulti([...(userProfile.cuisinePreference || [])]); break
      case "budget": setDraftSelect(userProfile.budget || "medium"); break
      case "measurement-system": setDraftSelect(appPrefs.unitSystem); break
      case "language": setDraftSelect(appPrefs.language); break
    }
  }

  function closeRow() {
    if (!expandedRow) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setCollapsingRow(expandedRow)
    setExpandedRow(null)
    timerRef.current = setTimeout(() => setCollapsingRow(null), 160)
  }

  function handleRowTap(rowId: string) {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (expandedRow === rowId) {
      setCollapsingRow(rowId)
      setExpandedRow(null)
      timerRef.current = setTimeout(() => setCollapsingRow(null), 160)
      return
    }

    initDraftFor(rowId)

    if (expandedRow !== null) {
      const prev = expandedRow
      setCollapsingRow(prev)
      setExpandedRow(null)
      timerRef.current = setTimeout(() => {
        setCollapsingRow(null)
        setExpandedRow(rowId)
      }, 160)
    } else {
      setExpandedRow(rowId)
    }
  }

  function saveRow(rowId: string) {
    if (!userProfile) return

    const macroTriggers = new Set(["weight", "body-fat", "muscle-mass", "goal", "activity-level", "diet-type", "pace", "sex", "goal-weight"])
    let profileUpdates: Partial<UserProfile> = {}
    let appPrefUpdates: Partial<typeof appPrefs> = {}

    switch (rowId) {
      case "profile-name": profileUpdates = { profileName: draftStr }; break
      case "age": profileUpdates = { age: Math.max(1, Math.round(draftNum)) }; break
      case "sex": profileUpdates = { sex: draftSelect as Sex }; break
      case "height":
        profileUpdates = {
          height: Math.round(draftNum * 10) / 10,
          unit: draftUnit === "in" ? "lbs" : "kg",
        }
        break
      case "weight":
        profileUpdates = { weight: Math.round(draftNum * 10) / 10, unit: draftUnit as "kg" | "lbs" }
        break
      case "body-fat": profileUpdates = { bodyFat: Math.round(draftNum * 10) / 10 }; break
      case "muscle-mass": profileUpdates = { muscleMass: Math.round(draftNum * 10) / 10 }; break
      case "goal": profileUpdates = { goal: draftSelect as Goal }; break
      case "goal-weight": profileUpdates = { targetWeight: Math.round(draftNum * 10) / 10 }; break
      case "pace": profileUpdates = { weightLossPace: draftSelect as WeightLossPace }; break
      case "activity-level": profileUpdates = { activityLevel: draftSelect as ActivityLevel }; break
      case "diet-type": profileUpdates = { dietType: draftSelect as DietType }; break
      case "meals-per-day": profileUpdates = { mealsPerDay: parseInt(draftSelect) }; break
      case "cuisine-focus": profileUpdates = { cuisinePreference: draftMulti as CuisinePreference[] }; break
      case "budget": profileUpdates = { budget: draftSelect as "low" | "medium" | "high" }; break
      case "measurement-system": appPrefUpdates = { unitSystem: draftSelect as RecipeUnitSystem }; break
      case "language": appPrefUpdates = { language: draftSelect as Language }; break
    }

    if (Object.keys(profileUpdates).length > 0) {
      const updated: UserProfile = { ...userProfile, ...profileUpdates }
      if (macroTriggers.has(rowId)) {
        const weightKg = toKg(updated.weight, updated.unit)
        const targetWeightKg = updated.targetWeight != null ? toKg(updated.targetWeight, updated.unit) : null
        const result = calculateMacros(
          weightKg, updated.bodyFat, updated.goal,
          updated.activityLevel, updated.dietType,
          updated.sex, targetWeightKg, updated.weightLossPace ?? null
        )
        updated.dailyCalories = result.calories
        updated.macros = result.macros
      }
      setUserProfile(updated)
    }

    if (Object.keys(appPrefUpdates).length > 0) {
      setAppPrefs(appPrefUpdates)
    }

    closeRow()
  }

  function handleClearAll() {
    clearAllData()
    window.localStorage.removeItem("meal-plan-storage")
    closeRow()
  }

  function handleReset() {
    clearAllData()
    window.localStorage.removeItem("meal-plan-storage")
    setCurrentStep(0)
  }

  const rowProps = { expandedRow, collapsingRow, onTap: handleRowTap }

  // No-profile state: preferences only
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
            <ExpandableRow rowId="measurement-system" label="Measurement system" value={appPrefs.unitSystem === "imperial" ? "Imperial" : "Metric"} {...rowProps}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {UNIT_OPTIONS.map(opt => (
                  <ChoiceCard key={opt.value} label={opt.label} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
                ))}
              </div>
              <EditButtons onCancel={closeRow} onSave={() => saveRow("measurement-system")} />
            </ExpandableRow>

            <ExpandableRow rowId="language" label="Language" value={appPrefs.language === "ko" ? "한국어" : "English"} {...rowProps}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LANGUAGE_OPTIONS.map(opt => (
                  <ChoiceCard key={opt.value} label={opt.label} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
                ))}
              </div>
              <EditButtons onCancel={closeRow} onSave={() => saveRow("language")} />
            </ExpandableRow>

            <ResetGroceryRow enabled={appPrefs.resetGroceryOnRegen} onChange={setResetGroceryOnRegen} />

            {/* Appearance — inline segmented control, no expansion */}
            <AppearanceRow appPrefs={appPrefs} setAppPrefs={setAppPrefs} isLast />
          </BridgeCard>
          <div style={{ height: 24 }} />
        </div>
      </div>
    )
  }

  const goalLabel = GOAL_OPTIONS.find(g => g.value === userProfile.goal)?.label ?? userProfile.goal
  const weeksToGoal = calcWeeksToGoal(userProfile.weight, userProfile.targetWeight, userProfile.unit, userProfile.weightLossPace)

  const heightDisplay = userProfile.height
    ? userProfile.unit === "kg" ? `${userProfile.height} cm` : `${userProfile.height} in`
    : "—"
  const weightDisplay = userProfile.weight > 0 ? `${userProfile.weight} ${userProfile.unit}` : "—"
  const bodyFatDisplay = userProfile.bodyFat > 0 ? `${userProfile.bodyFat}%` : "—"
  const muscleMassDisplay = userProfile.muscleMass > 0 ? `${userProfile.muscleMass} ${userProfile.unit}` : "—"
  const targetWeightDisplay = userProfile.targetWeight ? `${userProfile.targetWeight} ${userProfile.unit}` : "—"
  const cuisineNames = (userProfile.cuisinePreference ?? [])
    .map(id => CUISINE_OPTIONS.find(c => c.id === id)?.title ?? id)
    .join(", ") || "—"
  const budgetLabel = userProfile.budget ? ({ low: "Budget", medium: "Moderate", high: "Premium" }[userProfile.budget]) : "—"

  // Goal weight stepper helpers
  const gwStep = userProfile.unit === "lbs" ? 1 : 0.5
  const gwMin = Math.round(userProfile.weight * 0.5 * 10) / 10
  const gwMax = Math.round(userProfile.weight * 1.5 * 10) / 10
  const gwDelta = Math.abs(userProfile.weight - draftNum)
  const gwBarFill = Math.min(100, (gwDelta / (userProfile.weight * 0.5)) * 100)
  const gwWeeks = calcWeeksToGoal(userProfile.weight, draftNum, userProfile.unit, userProfile.weightLossPace)
  const paceRate = userProfile.weightLossPace === "steady" ? 0.35 : userProfile.weightLossPace === "aggressive" ? 0.75 : 0.5
  const paceUnit = userProfile.unit === "lbs" ? "lbs" : "kg"

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
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT_STACK }}>DAILY TARGET</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", fontFamily: FONT_STACK }}>{userProfile.dailyCalories} kcal</div>
            </div>
            <div style={{ background: "var(--background)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT_STACK }}>PLAN SETUP</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", fontFamily: FONT_STACK }}>{userProfile.mealsPerDay} meals / day</div>
            </div>
          </div>
        </div>

        {/* PROFILE */}
        <SectionEyebrow label="PROFILE" />
        <BridgeCard>
          <ExpandableRow rowId="profile-name" label="Profile name" value={userProfile.profileName || "—"} {...rowProps}>
            <input
              type="text"
              value={draftStr}
              onChange={e => setDraftStr(e.target.value)}
              placeholder="e.g. Alex"
              style={inputStyle}
            />
            <EditButtons onCancel={closeRow} onSave={() => saveRow("profile-name")} />
          </ExpandableRow>

          <ExpandableRow rowId="age" label="Age" value={userProfile.age ? String(userProfile.age) : "—"} {...rowProps}>
            <input
              type="number"
              value={draftNum || ""}
              onChange={e => setDraftNum(Number(e.target.value))}
              placeholder="e.g. 28"
              min={1} max={120}
              style={inputStyle}
            />
            <EditButtons onCancel={closeRow} onSave={() => saveRow("age")} />
          </ExpandableRow>

          <ExpandableRow rowId="sex" label="Sex" value={userProfile.sex === "male" ? "Male" : userProfile.sex === "female" ? "Female" : "—"} {...rowProps}>
            <div style={{ display: "flex", gap: 10 }}>
              {(["male", "female"] as Sex[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraftSelect(s)}
                  style={{
                    flex: 1, height: 48, borderRadius: 16,
                    border: draftSelect === s ? `1.5px solid ${PRIMARY}` : "1.5px solid var(--border)",
                    background: draftSelect === s ? PRIMARY_BG : "transparent",
                    color: draftSelect === s ? PRIMARY : "var(--foreground)",
                    fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_STACK,
                  }}
                >
                  {s === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("sex")} />
          </ExpandableRow>

          <ExpandableRow rowId="height" label="Height" value={heightDisplay} {...rowProps}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                value={draftNum || ""}
                onChange={e => setDraftNum(Number(e.target.value))}
                style={{ ...inputStyle, flex: 1, width: "auto" }}
                min={50} max={300}
              />
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {(["cm", "in"] as const).map(u => (
                  <UnitChip
                    key={u}
                    label={u}
                    active={draftUnit === u}
                    onClick={() => {
                      if (draftUnit === u) return
                      const converted = u === "in"
                        ? Math.round(draftNum / 2.54 * 10) / 10
                        : Math.round(draftNum * 2.54)
                      setDraftNum(converted)
                      setDraftUnit(u)
                    }}
                  />
                ))}
              </div>
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("height")} />
          </ExpandableRow>

          <ExpandableRow rowId="weight" label="Weight" value={weightDisplay} {...rowProps}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                value={draftNum || ""}
                onChange={e => setDraftNum(Number(e.target.value))}
                style={{ ...inputStyle, flex: 1, width: "auto" }}
                min={20} max={500} step={0.1}
              />
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {(["kg", "lbs"] as const).map(u => (
                  <UnitChip
                    key={u}
                    label={u}
                    active={draftUnit === u}
                    onClick={() => {
                      if (draftUnit === u) return
                      const converted = u === "lbs"
                        ? Math.round(draftNum * 2.20462 * 10) / 10
                        : Math.round(draftNum / 2.20462 * 10) / 10
                      setDraftNum(converted)
                      setDraftUnit(u)
                    }}
                  />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8, lineHeight: 1.5, fontFamily: FONT_STACK }}>
              Use your current weight or a recent best average. We&apos;ll recompute calorie and protein targets.
            </p>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("weight")} />
          </ExpandableRow>

          <ExpandableRow rowId="body-fat" label="Body fat" value={bodyFatDisplay} {...rowProps}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                value={draftNum || ""}
                onChange={e => setDraftNum(Number(e.target.value))}
                style={{ ...inputStyle, flex: 1, width: "auto" }}
                min={3} max={60} step={0.1}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted-foreground)", flexShrink: 0, paddingRight: 4 }}>%</span>
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("body-fat")} />
          </ExpandableRow>

          <ExpandableRow rowId="muscle-mass" label="Muscle mass" value={muscleMassDisplay} {...rowProps} isLast>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                value={draftNum || ""}
                onChange={e => setDraftNum(Number(e.target.value))}
                style={{ ...inputStyle, flex: 1, width: "auto" }}
                min={10} max={200} step={0.1}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted-foreground)", flexShrink: 0, paddingRight: 4 }}>{userProfile.unit}</span>
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("muscle-mass")} />
          </ExpandableRow>
        </BridgeCard>
        <SectionFooter text="Shapes calories, macros, and the meals we build around your week." />

        {/* GOALS */}
        <SectionEyebrow label="GOALS" />
        <BridgeCard>
          <ExpandableRow rowId="goal" label="Goal" value={goalLabel} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GOAL_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} hint={opt.hint} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("goal")} />
          </ExpandableRow>

          <ExpandableRow rowId="goal-weight" label="Goal weight" value={targetWeightDisplay} {...rowProps}>
            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", borderRadius: 16, border: `1.5px solid ${PRIMARY}`, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setDraftNum(v => Math.max(gwMin, Math.round((v - gwStep) * 10) / 10))}
                style={{ width: 48, height: 48, background: "none", border: "none", color: PRIMARY, fontSize: 24, fontWeight: 400, cursor: "pointer", flexShrink: 0, fontFamily: FONT_STACK }}
              >
                −
              </button>
              <div style={{
                flex: 1, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                borderLeft: `1.5px solid ${PRIMARY}`, borderRight: `1.5px solid ${PRIMARY}`,
                fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontFamily: FONT_STACK,
                color: "var(--foreground)",
              }}>
                {draftNum} {userProfile.unit}
              </div>
              <button
                type="button"
                onClick={() => setDraftNum(v => Math.min(gwMax, Math.round((v + gwStep) * 10) / 10))}
                style={{ width: 48, height: 48, background: "none", border: "none", color: PRIMARY, fontSize: 24, fontWeight: 400, cursor: "pointer", flexShrink: 0, fontFamily: FONT_STACK }}
              >
                +
              </button>
            </div>

            {/* Timeline bar */}
            <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, background: PRIMARY,
                width: `${gwBarFill}%`,
                transition: "width 150ms ease-out",
              }} />
            </div>

            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8, lineHeight: 1.5, fontFamily: FONT_STACK }}>
              {gwWeeks !== null && gwWeeks > 0
                ? `At your current pace of −${paceRate} ${paceUnit}/wk, you'll reach this in ~${gwWeeks} weeks.`
                : gwWeeks === 0
                  ? "You're already at your goal weight."
                  : "Set your pace to see an estimate."}
            </p>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("goal-weight")} />
          </ExpandableRow>

          <ExpandableRow rowId="pace" label="Pace" value={PACE_OPTIONS.find(p => p.value === userProfile.weightLossPace)?.label ?? "—"} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PACE_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} hint={opt.hint} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("pace")} />
          </ExpandableRow>

          <ExpandableRow rowId="activity-level" label="Activity level" value={ACTIVITY_OPTIONS.find(a => a.value === userProfile.activityLevel)?.label ?? userProfile.activityLevel} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACTIVITY_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} hint={opt.hint} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("activity-level")} />
          </ExpandableRow>

          <ExpandableRow rowId="diet-type" label="Diet type" value={DIET_OPTIONS.find(d => d.value === userProfile.dietType)?.label ?? userProfile.dietType} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIET_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} hint={opt.hint} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("diet-type")} />
          </ExpandableRow>

          <ExpandableRow rowId="meals-per-day" label="Meals per day" value={String(userProfile.mealsPerDay)} {...rowProps} isLast>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MEALS_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("meals-per-day")} />
          </ExpandableRow>
        </BridgeCard>
        <SectionFooter text="Changes show up the next time you regenerate your plan." />

        {/* PLAN */}
        <SectionEyebrow label="PLAN" />
        <BridgeCard>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                style={{
                  display: "flex", alignItems: "center",
                  minHeight: 48, padding: "12px 18px",
                  width: "100%", background: "none", border: "none",
                  cursor: "pointer", fontFamily: FONT_STACK, textAlign: "left",
                }}
              >
                <span style={{
                  flex: 1, fontSize: 15, fontWeight: 500,
                  letterSpacing: "-0.01em", color: "var(--foreground)",
                }}>
                  Regenerate plan
                </span>
                <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)", marginLeft: 6, flexShrink: 0 }} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate your plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current week will be replaced with a new AI-generated plan. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className={buttonVariants({ variant: "default" })}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { void generateMealPlan() }}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </BridgeCard>

        {/* PREFERENCES */}
        <SectionEyebrow label="PREFERENCES" />
        <BridgeCard>
          <ExpandableRow rowId="cuisine-focus" label="Cuisine focus" value={cuisineNames} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CUISINE_OPTIONS.map(opt => {
                const isSelected = draftMulti.includes(opt.id)
                return (
                  <ChoiceCard
                    key={opt.id}
                    label={opt.title}
                    hint={opt.hint}
                    selected={isSelected}
                    rightLabel={isSelected ? "Included" : "Add"}
                    onClick={() => {
                      if (isSelected) {
                        if (draftMulti.length <= 1) return
                        setDraftMulti(draftMulti.filter(id => id !== opt.id))
                      } else {
                        setDraftMulti(draftMulti.length >= 2
                          ? [...draftMulti.slice(1), opt.id]
                          : [...draftMulti, opt.id]
                        )
                      }
                    }}
                  />
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 10, lineHeight: 1.5, fontFamily: FONT_STACK }}>
              Pick one or two. Keeps grocery runs realistic and lets flavors repeat across the week.
            </p>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("cuisine-focus")} />
          </ExpandableRow>

          <ExpandableRow rowId="budget" label="Budget" value={budgetLabel} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BUDGET_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} hint={opt.hint} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("budget")} />
          </ExpandableRow>

          <ExpandableRow rowId="measurement-system" label="Measurement system" value={appPrefs.unitSystem === "imperial" ? "Imperial" : "Metric"} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {UNIT_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("measurement-system")} />
          </ExpandableRow>

          <ExpandableRow rowId="language" label="Language" value={appPrefs.language === "ko" ? "한국어" : "English"} {...rowProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LANGUAGE_OPTIONS.map(opt => (
                <ChoiceCard key={opt.value} label={opt.label} selected={draftSelect === opt.value} onClick={() => setDraftSelect(opt.value)} />
              ))}
            </div>
            <EditButtons onCancel={closeRow} onSave={() => saveRow("language")} />
          </ExpandableRow>

          <ResetGroceryRow enabled={appPrefs.resetGroceryOnRegen} onChange={setResetGroceryOnRegen} />

          {/* Appearance — inline segmented control, no expansion */}
          <AppearanceRow appPrefs={appPrefs} setAppPrefs={setAppPrefs} isLast />
        </BridgeCard>

        {/* ACCOUNT */}
        <SectionEyebrow label="ACCOUNT" />
        <BridgeCard>
          <ExpandableRow rowId="clear-data" label="Clear all data" destructive noChevron {...rowProps}>
            <DestructiveConfirm
              title="Clear all saved data?"
              body="Removes your meal plan, grocery lists, and ingredient setup. Your profile stays intact so you don't have to redo onboarding."
              confirmLabel="Yes, clear data"
              onCancel={closeRow}
              onConfirm={handleClearAll}
            />
          </ExpandableRow>

          <ExpandableRow rowId="reset" label="Reset & start over" destructive noChevron {...rowProps} isLast>
            <DestructiveConfirm
              title="Reset everything?"
              body="This clears your profile, goals, generated plan, and shopping history from this device. You'll go back to onboarding."
              confirmLabel="Yes, start over"
              onCancel={closeRow}
              onConfirm={handleReset}
            />
          </ExpandableRow>
        </BridgeCard>
        <SectionFooter text={'"Clear all data" keeps your profile; "Reset" removes it. Both are permanent.'} />

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

function ResetGroceryRow({
  enabled,
  onChange,
  isLast = false,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
  isLast?: boolean
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", minHeight: 48, padding: "10px 18px" }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--foreground)", fontFamily: FONT_STACK }}>
          Reset grocery checklist when plan regenerates
        </span>
        <Switch checked={enabled} onCheckedChange={onChange} />
      </div>
      {!isLast && <div style={{ height: 1, background: "var(--border)", marginLeft: 18 }} />}
    </>
  )
}

function AppearanceRow({
  appPrefs,
  setAppPrefs,
  isLast = false,
}: {
  appPrefs: { darkMode: boolean }
  setAppPrefs: (patch: { darkMode: boolean }) => void
  isLast?: boolean
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", minHeight: 48, padding: "10px 18px" }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--foreground)", fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif" }}>
          Appearance
        </span>
        <div style={{
          display: "flex",
          borderRadius: 10,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "var(--background)",
        }}>
          {(["Light", "Dark"] as const).map(mode => {
            const active = (mode === "Dark") === appPrefs.darkMode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setAppPrefs({ darkMode: mode === "Dark" })}
                style={{
                  padding: "6px 16px",
                  background: active ? PRIMARY_BG : "transparent",
                  border: "none",
                  color: active ? PRIMARY : "var(--muted-foreground)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif",
                  transition: "background 150ms, color 150ms",
                }}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>
      {!isLast && <div style={{ height: 1, background: "var(--border)", marginLeft: 18 }} />}
    </>
  )
}

function DestructiveConfirm({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div style={{ borderRadius: 14, background: "color-mix(in srgb, var(--destructive) 10%, var(--card))", padding: 14, border: "1px solid color-mix(in srgb, var(--destructive) 20%, transparent)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "var(--destructive)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2,
        }}>
          <span style={{ color: "var(--destructive-foreground)", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>!</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", marginBottom: 4, fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif" }}>{title}</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5, fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif" }}>{body}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, height: 44, borderRadius: 16,
            border: "1.5px solid var(--destructive)",
            background: "transparent",
            color: "var(--destructive)",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            flex: 1, height: 44, borderRadius: 16,
            border: "none",
            background: "var(--destructive)",
            color: "var(--destructive-foreground)",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Avenir Next', 'Avenir', 'Segoe UI', -apple-system, sans-serif",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
