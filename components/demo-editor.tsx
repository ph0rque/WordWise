"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkGrammar } from "@/lib/grammar-checker"
import type { Suggestion, SuggestionType } from "@/lib/types"
import { SuggestionCard } from "@/components/suggestion-card"
import { TextStats } from "@/components/text-stats"

export function DemoEditor() {
  const [text, setText] = useState<string>(
    "Welcome to WordWise! This is a demo version. Try typing some text with grammer mistakes or spelling erors to see suggestions.",
  )
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeTab, setActiveTab] = useState<string>("editor")

  useEffect(() => {
    // Suppress ResizeObserver errors
    const resizeObserverErrorHandler = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.stopImmediatePropagation()
      }
    }

    window.addEventListener("error", resizeObserverErrorHandler)

    return () => {
      window.removeEventListener("error", resizeObserverErrorHandler)
    }
  }, [])

  useEffect(() => {
    // Debounce the grammar check to avoid checking on every keystroke
    const timer = setTimeout(() => {
      if (text.trim()) {
        const results = checkGrammar(text)
        setSuggestions(results)
      } else {
        setSuggestions([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [text])

  const applySuggestion = (suggestion: Suggestion) => {
    const before = text.substring(0, suggestion.position)
    const after = text.substring(suggestion.position + suggestion.originalText.length)
    setText(before + suggestion.suggestedText + after)

    // Remove the applied suggestion
    setSuggestions(
      suggestions.filter((s) => !(s.position === suggestion.position && s.originalText === suggestion.originalText)),
    )
  }

  const getSuggestionCount = (type: SuggestionType) => {
    return suggestions.filter((s) => s.type === type).length
  }

  const getIconForType = (type: SuggestionType) => {
    switch (type) {
      case "grammar":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "spelling":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "style":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-7xl px-4 py-8 mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-600">WordWise</h1>
          <p className="mt-2 text-slate-600">Write with confidence</p>
        </header>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Demo Mode:</strong> This is a demonstration version of WordWise. To enable user authentication and
            document storage, please configure your Supabase project.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Editor */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    {getSuggestionCount("grammar") > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getSuggestionCount("grammar")}
                      </Badge>
                    )}
                    {getSuggestionCount("spelling") > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        {getSuggestionCount("spelling")}
                      </Badge>
                    )}
                    {getSuggestionCount("style") > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
                        <Info className="w-3 h-3" />
                        {getSuggestionCount("style")}
                      </Badge>
                    )}
                    {suggestions.length === 0 && text.length > 20 && (
                      <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        All good
                      </Badge>
                    )}
                  </div>
                </div>

                <TabsContent value="editor" className="mt-0">
                  <Card>
                    <CardContent className="p-4">
                      <Textarea
                        placeholder="Start typing here... We'll check your grammar, spelling, and style."
                        className="min-h-[400px] border-none focus-visible:ring-0 resize-none text-base"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{ resize: "none" }}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-0">
                  <Card>
                    <CardContent className="p-4">
                      <TextStats text={text} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Suggestions</h2>
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      suggestion={suggestion}
                      onApply={() => applySuggestion(suggestion)}
                      icon={getIconForType(suggestion.type)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center">
                    {text.length > 20 ? (
                      <div className="py-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                        <p className="text-slate-600">Your text looks good!</p>
                        <p className="text-sm text-slate-500 mt-1">No issues detected.</p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Info className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-600">Start typing to see suggestions</p>
                        <p className="text-sm text-slate-500 mt-1">We'll analyze your text as you write.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>© 2025 WordWise. A simplified Grammarly clone with document storage.</p>
        </footer>
      </div>
    </main>
  )
}
