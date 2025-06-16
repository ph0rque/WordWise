interface TextStatsProps {
  text: string
}

export function TextStats({ text }: TextStatsProps) {
  // Calculate basic text statistics
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const characterCount = text.length
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length

  // Calculate average word length
  const words = text.trim().split(/\s+/).filter(Boolean)
  const avgWordLength = words.length > 0 ? Math.round((words.join("").length / words.length) * 10) / 10 : 0

  // Calculate estimated reading time (average reading speed: 200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  // Calculate readability score (simplified)
  // This is a very basic approximation of readability
  const readabilityScore = Math.max(
    0,
    Math.min(100, 100 - avgWordLength * 10 + (sentenceCount > 0 ? wordCount / sentenceCount : 0)),
  )

  const getReadabilityLevel = (score: number) => {
    if (score > 80) return "Very Easy"
    if (score > 60) return "Easy"
    if (score > 40) return "Medium"
    if (score > 20) return "Difficult"
    return "Very Difficult"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="text-2xl font-bold">{wordCount}</div>
          <div className="text-sm text-slate-500">Words</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="text-2xl font-bold">{characterCount}</div>
          <div className="text-sm text-slate-500">Characters</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="text-2xl font-bold">{sentenceCount}</div>
          <div className="text-sm text-slate-500">Sentences</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="text-2xl font-bold">{readingTimeMinutes} min</div>
          <div className="text-sm text-slate-500">Reading Time</div>
        </div>
      </div>

      {text.length > 0 && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Readability</span>
              <span className="text-sm text-slate-500">{getReadabilityLevel(readabilityScore)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${readabilityScore}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Avg. Word Length</span>
              <span className="text-sm text-slate-500">{avgWordLength} characters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
