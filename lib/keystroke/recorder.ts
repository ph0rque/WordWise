import { encrypt, decrypt } from '@/lib/utils/encryption'

export interface KeystrokeEvent {
  id: string
  timestamp: number
  type: 'keydown' | 'keyup' | 'input' | 'paste' | 'cut' | 'delete' | 'backspace'
  key?: string
  code?: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  target?: string
  value?: string
  selectionStart?: number
  selectionEnd?: number
  inputType?: string
  data?: string
}

export interface KeystrokeSession {
  id: string
  userId: string
  documentId: string
  startTime: number
  endTime?: number
  events: KeystrokeEvent[]
  metadata: {
    userAgent: string
    platform: string
    language: string
    timezone: string
    documentTitle: string
    totalKeystrokes: number
    totalCharacters: number
    averageWPM?: number
    pauseCount: number
    backspaceCount: number
    deleteCount: number
  }
  encrypted: boolean
}

export interface RecorderConfig {
  enableEncryption: boolean
  sampleRate: number // milliseconds between samples
  bufferSize: number // max events before auto-save
  enablePasteDetection: boolean
  enableSelectionTracking: boolean
  enableTimingAnalysis: boolean
  privacyMode: boolean // anonymize certain data
}

export class KeystrokeRecorder {
  private isRecording = false
  private session: KeystrokeSession | null = null
  private eventBuffer: KeystrokeEvent[] = []
  private config: RecorderConfig
  private listeners: { [key: string]: EventListener } = {}
  private lastKeystrokeTime = 0
  private pauseThreshold = 2000 // 2 seconds
  private wpmCalculationInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<RecorderConfig> = {}) {
    this.config = {
      enableEncryption: false, // Disabled for simplicity
      sampleRate: 10, // 10ms precision
      bufferSize: 100,
      enablePasteDetection: true,
      enableSelectionTracking: true,
      enableTimingAnalysis: true,
      privacyMode: false, // Disabled for simplicity
      ...config
    }
  }

  /**
   * Start recording keystrokes for a document session
   */
  async startRecording(
    userId: string, 
    documentId: string, 
    documentTitle: string = 'Untitled Document'
  ): Promise<string> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress')
    }

    // Generate a proper UUID for the session ID
    const sessionId = crypto.randomUUID()
    
    this.session = {
      id: sessionId,
      userId,
      documentId,
      startTime: Date.now(),
      events: [],
      metadata: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        documentTitle,
        totalKeystrokes: 0,
        totalCharacters: 0,
        pauseCount: 0,
        backspaceCount: 0,
        deleteCount: 0
      },
      encrypted: this.config.enableEncryption
    }

    this.isRecording = true
    this.setupEventListeners()
    
    if (this.config.enableTimingAnalysis) {
      this.startWPMCalculation()
    }

    console.log(`Keystroke recording started for session: ${sessionId}`)
    return sessionId
  }

  /**
   * Stop recording and return the session data
   */
  async stopRecording(): Promise<KeystrokeSession | null> {
    if (!this.isRecording || !this.session) {
      return null
    }

    this.isRecording = false
    this.session.endTime = Date.now()
    
    // Process any remaining events in buffer
    if (this.eventBuffer.length > 0) {
      this.session.events.push(...this.eventBuffer)
      this.eventBuffer = []
    }

    // Calculate final metrics
    this.calculateFinalMetrics()
    
    // Clean up listeners
    this.removeEventListeners()
    
    if (this.wpmCalculationInterval) {
      clearInterval(this.wpmCalculationInterval)
      this.wpmCalculationInterval = null
    }

    // Encrypt session data if enabled
    if (this.config.enableEncryption) {
      await this.encryptSessionData()
    }

    const completedSession = { ...this.session }
    this.session = null

    console.log(`Keystroke recording stopped. Total events: ${completedSession.events.length}`)
    return completedSession
  }

  /**
   * Pause recording temporarily
   */
  pauseRecording(): void {
    if (!this.isRecording) return
    
    this.removeEventListeners()
    if (this.session) {
      this.session.metadata.pauseCount++
    }
    console.log('Keystroke recording paused')
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.isRecording || !this.session) return
    
    this.setupEventListeners()
    console.log('Keystroke recording resumed')
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): {
    isRecording: boolean
    sessionId: string | null
    eventCount: number
    duration: number
  } {
    return {
      isRecording: this.isRecording,
      sessionId: this.session?.id || null,
      eventCount: this.session?.events.length || 0,
      duration: this.session ? Date.now() - this.session.startTime : 0
    }
  }

  /**
   * Set up event listeners for keystroke capture
   */
  private setupEventListeners(): void {
    // Keyboard events
    this.listeners.keydown = this.handleKeydown.bind(this)
    this.listeners.keyup = this.handleKeyup.bind(this)
    
    // Input events
    this.listeners.input = this.handleInput.bind(this)
    this.listeners.paste = this.handlePaste.bind(this)
    this.listeners.cut = this.handleCut.bind(this)
    
    // Selection events
    if (this.config.enableSelectionTracking) {
      this.listeners.selectionchange = this.handleSelectionChange.bind(this)
    }

    // Add listeners to document
    document.addEventListener('keydown', this.listeners.keydown, true)
    document.addEventListener('keyup', this.listeners.keyup, true)
    document.addEventListener('input', this.listeners.input, true)
    document.addEventListener('paste', this.listeners.paste, true)
    document.addEventListener('cut', this.listeners.cut, true)
    
    if (this.config.enableSelectionTracking) {
      document.addEventListener('selectionchange', this.listeners.selectionchange, true)
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    Object.entries(this.listeners).forEach(([event, listener]) => {
      document.removeEventListener(event, listener, true)
    })
    this.listeners = {}
  }

  /**
   * Handle keydown events
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isRecording || !this.session) return

    const keystrokeEvent: KeystrokeEvent = {
      id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'keydown',
      key: this.config.privacyMode ? this.anonymizeKey(event.key) : event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getTargetIdentifier(event.target as Element)
    }

    this.recordEvent(keystrokeEvent)
    this.updateMetrics(keystrokeEvent)
  }

  /**
   * Handle keyup events
   */
  private handleKeyup(event: KeyboardEvent): void {
    if (!this.isRecording || !this.session) return

    const keystrokeEvent: KeystrokeEvent = {
      id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'keyup',
      key: this.config.privacyMode ? this.anonymizeKey(event.key) : event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getTargetIdentifier(event.target as Element)
    }

    this.recordEvent(keystrokeEvent)
  }

  /**
   * Handle input events
   */
  private handleInput(event: Event): void {
    if (!this.isRecording || !this.session) return

    const inputEvent = event as InputEvent
    const target = event.target as HTMLInputElement | HTMLTextAreaElement

    const keystrokeEvent: KeystrokeEvent = {
      id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'input',
      target: this.getTargetIdentifier(target),
      value: this.config.privacyMode ? this.anonymizeText(target.value || '') : target.value || '',
      selectionStart: target.selectionStart || 0,
      selectionEnd: target.selectionEnd || 0,
      inputType: inputEvent.inputType,
      data: this.config.privacyMode ? this.anonymizeText(inputEvent.data || '') : inputEvent.data || '',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false
    }

    this.recordEvent(keystrokeEvent)
    this.updateMetrics(keystrokeEvent)
  }

  /**
   * Handle paste events
   */
  private handlePaste(event: ClipboardEvent): void {
    if (!this.isRecording || !this.session || !this.config.enablePasteDetection) return

    const pastedData = event.clipboardData?.getData('text') || ''
    const target = event.target as HTMLInputElement | HTMLTextAreaElement

    const keystrokeEvent: KeystrokeEvent = {
      id: `paste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'paste',
      target: this.getTargetIdentifier(target),
      data: this.config.privacyMode ? this.anonymizeText(pastedData) : pastedData,
      selectionStart: target.selectionStart || 0,
      selectionEnd: target.selectionEnd || 0,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    }

    this.recordEvent(keystrokeEvent)
    this.session.metadata.totalCharacters += pastedData.length
  }

  /**
   * Handle cut events
   */
  private handleCut(event: ClipboardEvent): void {
    if (!this.isRecording || !this.session) return

    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    const selectedText = target.value.substring(
      target.selectionStart || 0, 
      target.selectionEnd || 0
    )

    const keystrokeEvent: KeystrokeEvent = {
      id: `cut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'cut',
      target: this.getTargetIdentifier(target),
      data: this.config.privacyMode ? this.anonymizeText(selectedText) : selectedText,
      selectionStart: target.selectionStart || 0,
      selectionEnd: target.selectionEnd || 0,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    }

    this.recordEvent(keystrokeEvent)
  }

  /**
   * Handle selection change events
   */
  private handleSelectionChange(): void {
    if (!this.isRecording || !this.session) return

    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const target = range.commonAncestorContainer

    const keystrokeEvent: KeystrokeEvent = {
      id: `selection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'input', // Using input type for selection changes
      target: this.getTargetIdentifier(target as Element),
      selectionStart: range.startOffset,
      selectionEnd: range.endOffset,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false
    }

    this.recordEvent(keystrokeEvent)
  }

  /**
   * Record an event to the buffer
   */
  private recordEvent(event: KeystrokeEvent): void {
    if (!this.session) return

    this.eventBuffer.push(event)
    
    // Auto-save buffer if it reaches the configured size
    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.flushBuffer()
    }

    this.lastKeystrokeTime = event.timestamp
  }

  /**
   * Flush the event buffer to the session
   */
  private flushBuffer(): void {
    if (!this.session || this.eventBuffer.length === 0) return

    this.session.events.push(...this.eventBuffer)
    this.eventBuffer = []
  }

  /**
   * Update session metrics based on event
   */
  private updateMetrics(event: KeystrokeEvent): void {
    if (!this.session) return

    this.session.metadata.totalKeystrokes++

    if (event.type === 'input' && event.data) {
      this.session.metadata.totalCharacters += event.data.length
    }

    if (event.key === 'Backspace') {
      this.session.metadata.backspaceCount++
    }

    if (event.key === 'Delete') {
      this.session.metadata.deleteCount++
    }

    // Detect pauses (periods of inactivity)
    if (this.lastKeystrokeTime > 0 && 
        event.timestamp - this.lastKeystrokeTime > this.pauseThreshold) {
      this.session.metadata.pauseCount++
    }
  }

  /**
   * Calculate final session metrics
   */
  private calculateFinalMetrics(): void {
    if (!this.session) return

    const duration = (this.session.endTime || Date.now()) - this.session.startTime
    const minutes = duration / (1000 * 60)
    
    if (minutes > 0 && this.session.metadata.totalCharacters > 0) {
      // Rough WPM calculation (assuming 5 characters per word)
      const calculatedWPM = (this.session.metadata.totalCharacters / 5) / minutes
      // Cap WPM at 999 to prevent database overflow (DECIMAL(5,2) max is 999.99)
      this.session.metadata.averageWPM = Math.min(999, Math.round(calculatedWPM))
    }
  }

  /**
   * Start WPM calculation interval
   */
  private startWPMCalculation(): void {
    this.wpmCalculationInterval = setInterval(() => {
      if (!this.session) return
      
      const duration = Date.now() - this.session.startTime
      const minutes = duration / (1000 * 60)
      
      if (minutes > 0 && this.session.metadata.totalCharacters > 0) {
        const calculatedWPM = (this.session.metadata.totalCharacters / 5) / minutes
        // Cap WPM at 999 to prevent database overflow (DECIMAL(5,2) max is 999.99)
        this.session.metadata.averageWPM = Math.min(999, Math.round(calculatedWPM))
      }
    }, 5000) // Update every 5 seconds
  }

  /**
   * Encrypt session data
   */
  private async encryptSessionData(): Promise<void> {
    if (!this.session || !this.config.enableEncryption) return

    try {
      // Encrypt sensitive event data
      for (const event of this.session.events) {
        if (event.key) {
          event.key = await encrypt(event.key)
        }
        if (event.value) {
          event.value = await encrypt(event.value)
        }
        if (event.data) {
          event.data = await encrypt(event.data)
        }
      }

      this.session.encrypted = true
    } catch (error) {
      console.error('Failed to encrypt keystroke data:', error)
      throw new Error('Encryption failed')
    }
  }

  /**
   * Get a safe identifier for the target element
   */
  private getTargetIdentifier(element: Element | Node | null): string {
    if (!element) return 'unknown'
    
    if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as Element
      const id = el.id ? `#${el.id}` : ''
      const className = el.className ? `.${el.className.split(' ').join('.')}` : ''
      const tagName = el.tagName.toLowerCase()
      
      return `${tagName}${id}${className}`.substring(0, 50) // Limit length
    }
    
    return element.nodeName.toLowerCase()
  }

  /**
   * Anonymize key data for privacy
   */
  private anonymizeKey(key: string): string {
    // Keep functional keys, anonymize content
    const functionalKeys = [
      'Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'ArrowUp', 
      'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 
      'PageDown', 'Insert', 'Control', 'Alt', 'Shift', 'Meta'
    ]
    
    if (functionalKeys.includes(key)) {
      return key
    }
    
    // Anonymize content keys
    if (key.length === 1) {
      if (/[a-zA-Z]/.test(key)) return 'L' // Letter
      if (/[0-9]/.test(key)) return 'N' // Number
      if (/[^\w\s]/.test(key)) return 'S' // Symbol
    }
    
    return 'X' // Unknown
  }

  /**
   * Anonymize text content for privacy
   */
  private anonymizeText(text: string | null | undefined): string {
    if (!text) return ''
    return text.replace(/[a-zA-Z]/g, 'X')
               .replace(/[0-9]/g, 'N')
               .replace(/[^\w\s]/g, 'S')
  }

  /**
   * Export session data for analysis
   */
  exportSession(): KeystrokeSession | null {
    return this.session ? { ...this.session } : null
  }

  /**
   * Get recording statistics
   */
  getStatistics(): {
    totalEvents: number
    duration: number
    averageWPM: number
    keystrokesPerMinute: number
    pauseCount: number
    backspacePercentage: number
  } | null {
    if (!this.session) return null

    const duration = (Date.now() - this.session.startTime) / (1000 * 60) // minutes
    const keystrokesPerMinute = duration > 0 ? this.session.metadata.totalKeystrokes / duration : 0
    const backspacePercentage = this.session.metadata.totalKeystrokes > 0 
      ? (this.session.metadata.backspaceCount / this.session.metadata.totalKeystrokes) * 100 
      : 0

    return {
      totalEvents: this.session.events.length + this.eventBuffer.length,
      duration: Date.now() - this.session.startTime,
      averageWPM: this.session.metadata.averageWPM || 0,
      keystrokesPerMinute: Math.round(keystrokesPerMinute),
      pauseCount: this.session.metadata.pauseCount,
      backspacePercentage: Math.round(backspacePercentage * 100) / 100
    }
  }
} 