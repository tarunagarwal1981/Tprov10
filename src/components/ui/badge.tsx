import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        info:
          "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
  dot?: boolean
  showDot?: boolean
}

function Badge({ 
  className, 
  variant, 
  size, 
  animation,
  icon, 
  removable = false, 
  onRemove,
  dot = false,
  showDot = false,
  children, 
  ...props 
}: BadgeProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <div className={cn(badgeVariants({ variant, size, animation }), className)} {...props}>
      {showDot && (
        <div className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {icon && <div className="mr-1 flex items-center">{icon}</div>}
      {children}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 h-3 w-3 rounded-full hover:bg-current/20 transition-colors"
          aria-label="Remove"
        >
          <X className="h-2 w-2" />
        </button>
      )}
    </div>
  )
}

// Status badge variants
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'approved' | 'rejected'
}

function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const statusConfig = {
    online: { variant: 'success' as const, icon: <div className="h-1.5 w-1.5 rounded-full bg-current" /> },
    offline: { variant: 'secondary' as const, icon: <div className="h-1.5 w-1.5 rounded-full bg-current" /> },
    away: { variant: 'warning' as const, icon: <div className="h-1.5 w-1.5 rounded-full bg-current" /> },
    busy: { variant: 'destructive' as const, icon: <div className="h-1.5 w-1.5 rounded-full bg-current" /> },
    pending: { variant: 'warning' as const, animation: 'pulse' as const },
    approved: { variant: 'success' as const },
    rejected: { variant: 'destructive' as const },
  }

  const config = statusConfig[status]
  
  return (
    <Badge 
      variant={config.variant}
      animation={config.animation}
      icon={config.icon}
      {...props}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Count badge for notifications
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  showZero?: boolean
}

function CountBadge({ count, max = 99, showZero = false, ...props }: CountBadgeProps) {
  if (count === 0 && !showZero) return null
  
  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <Badge 
      variant="destructive" 
      size="sm"
      className="min-w-[1.25rem] h-5 flex items-center justify-center px-1"
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

// Dot badge for indicators
export interface DotBadgeProps extends Omit<BadgeProps, 'children'> {
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'gray'
  size?: 'sm' | 'default' | 'lg'
}

function DotBadge({ color = 'red', size = 'default', ...props }: DotBadgeProps) {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
  }

  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  return (
    <div 
      className={cn(
        'rounded-full',
        colorClasses[color],
        sizeClasses[size],
        'animate-pulse'
      )}
      {...props}
    />
  )
}

export { 
  Badge, 
  StatusBadge, 
  CountBadge, 
  DotBadge,
  badgeVariants 
}
