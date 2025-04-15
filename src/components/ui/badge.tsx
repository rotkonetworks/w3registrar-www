import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/50 hover:text-black/66 hover:dark:text-white",
        secondary:
          "border-transparent bg-secondary text-white hover:bg-secondary/50 hover:text-black/66 hover:dark:text-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/50 hover:text-black/66 hover:dark:text-white",
        successoutline: "text-foreground",
        success:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/50 hover:text-black/66 hover:dark:text-white",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size'>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), "text-nowrap", className)} {...props} />
  )
}

export { Badge, badgeVariants }
