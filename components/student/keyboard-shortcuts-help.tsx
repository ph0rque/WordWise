"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Keyboard,
  Search,
  BookOpen,
  PenTool,
  Settings,
  Zap,
  ArrowUpDown,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getShortcutDisplay, type KeyboardShortcutHelp } from "@/lib/hooks/use-keyboard-shortcuts"

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcutHelp[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ShortcutItemProps {
  name: string
  description: string
  keys: string[]
  searchTerm?: string
}

function ShortcutItem({ name, description, keys, searchTerm }: ShortcutItemProps) {
  const highlightText = (text: string, term: string) => {
    if (!term) return text
    
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </span>
      ) : part
    )
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-white">
          {searchTerm ? highlightText(name, searchTerm) : name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {searchTerm ? highlightText(description, searchTerm) : description}
        </div>
      </div>
      <div className="flex items-center space-x-1 ml-4">
        {keys.map((key, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {getShortcutDisplay([key])}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function CategoryIcon({ category }: { category: string }) {
  switch (category.toLowerCase()) {
    case 'academic':
      return <BookOpen className="h-4 w-4" />
    case 'formatting':
      return <PenTool className="h-4 w-4" />
    case 'document':
      return <Settings className="h-4 w-4" />
    case 'ai':
      return <Zap className="h-4 w-4" />
    case 'navigation':
      return <ArrowUpDown className="h-4 w-4" />
    default:
      return <Keyboard className="h-4 w-4" />
  }
}

function CategoryCard({ category, shortcuts, searchTerm }: {
  category: KeyboardShortcutHelp
  shortcuts: KeyboardShortcutHelp['shortcuts']
  searchTerm: string
}) {
  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filteredShortcuts.length === 0) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <CategoryIcon category={category.category} />
          <span>{category.category}</span>
          <Badge variant="outline" className="text-xs">
            {filteredShortcuts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {filteredShortcuts.map((shortcut, index) => (
          <ShortcutItem
            key={index}
            name={shortcut.name}
            description={shortcut.description}
            keys={shortcut.keys}
            searchTerm={searchTerm}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function KeyboardShortcutsHelp({ 
  shortcuts, 
  trigger, 
  open, 
  onOpenChange 
}: KeyboardShortcutsHelpProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredShortcuts = shortcuts.filter(category => {
    if (selectedCategory && category.category !== selectedCategory) {
      return false
    }
    
    if (!searchTerm) return true
    
    return category.shortcuts.some(shortcut =>
      shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const allCategories = shortcuts.map(s => s.category)
  const totalShortcuts = shortcuts.reduce((sum, cat) => sum + cat.shortcuts.length, 0)

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center space-x-2">
      <Keyboard className="h-4 w-4" />
      <span className="hidden sm:inline">Keyboard Shortcuts</span>
      <Badge variant="secondary" className="text-xs">
        {getShortcutDisplay(['ctrl', 'shift', '?'])}
      </Badge>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
            <Badge variant="secondary">{totalShortcuts} shortcuts</Badge>
          </DialogTitle>
          <DialogDescription>
            Speed up your academic writing with these keyboard shortcuts. Perfect for high school essays!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shortcuts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {allCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Tips for Students */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Quick Tips for Students:
                </div>
                <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
                  <li>• Start with <strong>Ctrl+Shift+5</strong> for a 5-paragraph template</li>
                  <li>• Use <strong>Ctrl+T</strong> while writing to insert transition phrases</li>
                  <li>• Press <strong>Ctrl+1/2/3</strong> to switch between Draft/Revision/Final modes</li>
                  <li>• <strong>Ctrl+S</strong> saves your work automatically</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {filteredShortcuts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Keyboard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No shortcuts found matching your search.</p>
                <p className="text-sm mt-1">Try searching for "template", "phrase", or "mode"</p>
              </div>
            ) : (
              filteredShortcuts.map((category) => (
                <CategoryCard
                  key={category.category}
                  category={category}
                  shortcuts={category.shortcuts}
                  searchTerm={searchTerm}
                />
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            💡 Tip: Most shortcuts work while typing in the editor. 
            Use <strong>{getShortcutDisplay(['ctrl', 'shift', '?'])}</strong> anytime to open this help.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick reference component for showing shortcuts inline
export function QuickShortcutReference({ shortcuts }: { shortcuts: string[] }) {
  return (
    <div className="flex items-center space-x-1">
      {shortcuts.map((shortcut, index) => (
        <Badge 
          key={index}
          variant="secondary" 
          className="text-xs font-mono bg-gray-100 dark:bg-gray-700"
        >
          {getShortcutDisplay([shortcut])}
        </Badge>
      ))}
    </div>
  )
}

// Floating shortcut hint component
interface FloatingShortcutHintProps {
  shortcut: string[]
  description: string
  show: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function FloatingShortcutHint({ 
  shortcut, 
  description, 
  show, 
  position = 'top',
  className 
}: FloatingShortcutHintProps) {
  if (!show) return null

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  return (
    <div className={cn(
      "absolute z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg",
      "flex items-center space-x-2 whitespace-nowrap",
      positionClasses[position],
      "animate-in fade-in-0 zoom-in-95 duration-200",
      className
    )}>
      <span>{description}</span>
      <QuickShortcutReference shortcuts={shortcut} />
      <div className={cn(
        "absolute w-2 h-2 bg-gray-900 rotate-45",
        position === 'top' && 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2',
        position === 'bottom' && 'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2',
        position === 'left' && 'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2',
        position === 'right' && 'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2'
      )} />
    </div>
  )
} 