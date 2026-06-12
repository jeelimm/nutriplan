"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollToTopProps {
  // Optional position override. Defaults to bottom-20 right-4, which sits
  // above the global Settings FAB (bottom-6 h-12) so the two never overlap.
  className?: string
}

export function ScrollToTop({ className }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    // Sync once on mount in case the page is already scrolled.
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-colors hover:brightness-90 bg-[#26603F]",
        className,
      )}
    >
      <ArrowUp size={20} />
    </button>
  )
}
