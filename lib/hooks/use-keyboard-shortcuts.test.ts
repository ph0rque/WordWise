import { 
  getShortcutDisplay, 
  getRandomPhrase, 
  ACADEMIC_PHRASE_COLLECTIONS,
  createAcademicWritingShortcuts 
} from './use-keyboard-shortcuts'

describe('use-keyboard-shortcuts', () => {
  describe('getShortcutDisplay', () => {
    beforeEach(() => {
      // Mock navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      })
    })

    it('should display Mac keyboard symbols correctly', () => {
      expect(getShortcutDisplay(['cmd', 's'])).toBe('⌘ + S')
      expect(getShortcutDisplay(['ctrl', 'shift', '5'])).toBe('⌘ + ⇧ + 5')
      expect(getShortcutDisplay(['alt', 'enter'])).toBe('⌥ + ↵')
    })

    it('should display Windows keyboard symbols correctly', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      })

      expect(getShortcutDisplay(['ctrl', 's'])).toBe('Ctrl + S')
      expect(getShortcutDisplay(['ctrl', 'shift', '5'])).toBe('Ctrl + ⇧ + 5')
      expect(getShortcutDisplay(['alt', 'enter'])).toBe('Alt + ↵')
    })

    it('should handle special keys correctly', () => {
      expect(getShortcutDisplay(['escape'])).toBe('⎋')
      expect(getShortcutDisplay(['space'])).toBe('␣')
      expect(getShortcutDisplay(['tab'])).toBe('⇥')
      expect(getShortcutDisplay(['arrowup'])).toBe('↑')
    })

    it('should handle multiple keys correctly', () => {
      expect(getShortcutDisplay(['ctrl', 'alt', 'delete'])).toBe('⌘ + ⌥ + ⌦')
    })
  })

  describe('getRandomPhrase', () => {
    it('should return a phrase from the transitions collection', () => {
      const phrase = getRandomPhrase('transitions')
      expect(ACADEMIC_PHRASE_COLLECTIONS.transitions).toContain(phrase)
    })

    it('should return a phrase from the evidence collection', () => {
      const phrase = getRandomPhrase('evidence')
      expect(ACADEMIC_PHRASE_COLLECTIONS.evidence).toContain(phrase)
    })

    it('should return a phrase from the conclusions collection', () => {
      const phrase = getRandomPhrase('conclusions')
      expect(ACADEMIC_PHRASE_COLLECTIONS.conclusions).toContain(phrase)
    })

    it('should return different phrases when called multiple times', () => {
      const phrases = new Set()
      // Call 20 times to increase chance of getting different phrases
      for (let i = 0; i < 20; i++) {
        phrases.add(getRandomPhrase('transitions'))
      }
      // With 10 transition phrases, we should get at least 2 different ones in 20 tries
      expect(phrases.size).toBeGreaterThan(1)
    })
  })

  describe('ACADEMIC_PHRASE_COLLECTIONS', () => {
    it('should have all required collections', () => {
      expect(ACADEMIC_PHRASE_COLLECTIONS).toHaveProperty('transitions')
      expect(ACADEMIC_PHRASE_COLLECTIONS).toHaveProperty('evidence')
      expect(ACADEMIC_PHRASE_COLLECTIONS).toHaveProperty('conclusions')
    })

    it('should have non-empty arrays for all collections', () => {
      expect(ACADEMIC_PHRASE_COLLECTIONS.transitions.length).toBeGreaterThan(0)
      expect(ACADEMIC_PHRASE_COLLECTIONS.evidence.length).toBeGreaterThan(0)
      expect(ACADEMIC_PHRASE_COLLECTIONS.conclusions.length).toBeGreaterThan(0)
    })

    it('should have proper academic phrases', () => {
      // Check that transitions contain common transition words
      expect(ACADEMIC_PHRASE_COLLECTIONS.transitions).toContain('Furthermore,')
      expect(ACADEMIC_PHRASE_COLLECTIONS.transitions).toContain('However,')
      
      // Check that evidence contains proper academic starters
      expect(ACADEMIC_PHRASE_COLLECTIONS.evidence).toContain('According to')
      expect(ACADEMIC_PHRASE_COLLECTIONS.evidence).toContain('Research indicates that')
      
      // Check that conclusions contain proper conclusion starters
      expect(ACADEMIC_PHRASE_COLLECTIONS.conclusions).toContain('In conclusion,')
      expect(ACADEMIC_PHRASE_COLLECTIONS.conclusions).toContain('Therefore,')
    })
  })

  describe('createAcademicWritingShortcuts', () => {
    const mockActions = {
      saveDocument: jest.fn(),
      newDocument: jest.fn(),
      switchToDraft: jest.fn(),
      switchToRevision: jest.fn(),
      switchToFinal: jest.fn(),
      insertFiveParagraphTemplate: jest.fn(),
      insertArgumentativeTemplate: jest.fn(),
      insertCompareContrastTemplate: jest.fn(),
      insertTransitionPhrase: jest.fn(),
      insertEvidencePhrase: jest.fn(),
      insertConclusionPhrase: jest.fn(),
      makeBold: jest.fn(),
      makeItalic: jest.fn(),
      insertBulletList: jest.fn(),
      insertNumberedList: jest.fn(),
      openAITutor: jest.fn(),
      checkGrammar: jest.fn(),
      showWordCount: jest.fn(),
      focusEditor: jest.fn(),
      showShortcutHelp: jest.fn(),
      isEditorFocused: jest.fn(() => true),
      hasText: jest.fn(() => true)
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should create shortcuts with correct structure', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      
      expect(Array.isArray(shortcuts)).toBe(true)
      expect(shortcuts.length).toBeGreaterThan(0)
      
      // Check structure of first shortcut
      const firstShortcut = shortcuts[0]
      expect(firstShortcut).toHaveProperty('id')
      expect(firstShortcut).toHaveProperty('name')
      expect(firstShortcut).toHaveProperty('description')
      expect(firstShortcut).toHaveProperty('keys')
      expect(firstShortcut).toHaveProperty('category')
      expect(firstShortcut).toHaveProperty('action')
      expect(typeof firstShortcut.action).toBe('function')
    })

    it('should include all essential shortcuts', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      const shortcutIds = shortcuts.map(s => s.id)
      
      // Document shortcuts
      expect(shortcutIds).toContain('save-document')
      expect(shortcutIds).toContain('new-document')
      
      // Writing mode shortcuts
      expect(shortcutIds).toContain('draft-mode')
      expect(shortcutIds).toContain('revision-mode')
      expect(shortcutIds).toContain('final-mode')
      
      // Template shortcuts
      expect(shortcutIds).toContain('insert-five-paragraph')
      expect(shortcutIds).toContain('insert-argumentative')
      
      // Academic phrase shortcuts
      expect(shortcutIds).toContain('insert-transition')
      expect(shortcutIds).toContain('insert-evidence')
      expect(shortcutIds).toContain('insert-conclusion')
      
      // Formatting shortcuts
      expect(shortcutIds).toContain('bold-text')
      expect(shortcutIds).toContain('italic-text')
      
      // AI shortcuts
      expect(shortcutIds).toContain('open-ai-tutor')
      expect(shortcutIds).toContain('check-grammar')
      
      // Help shortcut
      expect(shortcutIds).toContain('show-help')
    })

    it('should have correct keyboard combinations', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      
      // Find specific shortcuts and check their key combinations
      const saveShortcut = shortcuts.find(s => s.id === 'save-document')
      expect(saveShortcut?.keys).toEqual(['ctrl', 's'])
      
      const draftShortcut = shortcuts.find(s => s.id === 'draft-mode')
      expect(draftShortcut?.keys).toEqual(['ctrl', '1'])
      
      const helpShortcut = shortcuts.find(s => s.id === 'show-help')
      expect(helpShortcut?.keys).toEqual(['ctrl', 'shift', '?'])
    })

    it('should execute actions when shortcuts are triggered', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      
      // Test save document shortcut
      const saveShortcut = shortcuts.find(s => s.id === 'save-document')
      saveShortcut?.action()
      expect(mockActions.saveDocument).toHaveBeenCalledTimes(1)
      
      // Test draft mode shortcut
      const draftShortcut = shortcuts.find(s => s.id === 'draft-mode')
      draftShortcut?.action()
      expect(mockActions.switchToDraft).toHaveBeenCalledTimes(1)
    })

    it('should categorize shortcuts correctly', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      
      const categories = ['document', 'academic', 'formatting', 'ai', 'navigation']
      const shortcutCategories = shortcuts.map(s => s.category)
      
      // Check that all shortcuts have valid categories
      shortcutCategories.forEach(category => {
        expect(categories).toContain(category)
      })
      
      // Check specific categorizations
      const saveShortcut = shortcuts.find(s => s.id === 'save-document')
      expect(saveShortcut?.category).toBe('document')
      
      const boldShortcut = shortcuts.find(s => s.id === 'bold-text')
      expect(boldShortcut?.category).toBe('formatting')
      
      const aiShortcut = shortcuts.find(s => s.id === 'open-ai-tutor')
      expect(aiShortcut?.category).toBe('ai')
    })

    it('should respect conditions when provided', () => {
      const shortcuts = createAcademicWritingShortcuts(mockActions)
      
      // Find shortcuts with conditions
      const boldShortcut = shortcuts.find(s => s.id === 'bold-text')
      expect(boldShortcut?.condition).toBeDefined()
      
      const grammarShortcut = shortcuts.find(s => s.id === 'check-grammar')
      expect(grammarShortcut?.condition).toBeDefined()
      
      // Test condition execution
      if (boldShortcut?.condition) {
        expect(boldShortcut.condition()).toBe(true)
        expect(mockActions.isEditorFocused).toHaveBeenCalled()
      }
    })
  })
}) 