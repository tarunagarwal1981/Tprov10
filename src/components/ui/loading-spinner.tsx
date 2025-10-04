import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loadingSpinnerVariants = cva(
  "animate-spin rounded-full border-2 border-solid",
  {
    variants: {
      variant: {
        default: "border-primary border-t-transparent",
        primary: "border-primary border-t-transparent",
        secondary: "border-secondary border-t-transparent",
        success: "border-green-500 border-t-transparent",
        warning: "border-yellow-500 border-t-transparent",
        destructive: "border-red-500 border-t-transparent",
        muted: "border-muted-foreground border-t-transparent",
        white: "border-white border-t-transparent",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
        "2xl": "h-16 w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  label?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(loadingSpinnerVariants({ variant, size }), className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      >
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

// Dots loading spinner
const dotsSpinnerVariants = cva(
  "flex space-x-1",
  {
    variants: {
      size: {
        sm: "space-x-1",
        default: "space-x-2",
        lg: "space-x-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface DotsSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dotsSpinnerVariants> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "muted"
  label?: string
}

const DotsSpinner = React.forwardRef<HTMLDivElement, DotsSpinnerProps>(
  ({ className, variant = "default", size, label, ...props }, ref) => {
    const dotVariants = {
      default: "bg-primary",
      primary: "bg-primary",
      secondary: "bg-secondary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-red-500",
      muted: "bg-muted-foreground",
    }

    const dotSizes = {
      sm: "h-1 w-1",
      default: "h-2 w-2",
      lg: "h-3 w-3",
    }

    return (
      <div
        ref={ref}
        className={cn(dotsSpinnerVariants({ size }), className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      >
        <div
          className={cn(
            "rounded-full animate-bounce",
            dotVariants[variant],
            dotSizes[size || "default"]
          )}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={cn(
            "rounded-full animate-bounce",
            dotVariants[variant],
            dotSizes[size || "default"]
          )}
          style={{ animationDelay: "150ms" }}
        />
        <div
          className={cn(
            "rounded-full animate-bounce",
            dotVariants[variant],
            dotSizes[size || "default"]
          )}
          style={{ animationDelay: "300ms" }}
        />
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    )
  }
)
DotsSpinner.displayName = "DotsSpinner"

// Pulse loading spinner
const pulseSpinnerVariants = cva(
  "rounded-full animate-pulse",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-red-500",
        muted: "bg-muted-foreground",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PulseSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pulseSpinnerVariants> {
  label?: string
}

const PulseSpinner = React.forwardRef<HTMLDivElement, PulseSpinnerProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(pulseSpinnerVariants({ variant, size }), className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      >
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    )
  }
)
PulseSpinner.displayName = "PulseSpinner"

// Bars loading spinner
export interface BarsSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "muted"
  size?: "sm" | "default" | "lg"
  label?: string
}

const BarsSpinner = React.forwardRef<HTMLDivElement, BarsSpinnerProps>(
  ({ className, variant = "default", size = "default", label, ...props }, ref) => {
    const barVariants = {
      default: "bg-primary",
      primary: "bg-primary",
      secondary: "bg-secondary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-red-500",
      muted: "bg-muted-foreground",
    }

    const barSizes = {
      sm: "h-3 w-1",
      default: "h-4 w-1",
      lg: "h-6 w-1",
    }

    return (
      <div
        ref={ref}
        className={cn("flex space-x-1", className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-sm animate-pulse",
              barVariants[variant],
              barSizes[size]
            )}
            style={{
              animationDelay: `${i * 100}ms`,
              animationDuration: "1s",
            }}
          />
        ))}
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    )
  }
)
BarsSpinner.displayName = "BarsSpinner"

// Loading overlay component
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean
  spinner?: React.ReactNode
  text?: string
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "muted"
  size?: "sm" | "default" | "lg" | "xl" | "2xl"
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    className, 
    loading = true, 
    spinner, 
    text, 
    variant = "default", 
    size = "default",
    children,
    ...props 
  }, ref) => {
    if (!loading) {
      return <>{children}</>
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            {spinner || <LoadingSpinner variant={variant} size={size} />}
            {text && (
              <p className="text-sm text-muted-foreground">{text}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

// Loading button component
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  spinner?: React.ReactNode
  children: React.ReactNode
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    className, 
    loading = false, 
    loadingText, 
    spinner, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center gap-2", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (spinner || <LoadingSpinner size="sm" />)}
        {loading && loadingText ? loadingText : children}
      </button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { 
  LoadingSpinner,
  DotsSpinner,
  PulseSpinner,
  BarsSpinner,
  LoadingOverlay,
  LoadingButton,
  loadingSpinnerVariants,
  dotsSpinnerVariants,
  pulseSpinnerVariants,
}
