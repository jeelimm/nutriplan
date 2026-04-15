"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type GroceryItemRowProps = {
  name: string
  amount: string
  checked?: boolean
  onToggle?: () => void
  showCheckbox?: boolean
  compact?: boolean
  className?: string
}

export function GroceryItemRow({
  name,
  amount,
  checked = false,
  onToggle,
  showCheckbox = false,
  compact = false,
  className,
}: GroceryItemRowProps) {
  const content = (
    <div className="flex min-w-0 items-start gap-3">
      {showCheckbox ? (
        <div
          className={cn(
            "grocery-checkbox",
            checked
              ? "border-primary bg-primary shadow-[0_10px_20px_-16px_rgba(38,96,63,0.55)] ring-4 ring-primary/8"
              : "border-border bg-card group-hover:border-primary/40 group-hover:bg-secondary/60"
          )}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      ) : (
        <span className="grocery-row-marker" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "break-words text-left text-sm font-medium leading-5",
            checked ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {name}
        </div>
        <span className={cn("grocery-amount-text", checked ? "text-muted-foreground/70" : "")}>{amount}</span>
      </div>
    </div>
  )

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={cn("grocery-item-row group", compact && "grocery-item-row-compact", checked ? "bg-primary/10 dark:bg-primary/20" : "", className)}
      >
        {content}
      </button>
    )
  }

  return <div className={cn("grocery-item-row", compact && "grocery-item-row-compact", className)}>{content}</div>
}
