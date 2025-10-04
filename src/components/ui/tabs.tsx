"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { FiChevronDown } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { cn } from "@/lib/utils"

const tabsListVariants = cva(
  "inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        underline: "bg-transparent border-b border-border rounded-none p-0",
        pills: "bg-transparent p-0 gap-1",
        vertical: "flex-col h-auto w-auto bg-transparent p-0",
      },
      size: {
        sm: "h-8 text-xs",
        default: "h-9 text-sm",
        lg: "h-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {
  responsive?: boolean
  maxVisibleTabs?: number
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, size, responsive = false, maxVisibleTabs = 5, children, ...props }, ref) => {
  const [isMobile, setIsMobile] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("")
  const [hiddenTabs, setHiddenTabs] = React.useState<string[]>([])

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get tab values from children
  const tabValues = React.useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.props.value) {
        return child.props.value
      }
      return null
    }).filter(Boolean) as string[]
  }, [children])

  React.useEffect(() => {
    if (responsive && tabValues.length > maxVisibleTabs) {
      const visibleTabs = tabValues.slice(0, maxVisibleTabs - 1)
      const hidden = tabValues.slice(maxVisibleTabs - 1)
      setHiddenTabs(hidden)
      if (!activeTab && visibleTabs.length > 0) {
        setActiveTab(visibleTabs[0])
      }
    }
  }, [responsive, tabValues, maxVisibleTabs, activeTab])

  if (responsive && isMobile && tabValues.length > maxVisibleTabs) {
    const visibleTabs = tabValues.slice(0, maxVisibleTabs - 1)
    const hidden = tabValues.slice(maxVisibleTabs - 1)
    
    return (
      <div className="flex items-center gap-2">
        <TabsPrimitive.List
          ref={ref}
          className={cn(tabsListVariants({ variant, size, className }))}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (index < maxVisibleTabs - 1) {
              return child
            }
            return null
          })}
        </TabsPrimitive.List>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-2">
              <FiChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hidden.map((tabValue) => (
              <DropdownMenuItem key={tabValue} onClick={() => setActiveTab(tabValue)}>
                {React.Children.map(children, (child) => {
                  if (React.isValidElement(child) && child.props.value === tabValue) {
                    return child.props.children
                  }
                  return null
                })}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        underline: "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none",
        pills: "rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        vertical: "w-full justify-start data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-1",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode
  badge?: string | number
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, size, icon, badge, badgeVariant = "default", children, ...props }, ref) => {
  const badgeVariants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-input bg-background text-foreground",
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <div className="flex items-center">{icon}</div>}
        {children}
        {badge && (
          <span className={cn(
            "ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
            badgeVariants[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Animated tabs with indicator
export interface AnimatedTabsProps {
  tabs: Array<{
    value: string
    label: string
    icon?: React.ReactNode
    badge?: string | number
    content: React.ReactNode
  }>
  defaultValue?: string
  variant?: "default" | "underline" | "pills"
  size?: "sm" | "default" | "lg"
  className?: string
}

const AnimatedTabs = React.forwardRef<HTMLDivElement, AnimatedTabsProps>(
  ({ tabs, defaultValue, variant = "default", size = "default", className, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value)
    const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})

    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

    React.useEffect(() => {
      const activeIndex = tabs.findIndex(tab => tab.value === activeTab)
      const activeTabRef = tabRefs.current[activeIndex]
      
      if (activeTabRef && variant === "underline") {
        const { offsetLeft, offsetWidth } = activeTabRef
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        })
      }
    }, [activeTab, variant, tabs])

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="relative">
            <TabsList variant={variant} size={size}>
              {tabs.map((tab, index) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  variant={variant}
                  size={size}
                  icon={tab.icon}
                  badge={tab.badge}
                  ref={(el) => (tabRefs.current[index] = el)}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {variant === "underline" && (
              <div
                className="absolute bottom-0 h-0.5 bg-primary transition-all duration-200 ease-out"
                style={indicatorStyle}
              />
            )}
          </div>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }
)
AnimatedTabs.displayName = "AnimatedTabs"

const Tabs = TabsPrimitive.Root

export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  AnimatedTabs,
  tabsListVariants,
  tabsTriggerVariants,
}
