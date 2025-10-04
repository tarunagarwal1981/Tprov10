import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FileX, Search, Inbox, AlertCircle, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        error: "text-destructive",
        warning: "text-yellow-600 dark:text-yellow-400",
        success: "text-green-600 dark:text-green-400",
        info: "text-blue-600 dark:text-blue-400",
      },
      size: {
        sm: "py-8 px-4",
        default: "py-12 px-6",
        lg: "py-16 px-8",
        xl: "py-20 px-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }
  illustration?: React.ReactNode
  loading?: boolean
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    variant,
    size,
    icon,
    title,
    description,
    action,
    secondaryAction,
    illustration,
    loading = false,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn(emptyStateVariants({ variant, size, className }))} {...props}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <div className="h-4 w-32 bg-muted rounded mb-2" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn(emptyStateVariants({ variant, size, className }))} {...props}>
        {/* Illustration or Icon */}
        <div className="mb-4">
          {illustration ? (
            <div className="max-w-xs mx-auto">
              {illustration}
            </div>
          ) : icon ? (
            <div className="rounded-full bg-muted p-3 mb-4">
              {icon}
            </div>
          ) : (
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileX className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {action && (
              <Button
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="min-w-[120px]"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                onClick={secondaryAction.onClick}
                className="min-w-[120px]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// Predefined empty state variants
export interface NoDataEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  dataType?: string
  onCreate?: () => void
  onRefresh?: () => void
}

const NoDataEmptyState = React.forwardRef<HTMLDivElement, NoDataEmptyStateProps>(
  ({ dataType = "data", onCreate, onRefresh, ...props }, ref) => {
    return (
      <EmptyState
        ref={ref}
        icon={<FileX className="h-6 w-6" />}
        title={`No ${dataType} found`}
        description={`There are no ${dataType} to display at the moment.`}
        action={onCreate ? {
          label: `Create ${dataType}`,
          onClick: onCreate,
        } : undefined}
        secondaryAction={onRefresh ? {
          label: "Refresh",
          onClick: onRefresh,
          variant: "outline",
        } : undefined}
        {...props}
      />
    )
  }
)
NoDataEmptyState.displayName = "NoDataEmptyState"

export interface SearchEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  searchTerm?: string
  onClearSearch?: () => void
  onNewSearch?: () => void
}

const SearchEmptyState = React.forwardRef<HTMLDivElement, SearchEmptyStateProps>(
  ({ searchTerm, onClearSearch, onNewSearch, ...props }, ref) => {
    return (
      <EmptyState
        ref={ref}
        icon={<Search className="h-6 w-6" />}
        title="No results found"
        description={searchTerm ? `No results found for "${searchTerm}". Try adjusting your search terms.` : "No results found for your search."}
        action={onNewSearch ? {
          label: "New Search",
          onClick: onNewSearch,
        } : undefined}
        secondaryAction={onClearSearch ? {
          label: "Clear Search",
          onClick: onClearSearch,
          variant: "outline",
        } : undefined}
        {...props}
      />
    )
  }
)
SearchEmptyState.displayName = "SearchEmptyState"

export interface ErrorEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  error?: string
  onRetry?: () => void
  onGoBack?: () => void
}

const ErrorEmptyState = React.forwardRef<HTMLDivElement, ErrorEmptyStateProps>(
  ({ error, onRetry, onGoBack, ...props }, ref) => {
    return (
      <EmptyState
        ref={ref}
        variant="error"
        icon={<AlertCircle className="h-6 w-6" />}
        title="Something went wrong"
        description={error || "An unexpected error occurred. Please try again."}
        action={onRetry ? {
          label: "Try Again",
          onClick: onRetry,
        } : undefined}
        secondaryAction={onGoBack ? {
          label: "Go Back",
          onClick: onGoBack,
          variant: "outline",
        } : undefined}
        {...props}
      />
    )
  }
)
ErrorEmptyState.displayName = "ErrorEmptyState"

export interface InboxEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  inboxType?: string
  onCreate?: () => void
}

const InboxEmptyState = React.forwardRef<HTMLDivElement, InboxEmptyStateProps>(
  ({ inboxType = "messages", onCreate, ...props }, ref) => {
    return (
      <EmptyState
        ref={ref}
        icon={<Inbox className="h-6 w-6" />}
        title={`Your ${inboxType} inbox is empty`}
        description={`You don't have any ${inboxType} yet. When you do, they'll appear here.`}
        action={onCreate ? {
          label: `Create ${inboxType.slice(0, -1)}`,
          onClick: onCreate,
        } : undefined}
        {...props}
      />
    )
  }
)
InboxEmptyState.displayName = "InboxEmptyState"

// Loading empty state
export interface LoadingEmptyStateProps extends Omit<EmptyStateProps, 'loading'> {
  message?: string
}

const LoadingEmptyState = React.forwardRef<HTMLDivElement, LoadingEmptyStateProps>(
  ({ message = "Loading...", ...props }, ref) => {
    return (
      <EmptyState
        ref={ref}
        loading={true}
        title={message}
        {...props}
      />
    )
  }
)
LoadingEmptyState.displayName = "LoadingEmptyState"

export { 
  EmptyState,
  NoDataEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  InboxEmptyState,
  LoadingEmptyState,
  emptyStateVariants
}
