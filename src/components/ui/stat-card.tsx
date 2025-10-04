import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FiTrendingUp, FiTrendingDown, FiMinus, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { cn } from "@/lib/utils"

const statCardVariants = cva(
  "relative overflow-hidden transition-all duration-200 ease-out hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        glass: "bg-card/80 backdrop-blur-md border-border/50",
        gradient: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
        success: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800",
        warning: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50 border-yellow-200 dark:border-yellow-800",
        destructive: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    period?: string
  }
  icon?: React.ReactNode
  iconColor?: string
  loading?: boolean
  empty?: boolean
  emptyState?: React.ReactNode
  onClick?: () => void
  href?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    className,
    variant,
    size,
    title,
    value,
    description,
    trend,
    icon,
    iconColor = "text-primary",
    loading = false,
    empty = false,
    emptyState,
    onClick,
    href,
    ...props
  }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    if (loading) {
      return (
        <Card className={cn(statCardVariants({ variant, size, className }))} ref={ref} {...props}>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      )
    }

    if (empty && emptyState) {
      return (
        <Card className={cn(statCardVariants({ variant, size, className }))} ref={ref} {...props}>
          <CardContent className="flex items-center justify-center py-8">
            {emptyState}
          </CardContent>
        </Card>
      )
    }

    const getTrendIcon = () => {
      if (!trend) return null
      
      if (trend.value > 0) {
        return <FiTrendingUp className="h-4 w-4 text-green-500" />
      } else if (trend.value < 0) {
        return <FiTrendingDown className="h-4 w-4 text-red-500" />
      } else {
        return <FiMinus className="h-4 w-4 text-gray-500" />
      }
    }

    const getTrendColor = () => {
      if (!trend) return ""
      
      if (trend.value > 0) {
        return "text-green-600 dark:text-green-400"
      } else if (trend.value < 0) {
        return "text-red-600 dark:text-red-400"
      } else {
        return "text-gray-600 dark:text-gray-400"
      }
    }

    const getTrendArrow = () => {
      if (!trend) return null
      
      if (trend.value > 0) {
        return <FiArrowUpRight className="h-3 w-3" />
      } else if (trend.value < 0) {
        return <FiArrowDownRight className="h-3 w-3" />
      }
      return null
    }

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cn(
            statCardVariants({ variant, size }),
            "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
            className
          )}
          href={href}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="space-y-3">
            {/* Header with title and icon */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              {icon && (
                <div className={cn("rounded-lg p-2 transition-colors", iconColor)}>
                  {icon}
                </div>
              )}
            </div>

            {/* Value */}
            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Trend */}
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={cn("font-medium", getTrendColor())}>
                    {Math.abs(trend.value)}%
                  </span>
                  {getTrendArrow()}
                </div>
                <span className="text-muted-foreground">
                  {trend.label}
                  {trend.period && ` ${trend.period}`}
                </span>
              </div>
            )}
          </CardContent>

          {/* Hover effect overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          )}
        </a>
      )
    }

    if (onClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cn(
            statCardVariants({ variant, size }),
            "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
            className
          )}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="space-y-3">
            {/* Header with title and icon */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              {icon && (
                <div className={cn("rounded-lg p-2 transition-colors", iconColor)}>
                  {icon}
                </div>
              )}
            </div>

            {/* Value */}
            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Trend */}
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={cn("font-medium", getTrendColor())}>
                    {Math.abs(trend.value)}%
                  </span>
                  {getTrendArrow()}
                </div>
                <span className="text-muted-foreground">
                  {trend.label}
                  {trend.period && ` ${trend.period}`}
                </span>
              </div>
            )}
          </CardContent>

          {/* Hover effect overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          )}
        </button>
      )
    }

    return (
      <Card
        ref={ref}
        className={cn(
          statCardVariants({ variant, size }),
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <CardContent className="space-y-3">
          {/* Header with title and icon */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {icon && (
              <div className={cn("rounded-lg p-2 transition-colors", iconColor)}>
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn("font-medium", getTrendColor())}>
                  {Math.abs(trend.value)}%
                </span>
                {getTrendArrow()}
              </div>
              <span className="text-muted-foreground">
                {trend.label}
                {trend.period && ` ${trend.period}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

// Stat card grid component
export interface StatCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "default" | "lg"
}

const StatCardGrid = React.forwardRef<HTMLDivElement, StatCardGridProps>(
  ({ className, columns = 4, gap = "default", children, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    }

    const gapClasses = {
      sm: "gap-3",
      default: "gap-4",
      lg: "gap-6",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridCols[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StatCardGrid.displayName = "StatCardGrid"

// Comparison stat card for showing before/after values
export interface ComparisonStatCardProps extends Omit<StatCardProps, 'trend'> {
  previousValue: string | number
  currentValue: string | number
  comparisonLabel?: string
}

const ComparisonStatCard = React.forwardRef<HTMLDivElement, ComparisonStatCardProps>(
  ({
    previousValue,
    currentValue,
    comparisonLabel = "vs previous period",
    ...props
  }, ref) => {
    const current = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue.toString())
    const previous = typeof previousValue === 'number' ? previousValue : parseFloat(previousValue.toString())
    
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0
    
    const trend = {
      value: change,
      label: comparisonLabel,
    }

    return (
      <StatCard
        ref={ref}
        trend={trend}
        {...props}
      />
    )
  }
)
ComparisonStatCard.displayName = "ComparisonStatCard"

export { 
  StatCard, 
  StatCardGrid, 
  ComparisonStatCard,
  statCardVariants 
}
