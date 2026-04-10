'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMealStore } from '@/lib/meal-store'
import type { Meal, SwapCandidate } from '@/lib/meal-store'

interface MealSwapSheetProps {
  isOpen: boolean
  onClose: () => void
  currentMeal: Meal
  dayIndex: number
  mealIndex: number
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const
type MealSlot = (typeof MEAL_SLOTS)[number]

function getMealSlot(mealIndex: number): MealSlot {
  return MEAL_SLOTS[mealIndex] ?? 'lunch'
}

function diffLabel(value: number, unit: string): string {
  if (value === 0) return `±0${unit}`
  return `${value > 0 ? '+' : ''}${value}${unit}`
}

function MacroDiff({ candidate, current }: { candidate: SwapCandidate; current: Meal }) {
  const calDiff = Math.round(candidate.calories - current.calories)
  const proteinDiff = Math.round(candidate.protein - current.protein)
  const carbsDiff = Math.round(candidate.carbs - current.carbs)
  const fatDiff = Math.round(candidate.fat - current.fat)

  // Calories up = worse (orange), down = better (green); protein up = better
  const calClass = cn('text-xs font-medium', calDiff > 0 ? 'text-orange-500' : calDiff < 0 ? 'text-green-500' : 'text-muted-foreground')
  const proteinClass = cn('text-xs font-medium', proteinDiff > 0 ? 'text-green-500' : proteinDiff < 0 ? 'text-orange-500' : 'text-muted-foreground')
  const neutralClass = (val: number) => cn('text-xs font-medium', val !== 0 ? 'text-muted-foreground' : 'text-muted-foreground')

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      <span className={calClass}>{diffLabel(calDiff, ' kcal')}</span>
      <span className={proteinClass}>{diffLabel(proteinDiff, 'g protein')}</span>
      <span className={neutralClass(carbsDiff)}>{diffLabel(carbsDiff, 'g carbs')}</span>
      <span className={neutralClass(fatDiff)}>{diffLabel(fatDiff, 'g fat')}</span>
    </div>
  )
}

function candidateToMeal(candidate: SwapCandidate, mealIndex: number): Meal {
  return {
    id: candidate.id || `swap-${Date.now()}-${mealIndex}`,
    name: candidate.name,
    calories: candidate.calories,
    protein: candidate.protein,
    carbs: candidate.carbs,
    fat: candidate.fat,
    ingredients: candidate.ingredients,
    instructions: candidate.recipe ? [candidate.recipe] : [],
    prepTime: 10,
    cookTime: 20,
  }
}

export function MealSwapSheet({
  isOpen,
  onClose,
  currentMeal,
  dayIndex,
  mealIndex,
}: MealSwapSheetProps) {
  const { userProfile, swapMeal } = useMealStore()
  const [candidates, setCandidates] = useState<SwapCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setCandidates([])
    setError(null)
    setLoading(true)

    const mealSlot = getMealSlot(mealIndex)

    fetch('/api/swap-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentMeal, mealSlot, userProfile }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to fetch swap options')
        const raw: SwapCandidate[] = (data.candidates ?? []).map(
          (c: SwapCandidate, i: number) => ({ ...c, id: c.id ?? `candidate-${i}` })
        )
        setCandidates(raw)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [isOpen, currentMeal, mealIndex, userProfile])

  function handleSelect(candidate: SwapCandidate) {
    swapMeal(dayIndex, mealIndex, candidateToMeal(candidate, mealIndex))
    toast.success('Meal updated')
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-safe">
        <SheetHeader className="pb-2">
          <SheetTitle>Swap meal</SheetTitle>
          <SheetDescription>
            Replacing: <span className="font-medium text-foreground">{currentMeal.name}</span>
            {' '}({currentMeal.calories} kcal · {currentMeal.protein}g P · {currentMeal.carbs}g C · {currentMeal.fat}g F)
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-2 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Finding alternatives…</p>
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          )}

          {!loading && !error && candidates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No suitable alternatives found. Try again.
            </p>
          )}

          {!loading && candidates.length > 0 && (
            <ul className="flex flex-col gap-3">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    onClick={() => handleSelect(candidate)}
                    className={cn(
                      'w-full text-left rounded-xl border bg-card p-4 transition-colors',
                      'hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <p className="font-semibold text-sm leading-snug">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {candidate.calories} kcal · {candidate.protein}g protein · {candidate.carbs}g carbs · {candidate.fat}g fat
                    </p>
                    <MacroDiff candidate={candidate} current={currentMeal} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="pt-2">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Keep current meal
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
