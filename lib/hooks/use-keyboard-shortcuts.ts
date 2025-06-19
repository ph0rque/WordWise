import { useEffect, useCallback } from 'react'

export interface ShortcutAction {
  id: string
  name: string
  description: string
  keys: string[]
  category: 'formatting' | 'navigation' | 'academic' | 'document' | 'ai'
  action: () => void
  condition?: () => boolean
}

export interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutAction[]
  enabled?: boolean
}

export interface KeyboardShortcutHelp {
  category: string
  shortcuts: Array<{
    name: string
    description: string
    keys: string[]
  }>
}

// Common keyboard shortcut utilities
export const getShortcutDisplay = (keys: string[]): string => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  return keys
    .map(key => {
      switch (key.toLowerCase()) {
        case 'cmd':
        case 'meta':
          return isMac ? '⌘' : 'Ctrl'
        case 'ctrl':
          return isMac ? '⌘' : 'Ctrl'
        case 'alt':
          return isMac ? '⌥' : 'Alt'
        case 'shift':
          return isMac ? '⇧' : 'Shift'
        case 'enter':
          return '↵'
        case 'space':
          return '␣'
        case 'backspace':
          return '⌫'
        case 'delete':
          return '⌦'
        case 'tab':
          return '⇥'
        case 'escape':
          return '⎋'
        case 'arrowup':
          return '↑'
        case 'arrowdown':
          return '↓'
        case 'arrowleft':
          return '←'
        case 'arrowright':
          return '→'
        default:
          return key.toUpperCase()
      }
    })
    .join(' + ')
}

// Check if a keyboard event matches a shortcut definition
const matchesShortcut = (event: KeyboardEvent, keys: string[]): boolean => {
  const pressedKeys: string[] = []
  
  if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl')
  if (event.altKey) pressedKeys.push('alt')
  if (event.shiftKey) pressedKeys.push('shift')
  
  // Add the main key
  const mainKey = event.key.toLowerCase()
  if (!['control', 'meta', 'alt', 'shift'].includes(mainKey)) {
    pressedKeys.push(mainKey)
  }
  
  const shortcutKeys = keys.map(key => key.toLowerCase())
  
  // Check if all shortcut keys are pressed and no extra modifiers
  return shortcutKeys.length === pressedKeys.length &&
         shortcutKeys.every(key => pressedKeys.includes(key))
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in input fields (unless specifically allowed)
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true'
    
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut.keys)) {
        // Check condition if provided
        if (shortcut.condition && !shortcut.condition()) {
          continue
        }
        
        // For input fields, only allow certain shortcuts
        if (isInputField) {
          const allowedInInputs = ['document', 'academic', 'ai']
          if (!allowedInInputs.includes(shortcut.category)) {
            continue
          }
        }
        
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (!enabled) return
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  // Generate help content for display
  const getShortcutHelp = useCallback((): KeyboardShortcutHelp[] => {
    const categories = Array.from(new Set(shortcuts.map(s => s.category)))
    
    return categories.map(category => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      shortcuts: shortcuts
        .filter(s => s.category === category)
        .map(s => ({
          name: s.name,
          description: s.description,
          keys: s.keys
        }))
    }))
  }, [shortcuts])

  return {
    getShortcutHelp
  }
}

