"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react"

interface MobileResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

interface MobileTabsProps extends React.ComponentProps<'div'> {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    content: React.ReactNode
  }>
  defaultTab?: string
  onTabChange?: (tabId: string) => void
}

interface MobileCardGridProps {
  children: React.ReactNode
  className?: string
  minCardWidth?: string
}

interface TouchOptimizedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  touchSize?: 'sm' | 'md' | 'lg'
}

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  side?: 'left' | 'right'
}

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

// Hook for detecting mobile devices and screen sizes
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setScreenWidth(width)
      
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { deviceType, screenWidth, isMobile: deviceType === 'mobile', isTablet: deviceType === 'tablet' }
}

// Mobile-first responsive layout container
export function MobileResponsiveLayout({ 
  children, 
  sidebar, 
  header, 
  footer, 
  className 
}: MobileResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isMobile, isTablet } = useDeviceType()

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-purple-50", className)}>
      {/* Mobile Header */}
      {header && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            {sidebar && isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2 h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">{header}</div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebar && !isMobile && (
          <div className="w-64 xl:w-80 flex-shrink-0 hidden md:block">
            <div className="sticky top-16 h-screen overflow-y-auto">
              {sidebar}
            </div>
          </div>
        )}

        {/* Mobile Sidebar Drawer */}
        {sidebar && isMobile && (
          <MobileDrawer 
            open={sidebarOpen} 
            onOpenChange={setSidebarOpen}
            side="left"
          >
            {sidebar}
          </MobileDrawer>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "container mx-auto p-4",
            isMobile ? "px-3 py-4" : "px-6 py-8"
          )}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      {footer && (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 md:hidden">
          {footer}
        </div>
      )}
    </div>
  )
}

// Mobile-optimized tabs component
export function MobileTabs({ 
  tabs, 
  defaultTab, 
  onTabChange, 
  className,
  ...props 
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const { isMobile } = useDeviceType()

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  if (isMobile) {
    return (
      <div className={cn("w-full", className)} {...props}>
        {/* Mobile Tab Navigation - Scrollable */}
        <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <div className="flex space-x-1 min-w-max px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 whitespace-nowrap px-4 py-2 h-9",
                    activeTab === tab.id && "bg-blue-600 text-white"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="text-sm font-medium">{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "transition-all duration-200",
                activeTab === tab.id ? "block" : "hidden"
              )}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop tabs (standard)
  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "transition-all duration-200",
              activeTab === tab.id ? "block" : "hidden"
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile-optimized card grid
export function MobileCardGrid({ 
  children, 
  className, 
  minCardWidth = "280px" 
}: MobileCardGridProps) {
  const { isMobile, isTablet } = useDeviceType()

  return (
    <div 
      className={cn(
        "grid gap-4",
        isMobile 
          ? "grid-cols-1" 
          : isTablet 
            ? "grid-cols-2" 
            : `grid-cols-[repeat(auto-fit,minmax(${minCardWidth},1fr))]`,
        className
      )}
    >
      {children}
    </div>
  )
}

// Touch-optimized button component
export function TouchOptimizedButton({ 
  children, 
  touchSize = 'md', 
  className, 
  ...props 
}: TouchOptimizedButtonProps) {
  const { isMobile } = useDeviceType()

  const sizeClasses = {
    sm: isMobile ? "h-12 px-4 text-sm" : "h-9 px-3 text-sm",
    md: isMobile ? "h-14 px-6 text-base" : "h-10 px-4 text-sm",
    lg: isMobile ? "h-16 px-8 text-lg" : "h-11 px-8 text-base"
  }

  return (
    <Button
      className={cn(
        sizeClasses[touchSize],
        "transition-all duration-150 active:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

// Mobile drawer component
export function MobileDrawer({ 
  open, 
  onOpenChange, 
  children, 
  title, 
  side = 'left' 
}: MobileDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-out md:hidden",
          side === 'left' ? "left-0" : "right-0",
          side === 'left' 
            ? (open ? "translate-x-0" : "-translate-x-full")
            : (open ? "translate-x-0" : "translate-x-full"),
          "w-80 max-w-[85vw]"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="p-2 h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}

// Swipeable card component for mobile gestures
export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className 
}: SwipeableCardProps) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const threshold = 100
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    setCurrentX(0)
    setIsDragging(false)
  }

  return (
    <Card
      className={cn(
        "transition-transform duration-200 touch-pan-y",
        className
      )}
      style={{
        transform: isDragging ? `translateX(${currentX}px)` : 'translateX(0)'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Mobile-friendly spacing utilities
export const mobileSpacing = {
  container: "px-3 md:px-6 lg:px-8",
  section: "py-4 md:py-6 lg:py-8",
  card: "p-4 md:p-6",
  grid: "gap-3 md:gap-4 lg:gap-6",
  text: "text-sm md:text-base",
  heading: "text-lg md:text-xl lg:text-2xl"
}

// Mobile breakpoint utilities
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)'
} 