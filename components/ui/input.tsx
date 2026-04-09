import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground h-12 w-full min-w-0 rounded-none border-0 border-b border-input bg-transparent px-0 py-2 text-[15px] text-foreground shadow-none transition-[border-color,color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-input/60 disabled:opacity-50 md:text-[15px]',
        'focus-visible:border-b-primary focus-visible:ring-0',
        'aria-invalid:border-b-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