// Predefined academic writing shortcuts
export const createAcademicWritingShortcuts = (actions: {
  // Document actions
  saveDocument: () => void
  newDocument: () => void
  
  // Writing mode actions
  switchToDraft: () => void
  switchToRevision: () => void
  switchToFinal: () => void
  
  // Academic writing actions
  insertFiveParagraphTemplate: () => void
  insertArgumentativeTemplate: () => void
  insertCompareContrastTemplate: () => void
  
  // Academic phrases
  insertTransitionPhrase: () => void
  insertEvidencePhrase: () => void
  insertConclusionPhrase: () => void
  
  // Formatting actions
  makeBold: () => void
  makeItalic: () => void
  insertBulletList: () => void
  insertNumberedList: () => void
  
  // AI and tools
  openAITutor: () => void
  checkGrammar: () => void
  showWordCount: () => void
  
  // Navigation
  focusEditor: () => void
  showShortcutHelp: () => void
  
  // Conditions
  isEditorFocused?: () => boolean
  hasText?: () => boolean
}): ShortcutAction[] => [
  // Document shortcuts
  {
    id: 'save-document',
    name: 'Save Document',
    description: 'Save your current essay',
    keys: ['ctrl', 's'],
    category: 'document',
    action: actions.saveDocument
  },
  {
    id: 'new-document',
    name: 'New Document',
    description: 'Create a new essay',
    keys: ['ctrl', 'n'],
    category: 'document',
    action: actions.newDocument
  },
  
  // Writing mode shortcuts
  {
    id: 'draft-mode',
    name: 'Draft Mode',
    description: 'Switch to draft writing mode',
    keys: ['ctrl', '1'],
    category: 'academic',
    action: actions.switchToDraft
  },
  {
    id: 'revision-mode',
    name: 'Revision Mode',
    description: 'Switch to revision mode',
    keys: ['ctrl', '2'],
    category: 'academic',
    action: actions.switchToRevision
  },
  {
    id: 'final-mode',
    name: 'Final Mode',
    description: 'Switch to final editing mode',
    keys: ['ctrl', '3'],
    category: 'academic',
    action: actions.switchToFinal
  },
  
  // Template shortcuts
  {
    id: 'insert-five-paragraph',
    name: '5-Paragraph Template',
    description: 'Insert 5-paragraph essay template',
    keys: ['ctrl', 'shift', '5'],
    category: 'academic',
    action: actions.insertFiveParagraphTemplate
  },
  {
    id: 'insert-argumentative',
    name: 'Argumentative Template',
    description: 'Insert argumentative essay template',
    keys: ['ctrl', 'shift', 'a'],
    category: 'academic',
    action: actions.insertArgumentativeTemplate
  },
  {
    id: 'insert-compare-contrast',
    name: 'Compare & Contrast Template',
    description: 'Insert compare and contrast template',
    keys: ['ctrl', 'shift', 'c'],
    category: 'academic',
    action: actions.insertCompareContrastTemplate
  },
  
  // Academic phrase shortcuts
  {
    id: 'insert-transition',
    name: 'Transition Phrase',
    description: 'Insert a transition phrase',
    keys: ['ctrl', 't'],
    category: 'academic',
    action: actions.insertTransitionPhrase,
    condition: actions.isEditorFocused
  },
  {
    id: 'insert-evidence',
    name: 'Evidence Phrase',
    description: 'Insert an evidence introduction phrase',
    keys: ['ctrl', 'e'],
    category: 'academic',
    action: actions.insertEvidencePhrase,
    condition: actions.isEditorFocused
  },
  {
    id: 'insert-conclusion',
    name: 'Conclusion Phrase',
    description: 'Insert a conclusion phrase',
    keys: ['ctrl', 'shift', 'e'],
    category: 'academic',
    action: actions.insertConclusionPhrase,
    condition: actions.isEditorFocused
  },
  
  // Formatting shortcuts
  {
    id: 'bold-text',
    name: 'Bold Text',
    description: 'Make selected text bold',
    keys: ['ctrl', 'b'],
    category: 'formatting',
    action: actions.makeBold,
    condition: actions.isEditorFocused
  },
  {
    id: 'italic-text',
    name: 'Italic Text',
    description: 'Make selected text italic',
    keys: ['ctrl', 'i'],
    category: 'formatting',
    action: actions.makeItalic,
    condition: actions.isEditorFocused
  },
  {
    id: 'bullet-list',
    name: 'Bullet List',
    description: 'Insert bullet list',
    keys: ['ctrl', 'shift', 'l'],
    category: 'formatting',
    action: actions.insertBulletList,
    condition: actions.isEditorFocused
  },
  {
    id: 'numbered-list',
    name: 'Numbered List',
    description: 'Insert numbered list',
    keys: ['ctrl', 'shift', 'n'],
    category: 'formatting',
    action: actions.insertNumberedList,
    condition: actions.isEditorFocused
  },
  
  // AI and tools shortcuts
  {
    id: 'open-ai-tutor',
    name: 'AI Writing Tutor',
    description: 'Open AI writing tutor',
    keys: ['ctrl', 'shift', 'i'],
    category: 'ai',
    action: actions.openAITutor
  },
  {
    id: 'check-grammar',
    name: 'Check Grammar',
    description: 'Run grammar check',
    keys: ['ctrl', 'g'],
    category: 'ai',
    action: actions.checkGrammar,
    condition: actions.hasText
  },
  {
    id: 'show-word-count',
    name: 'Word Count',
    description: 'Show writing statistics',
    keys: ['ctrl', 'w'],
    category: 'document',
    action: actions.showWordCount
  },
  
  // Navigation shortcuts
  {
    id: 'focus-editor',
    name: 'Focus Editor',
    description: 'Focus on the text editor',
    keys: ['ctrl', '/'],
    category: 'navigation',
    action: actions.focusEditor
  },
  {
    id: 'show-help',
    name: 'Show Keyboard Shortcuts',
    description: 'Show this help dialog',
    keys: ['ctrl', 'shift', '?'],
    category: 'navigation',
    action: actions.showShortcutHelp
  }
]

// Academic phrase collections for quick insertion
export const ACADEMIC_PHRASE_COLLECTIONS = {
  transitions: [
    'Furthermore,',
    'Moreover,',
    'In addition,',
    'However,',
    'Nevertheless,',
    'On the other hand,',
    'Consequently,',
    'As a result,',
    'For instance,',
    'Similarly,'
  ],
  evidence: [
    'According to',
    'Research indicates that',
    'Studies have shown that',
    'Evidence suggests that',
    'Data reveals that',
    'Experts argue that',
    'This demonstrates that',
    'The findings indicate that'
  ],
  conclusions: [
    'In conclusion,',
    'To summarize,',
    'Therefore,',
    'Ultimately,',
    'In summary,',
    'As a result,',
    'Finally,',
    'To conclude,'
  ]
}

// Get random phrase from collection
export const getRandomPhrase = (collection: keyof typeof ACADEMIC_PHRASE_COLLECTIONS): string => {
  const phrases = ACADEMIC_PHRASE_COLLECTIONS[collection]
  return phrases[Math.floor(Math.random() * phrases.length)]
} 