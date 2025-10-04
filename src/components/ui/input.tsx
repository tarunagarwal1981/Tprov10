import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FiEye, FiEyeOff, FiX, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent text-base shadow-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive/50",
        success: "border-green-500 focus-visible:ring-green-500/50",
      },
      size: {
        sm: "h-8 px-3 py-1 text-sm",
        default: "h-9 px-3 py-1",
        lg: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  showClear?: boolean
  showPasswordToggle?: boolean
  maxLength?: number
  showCharacterCount?: boolean
  error?: boolean
  success?: boolean
  errorMessage?: string
  successMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant,
    size,
    leftIcon,
    rightIcon,
    loading = false,
    showClear = false,
    showPasswordToggle = false,
    maxLength,
    showCharacterCount = false,
    error = false,
    success = false,
    errorMessage,
    successMessage,
    value,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isShaking, setIsShaking] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : type

    const currentVariant = error ? "error" : success ? "success" : variant
    const currentValue = (value as string) || ""
    const characterCount = currentValue.length

    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    const handlePasswordToggle = () => {
      setShowPassword(!showPassword)
    }

    React.useEffect(() => {
      if (error) {
        setIsShaking(true)
        const timer = setTimeout(() => setIsShaking(false), 500)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [error])

    React.useEffect(() => {
      if (success) {
        setIsSuccess(true)
        const timer = setTimeout(() => setIsSuccess(false), 2000)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [success])

    const hasLeftContent = leftIcon || loading
    const hasRightContent = rightIcon || loading || showClear || showPasswordToggle || success || error

    return (
      <div className="relative w-full">
        <div className="relative">
          {hasLeftContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
              {loading ? (
                <FiLoader className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                leftIcon
              )}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              hasLeftContent && "pl-10",
              hasRightContent && "pr-10",
              isShaking && "animate-pulse",
              isSuccess && "animate-pulse"
            )}
            ref={ref}
            maxLength={maxLength}
            {...props}
          />

          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {loading && <FiLoader className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!loading && success && (
                <FiCheckCircle className="h-4 w-4 text-green-500 animate-pulse" />
              )}
              {!loading && error && (
                <FiAlertCircle className="h-4 w-4 text-destructive animate-pulse" />
              )}
              {!loading && showClear && currentValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiX className="h-3 w-3" />
                </button>
              )}
              {!loading && showPasswordToggle && (
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-3 w-3" />
                  ) : (
                    <FiEye className="h-3 w-3" />
                  )}
                </button>
              )}
              {!loading && rightIcon && rightIcon}
            </div>
          )}
        </div>

        {/* Character count */}
        {showCharacterCount && maxLength && (
          <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
            {characterCount}/{maxLength}
          </div>
        )}

        {/* Error message */}
        {error && errorMessage && (
          <div className="absolute -bottom-5 left-0 text-xs text-destructive animate-in slide-in-from-top-1 duration-200">
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {success && successMessage && (
          <div className="absolute -bottom-5 left-0 text-xs text-green-500 animate-in slide-in-from-top-1 duration-200">
            {successMessage}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
