import type { Suggestion } from "./types"

// Common grammar mistakes patterns
const grammarRules = [
  {
    pattern: /\b(its|it's)\b/g,
    check: (match: string, text: string, index: number) => {
      // Check for possessive vs contraction
      const nextChar = text.charAt(index + match.length)
      const prevChar = index > 0 ? text.charAt(index - 1) : ""

      if (
        match === "its" &&
        nextChar === " " &&
        text.substring(index + match.length + 1, index + match.length + 3) === "a "
      ) {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "it's",
          explanation: "'It's' is the contraction of 'it is' or 'it has'.",
        }
      }

      if (
        match === "it's" &&
        nextChar === " " &&
        text.substring(index + match.length + 1, index + match.length + 4) === "own"
      ) {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "its",
          explanation: "'Its' is the possessive form of 'it'.",
        }
      }

      return null
    },
  },
  {
    pattern: /\b(your|you're)\b/g,
    check: (match: string, text: string, index: number) => {
      // Simple check for your vs you're
      if (match === "your" && text.substring(index + match.length, index + match.length + 5) === " the ") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "you're",
          explanation: "'You're' is the contraction of 'you are'.",
        }
      }

      if (match === "you're" && text.substring(index + match.length, index + match.length + 5) === " book") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "your",
          explanation: "'Your' indicates possession.",
        }
      }

      return null
    },
  },
  {
    pattern: /\b(there|their|they're)\b/g,
    check: (match: string, text: string, index: number) => {
      // Simple check for there/their/they're
      if (match === "there" && text.substring(index + match.length, index + match.length + 7) === " going ") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "they're",
          explanation: "'They're' is the contraction of 'they are'.",
        }
      }

      if (match === "their" && text.substring(index + match.length, index + match.length + 4) === " is ") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "there",
          explanation: "'There' refers to a place or is used to introduce a sentence.",
        }
      }

      return null
    },
  },
  {
    pattern: /\b(to|too|two)\b/g,
    check: (match: string, text: string, index: number) => {
      // Simple check for to/too/two
      if (match === "to" && text.substring(index + match.length, index + match.length + 6) === " many ") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "too",
          explanation: "'Too' means 'excessively' or 'also'.",
        }
      }

      return null
    },
  },
  {
    pattern: /\bi\b/g,
    check: (match: string, text: string, index: number) => {
      // Check for lowercase 'i'
      if (match === "i" && text.charAt(index - 1) === " " && text.charAt(index + 1) === " ") {
        return {
          type: "grammar",
          position: index,
          originalText: match,
          suggestedText: "I",
          explanation: "The pronoun 'I' should always be capitalized.",
        }
      }

      return null
    },
  },
]

// Common spelling mistakes
const spellingRules = [
  {
    pattern: /\b(definately|definatly)\b/gi,
    replacement: "definitely",
    explanation: "The correct spelling is 'definitely'.",
  },
  {
    pattern: /\b(seperate)\b/gi,
    replacement: "separate",
    explanation: "The correct spelling is 'separate'.",
  },
  {
    pattern: /\b(recieve)\b/gi,
    replacement: "receive",
    explanation: "Remember: 'i' before 'e' except after 'c'.",
  },
  {
    pattern: /\b(alot)\b/gi,
    replacement: "a lot",
    explanation: "'A lot' should be written as two separate words.",
  },
  {
    pattern: /\b(occured|occuring)\b/gi,
    replacement: (match: string) => match.replace(/occur/, "occur"),
    explanation: "Words derived from 'occur' double the 'r'.",
  },
]

// Style suggestions
const styleRules = [
  {
    pattern: /\b(very|really|extremely)\b\s+\w+/gi,
    check: (match: string) => {
      return {
        type: "style",
        position: match.index,
        originalText: match[0],
        suggestedText: match[0].replace(/very|really|extremely/i, ""),
        explanation: "Consider using a stronger word instead of an intensifier.",
      }
    },
  },
  {
    pattern: /\b(in order to|due to the fact that)\b/gi,
    replacements: {
      "in order to": "to",
      "due to the fact that": "because",
    },
    explanation: "Consider using a more concise alternative.",
  },
  {
    pattern: /\b(utilize)\b/gi,
    replacement: "use",
    explanation: "'Use' is often clearer than 'utilize'.",
  },
]

// Passive voice detection (simplified)
const passiveVoicePatterns = [/\b(am|is|are|was|were|be|being|been)\s+(\w+ed|built|done|made|put|sent)\b/gi]

export function checkGrammar(text: string): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Check grammar rules
  grammarRules.forEach((rule) => {
    let match
    while ((match = rule.pattern.exec(text)) !== null) {
      const suggestion = rule.check(match[0], text, match.index)
      if (suggestion) {
        suggestions.push(suggestion)
      }
    }
  })

  // Check spelling
  spellingRules.forEach((rule) => {
    let match
    while ((match = rule.pattern.exec(text)) !== null) {
      const replacement = typeof rule.replacement === "function" ? rule.replacement(match[0]) : rule.replacement

      suggestions.push({
        type: "spelling",
        position: match.index,
        originalText: match[0],
        suggestedText: replacement,
        explanation: rule.explanation,
      })
    }
  })

  // Check style
  styleRules.forEach((rule) => {
    if (rule.pattern && rule.replacements) {
      Object.keys(rule.replacements).forEach((phrase) => {
        const regex = new RegExp(`\\b(${phrase})\\b`, "gi")
        let match
        while ((match = regex.exec(text)) !== null) {
          suggestions.push({
            type: "style",
            position: match.index,
            originalText: match[0],
            suggestedText: match[0].replace(phrase, rule.replacements[phrase]),
            explanation: rule.explanation,
          })
        }
      })
    }
  })

  // Add some demo suggestions if the text contains certain words
  if (text.toLowerCase().includes("grammer")) {
    suggestions.push({
      type: "spelling",
      position: text.toLowerCase().indexOf("grammer"),
      originalText: "grammer",
      suggestedText: "grammar",
      explanation: "The correct spelling is 'grammar'.",
    })
  }

  if (text.toLowerCase().includes("i am going to")) {
    suggestions.push({
      type: "style",
      position: text.toLowerCase().indexOf("i am going to"),
      originalText: "I am going to",
      suggestedText: "I will",
      explanation: "Consider using 'will' for a more concise sentence.",
    })
  }

  if (text.toLowerCase().includes("in my opinion")) {
    suggestions.push({
      type: "style",
      position: text.toLowerCase().indexOf("in my opinion"),
      originalText: "In my opinion",
      suggestedText: "",
      explanation: "This phrase is often unnecessary. Consider removing it for more direct writing.",
    })
  }

  // Detect passive voice (simplified)
  passiveVoicePatterns.forEach((pattern) => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      suggestions.push({
        type: "style",
        position: match.index,
        originalText: match[0],
        suggestedText: match[0], // We don't suggest a replacement, just highlight
        explanation: "Consider using active voice for more direct and engaging writing.",
      })
    }
  })

  return suggestions
}
