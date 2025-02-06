"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center",
    "rounded-[11px] min-w-[132px] px-9 py-4",
    "text-base leading-[19px] font-[500] text-white",
    "font-sans font-bold",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "border-2 border-white",
    "transition-all duration-300",
    "hover:bg-[#60A5FA] hover:border-[#60A5FA] hover:text-white",
    "--pos-x: 100%",
    "--pos-y: 0%",
    "--spread-x: 140%",
    "--spread-y: 140%",
    "--color-1: #000022",
    "--color-2: #1f3f6d",
    "--color-3: #469396",
    "--color-4: #f1ffa5",
    "--color-5: #000",
    "--border-angle: 200deg",
    "--border-color-1: hsla(320, 75%, 90%, 0.6)",
    "--border-color-2: hsla(320, 50%, 90%, 0.15)",
    "--stop-1: 0%",
    "--stop-2: 10%",
    "--stop-3: 35.44%",
    "--stop-4: 71.34%",
    "--stop-5: 90.76%"
  ],
  {
    variants: {
      variant: {
        default: "",
        variant: "gradient-button-variant",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }