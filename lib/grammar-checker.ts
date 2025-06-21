import type { Suggestion, SuggestionType } from "./types"

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

// Capitalization rules
const capitalizationRules = [
  {
    // Check for sentences starting with lowercase letters
    pattern: /([.!?]\s+)([a-z])/g,
    check: (match: string, text: string, index: number) => {
      const punctuation = match.match(/([.!?]\s+)/)?.[1] || ""
      const lowercaseLetter = match.match(/([a-z])$/)?.[1] || ""
      
      return {
        type: "grammar",
        position: index + punctuation.length,
        originalText: lowercaseLetter,
        suggestedText: lowercaseLetter.toUpperCase(),
        explanation: "Sentences should start with a capital letter.",
      }
    },
  },
  {
    // Check for text starting with lowercase (beginning of document)
    pattern: /^([a-z])/,
    check: (match: string, text: string, index: number) => {
      return {
        type: "grammar",
        position: index,
        originalText: match,
        suggestedText: match.toUpperCase(),
        explanation: "Text should start with a capital letter.",
      }
    },
  },
  {
    // Check for proper nouns that should be capitalized (common ones)
    pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|america|england|france|germany|japan|china|india|canada|australia|brazil|russia|italy|spain|mexico|africa|asia|europe|north america|south america|united states|new york|california|texas|florida|london|paris|tokyo|beijing|moscow|rome|madrid|english|spanish|french|german|chinese|japanese|russian|italian|portuguese|arabic|hindi|christmas|easter|thanksgiving|halloween|new year)\b/g,
    check: (match: string, text: string, index: number) => {
      // Check if it's already capitalized
      if (match[0] === match[0].toUpperCase()) return null
      
      return {
        type: "grammar",
        position: index,
        originalText: match,
        suggestedText: match.charAt(0).toUpperCase() + match.slice(1),
        explanation: `"${match}" should be capitalized as it's a proper noun.`,
      }
    },
  },
]

// Punctuation rules
const punctuationRules = [
  {
    // Missing periods at end of sentences
    pattern: /[a-zA-Z]\s*$/,
    check: (match: string, text: string, index: number) => {
      // Only suggest if this looks like the end of a complete sentence
      const words = text.trim().split(/\s+/)
      if (words.length >= 5) { // Only suggest for longer content
        return {
          type: "grammar",
          position: text.length - 1,
          originalText: "",
          suggestedText: ".",
          explanation: "Consider ending your sentence with a period.",
        }
      }
      return null
    },
  },
  {
    // Double spaces after periods
    pattern: /\.\s{2,}/g,
    check: (match: string, text: string, index: number) => {
      return {
        type: "style",
        position: index + 1,
        originalText: match.substring(1),
        suggestedText: " ",
        explanation: "Use only one space after a period.",
      }
    },
  },
  {
    // Missing comma in lists (very basic check)
    pattern: /\b(\w+)\s+(and|or)\s+(\w+)\s+(and|or)\s+(\w+)\b/g,
    check: (match: string, text: string, index: number) => {
      // Check if there are already commas
      if (match.includes(',')) return null
      
      const parts = match.split(/\s+/)
      if (parts.length === 5) { // word and/or word and/or word
        const suggestion = `${parts[0]}, ${parts[1]} ${parts[2]}, ${parts[3]} ${parts[4]}`
        return {
          type: "style",
          position: index,
          originalText: match,
          suggestedText: suggestion,
          explanation: "Consider using commas in lists for clarity.",
        }
      }
      return null
    },
  },
  {
    // Apostrophe errors in possessives (basic patterns)
    pattern: /\b(\w+)s\s+([\w]+)\b/g,
    check: (match: string, text: string, index: number) => {
      // Very basic check for missing apostrophe in possessives
      const parts = match.split(/\s+/)
      const firstWord = parts[0]
      const secondWord = parts[1]
      
      // Simple heuristic: if first word ends in 's' and second word could be possessed
      if (firstWord.endsWith('s') && 
          !firstWord.endsWith('ss') && 
          secondWord.match(/^(house|car|book|phone|computer|job|friend|family|idea|plan|dream|goal|hope)$/)) {
        return {
          type: "grammar",
          position: index + firstWord.length - 1,
          originalText: "s",
          suggestedText: "'s",
          explanation: "Use an apostrophe to show possession.",
        }
      }
      return null
    },
  },
  {
    // Missing comma before "but", "and", "or" in compound sentences (basic)
    pattern: /\b([A-Z]\w+.*?)\s+(but|and|or)\s+([A-Z]\w+.*?)\b/g,
    check: (match: string, text: string, index: number) => {
      // Only suggest if this looks like two independent clauses
      const parts = match.split(/\s+(but|and|or)\s+/)
      if (parts.length === 3) {
        const beforeConjunction = parts[0]
        const conjunction = parts[1]
        const afterConjunction = parts[2]
        
        // Simple check: if both parts have verbs, suggest comma
        if (beforeConjunction.match(/\b(is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|might|may)\b/) &&
            afterConjunction.match(/\b(is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|might|may)\b/)) {
          return {
            type: "style",
            position: index + beforeConjunction.length,
            originalText: ` ${conjunction}`,
            suggestedText: `, ${conjunction}`,
            explanation: "Use a comma before coordinating conjunctions in compound sentences.",
          }
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
    check: (match: RegExpExecArray) => {
      return {
        type: "style" as const,
        position: match.index || 0,
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
    } as const,
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
        suggestions.push({
          ...suggestion,
          type: suggestion.type as SuggestionType
        })
      }
    }
  })

  // Check capitalization rules
  capitalizationRules.forEach((rule) => {
    let match
    while ((match = rule.pattern.exec(text)) !== null) {
      const suggestion = rule.check(match[0], text, match.index)
      if (suggestion) {
        suggestions.push({
          ...suggestion,
          type: suggestion.type as SuggestionType
        })
      }
    }
  })

  // Check punctuation rules
  punctuationRules.forEach((rule) => {
    let match
    while ((match = rule.pattern.exec(text)) !== null) {
      const suggestion = rule.check(match[0], text, match.index)
      if (suggestion) {
        suggestions.push({
          ...suggestion,
          type: suggestion.type as SuggestionType
        })
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
    if ('replacements' in rule && rule.replacements) {
      Object.keys(rule.replacements).forEach((phrase) => {
        const replacements = rule.replacements as Record<string, string>
        const regex = new RegExp(`\\b(${phrase})\\b`, "gi")
        let match
        while ((match = regex.exec(text)) !== null) {
          suggestions.push({
            type: "style",
            position: match.index,
            originalText: match[0],
            suggestedText: match[0].replace(phrase, replacements[phrase]),
            explanation: rule.explanation,
          })
        }
      })
    } else if ('check' in rule && rule.check) {
      let match
      while ((match = rule.pattern.exec(text)) !== null) {
        const suggestion = rule.check(match)
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }
    } else if ('replacement' in rule && rule.replacement) {
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
