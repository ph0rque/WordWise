"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Suggestion } from "@/lib/types"
import { useState } from "react"

interface SuggestionCardProps {
  suggestion: Suggestion
  onApply: () => void
  onIgnore?: () => void
  icon?: ReactNode
}

export function SuggestionCard({ suggestion, onApply, onIgnore, icon }: SuggestionCardProps) {
  const [isIgnored, setIsIgnored] = useState(false)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "grammar":
        return "Grammar"
      case "spelling":
        return "Spelling"
      case "style":
        return "Style"
      default:
        return "Suggestion"
    }
  }

  const handleIgnore = () => {
    setIsIgnored(true)
    // Optional: call onIgnore callback if provided
    if (onIgnore) {
      onIgnore()
    }
  }

  if (isIgnored) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 bg-slate-50 border-b flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{getTypeLabel(suggestion.type)}</span>
        </div>
        <div className="p-3">
          <p className="text-sm mb-2">
            <span className="line-through text-red-500">{suggestion.originalText}</span>
            {" → "}
            <span className="text-emerald-600 font-medium">{suggestion.suggestedText}</span>
          </p>
          <p className="text-xs text-slate-500 mb-3">{suggestion.explanation}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleIgnore}>
              Ignore
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
