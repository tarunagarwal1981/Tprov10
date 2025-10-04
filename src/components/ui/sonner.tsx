"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:min-w-[300px] group-[.toaster]:max-w-[400px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors",
          closeButton:
            "group-[.toast]:absolute group-[.toast]:top-2 group-[.toast]:right-2 group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100 group-[.toast]:transition-opacity",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          success: "group-[.toast]:border-green-500/50 group-[.toast]:bg-green-50/50 dark:group-[.toast]:bg-green-950/50",
          error: "group-[.toast]:border-red-500/50 group-[.toast]:bg-red-50/50 dark:group-[.toast]:bg-red-950/50",
          warning: "group-[.toast]:border-yellow-500/50 group-[.toast]:bg-yellow-50/50 dark:group-[.toast]:bg-yellow-950/50",
          info: "group-[.toast]:border-blue-500/50 group-[.toast]:bg-blue-50/50 dark:group-[.toast]:bg-blue-950/50",
        },
      }}
      {...props}
    />
  )
}

// Enhanced toast functions with custom icons and actions
const toastSuccess = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return toast.success(message, {
    description,
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    duration: 4000,
  })
}

const toastError = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return toast.error(message, {
    description,
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    duration: 6000,
  })
}

const toastWarning = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return toast.warning(message, {
    description,
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    duration: 5000,
  })
}

const toastInfo = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return toast.info(message, {
    description,
    icon: <Info className="h-4 w-4 text-blue-500" />,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    duration: 4000,
  })
}

const toastLoading = (message: string, description?: string) => {
  return toast.loading(message, {
    description,
    duration: Infinity,
  })
}

const toastPromise = <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) => {
  return toast.promise(promise, {
    loading,
    success,
    error,
  })
}

// Custom toast with undo functionality
const toastWithUndo = (message: string, description?: string, undoAction?: () => void) => {
  return toast(message, {
    description,
    action: undoAction ? {
      label: "Undo",
      onClick: undoAction,
    } : undefined,
    duration: 5000,
  })
}

export { 
  Toaster, 
  toast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastPromise,
  toastWithUndo,
}
