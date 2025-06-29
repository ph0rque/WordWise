"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Document, Suggestion } from "@/lib/types"
import { useDebouncedCallback } from "use-debounce"
import { DocumentActions } from "./editor/document-actions"
import { DocumentSwitcherDialog } from "./editor/document-switcher-dialog"
import { Badge } from "@/components/ui/badge"
import { checkAcademicGrammarClient } from "@/lib/client-academic-grammar-checker"
import { AutomaticRecorder, AutomaticRecorderRef } from "@/components/keystroke/automatic-recorder"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { X } from "lucide-react"
import { PanelRight } from "lucide-react"

// Extend Window interface for global suggestion storage
declare global {
  interface Window {
    currentSuggestions: Map<string, Suggestion>
  }
}

interface TextEditorProps {
  initialDocument: Document
  onSave: (document: Document) => void
  onDelete: (documentId: string) => void
  onNew: () => void
  onSelect: (document: Document) => void
  onUnselect: () => void
  isRightSidebarCollapsed?: boolean
  onExpandRightSidebar?: () => void
}

export function TextEditor({
  initialDocument,
  onSave,
  onDelete,
  onNew,
  onSelect,
  onUnselect,
  isRightSidebarCollapsed = false,
  onExpandRightSidebar,
}: TextEditorProps) {
  const [title, setTitle] = useState(initialDocument.title)
  const [content, setContent] = useState(initialDocument.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const [isUserCorrecting, setIsUserCorrecting] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<AutomaticRecorderRef>(null)
  const userId = initialDocument.user_id || 'anonymous-user'
  
  // Get user role for keystroke recording
  const { role, isStudent } = useUserRole()

  // Update content when document changes
  useEffect(() => {
    setContent(initialDocument.content)
    setTitle(initialDocument.title)
    if (editorRef.current && editorRef.current.innerHTML !== initialDocument.content) {
      editorRef.current.innerHTML = initialDocument.content || ""
      // Place cursor at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [initialDocument.content, initialDocument.title])

  // Grammar checking function - Enhanced for better performance and user experience
  const debouncedGrammarCheck = useDebouncedCallback(async (text: string, isIncremental = false, lastWordsOnly = false) => {
    // Don't check grammar if user is currently correcting an error
    if (isUserCorrecting) {
      return
    }
    
    if (text.length < 5) {
      setSuggestions([])
      updateHighlights([])
      return
    }

    setIsCheckingGrammar(true)
    try {
      let textToCheck = text
      let positionOffset = 0
      
      // If this is incremental checking, only check the last few words
      if (isIncremental && lastWordsOnly && text.length > 50) {
        const words = text.split(/\s+/)
        const lastFewWords = words.slice(-15).join(' ') // Check last 15 words
        positionOffset = text.length - lastFewWords.length
        textToCheck = lastFewWords
        console.log('🔍 Incremental check: analyzing last 15 words:', lastFewWords.substring(0, 50) + '...')
      } else {
        console.log('🔍 Full document check: analyzing entire text')
      }
      
      // Use ChatGPT for all grammar and spelling checking
      const suggestions = await checkAcademicGrammarClient(textToCheck, {
        academicLevel: 'high-school',
      })
      
      // Adjust positions if we're doing incremental checking
      const adjustedSuggestions = isIncremental && lastWordsOnly && positionOffset > 0
        ? suggestions.map(s => ({ ...s, position: s.position + positionOffset }))
        : suggestions
      
      // For incremental checks, merge with existing suggestions
      if (isIncremental && lastWordsOnly) {
        setSuggestions(prevSuggestions => {
          // Remove old suggestions in the checked range
          const startPosition = positionOffset
          const endPosition = text.length
          const filteredPrevious = prevSuggestions.filter(s => 
            s.position < startPosition || s.position > endPosition
          )
          
          // Add new suggestions
          return [...filteredPrevious, ...adjustedSuggestions]
        })
      } else {
        setSuggestions(adjustedSuggestions)
      }
      
      // Update highlights with appropriate suggestions
      if (isIncremental && lastWordsOnly) {
        // For incremental updates, we need to get the current full suggestions list
        setSuggestions(currentSuggestions => {
          updateHighlights(currentSuggestions)
          return currentSuggestions
        })
      } else {
        updateHighlights(adjustedSuggestions)
      }
    } catch (error) {
      console.error('Grammar check failed:', error)
      if (!isIncremental) {
        setSuggestions([])
        updateHighlights([])
      }
    } finally {
      setIsCheckingGrammar(false)
    }
  }, 50) // Reduced debounce since we're smarter about what we check

  // Initial grammar check for existing content - Enhanced
  useEffect(() => {
    if (editorRef.current && initialDocument.content) {
      const plainText = editorRef.current.textContent || ""
      if (plainText.length > 5) {
        console.log('📄 Document loaded, performing full grammar check...')
        // Delay initial check to ensure editor is fully loaded
        setTimeout(() => {
          debouncedGrammarCheck(plainText, false, false) // Full document check
        }, 500)
      }
    }
  }, [initialDocument.id, debouncedGrammarCheck]) // Trigger when document changes

  const debouncedSave = useDebouncedCallback(async (newTitle: string, newContent: string) => {
    setIsSaving(true)
    try {
      const supabase = getSupabaseClient()
      
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError || !userData.user) {
        console.error("Error getting user for document save:", userError)
        setIsSaving(false)
        return
      }

      const { data, error } = await supabase
        .from("documents")
        .update({
          title: newTitle,
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialDocument.id)
        .eq("user_id", userData.user.id)
        .select()
        .single()

      if (error) {
        console.error("Error saving document:", error)
      } else if (data) {
        onSave(data)
        
        // Trigger AI analysis after successful save (only if there's content)
        if (newContent.trim() && newContent.trim().length > 50) {
          console.log('📊 Document saved, triggering AI analysis...')
          try {
            // Don't await this - let it run in background
            triggerAIAnalysis(newContent)
          } catch (analysisError) {
            console.error('Error triggering AI analysis:', analysisError)
            // Don't fail the save if analysis fails
          }
        }
      }
    } catch (error) {
      console.error("Error in debouncedSave:", error)
    }
    setIsSaving(false)
  }, 1500)

  // Function to trigger AI analysis in the background
  const triggerAIAnalysis = async (content: string) => {
    try {
      // This runs in the background and updates the analysis components
      await fetch('/api/analysis/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLevel: 'high-school',
          analysisType: 'comprehensive'
        })
      })
      console.log('✅ AI analysis triggered successfully (background)')
    } catch (error) {
      console.error('❌ Background AI analysis failed:', error)
      // Fail silently - this shouldn't interrupt the user's writing
    }
  }

  // Manual save function that stops recording
  const handleManualSave = async () => {
    console.log('💾 Manual save triggered, stopping keystroke recording...')
    
    // Stop keystroke recording when user manually saves
    if (recorderRef.current?.isRecording) {
      await recorderRef.current.stopRecording()
      console.log('⏹️ Keystroke recording stopped and session saved')
    }
    
    // Trigger the regular save
    await debouncedSave(title, content)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    debouncedSave(e.target.value, content)
  }

  const handleContentChange = () => {
    if (!editorRef.current) return
    
    // Store cursor position before updating
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)
    const cursorOffset = range ? range.startOffset : 0
    const cursorNode = range ? range.startContainer : null
    
    const newContent = editorRef.current.innerHTML
    setContent(newContent)
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (cursorNode && editorRef.current?.contains(cursorNode)) {
        try {
          const newRange = document.createRange()
          const sel = window.getSelection()
          newRange.setStart(cursorNode, Math.min(cursorOffset, cursorNode.textContent?.length || 0))
          newRange.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(newRange)
        } catch (error) {
          // Fallback: place cursor at end
          const range = document.createRange()
          const sel = window.getSelection()
          range.selectNodeContents(editorRef.current!)
          range.collapse(false)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      }
    }, 0)
    
    debouncedSave(title, newContent)
    // Note: Grammar checking is now handled by handleKeyDown for word completion
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editorRef.current) return
    
    // Check for word completion triggers
    const wordCompletionKeys = [
      ' ',      // Space
      '.',      // Period
      ',',      // Comma
      ';',      // Semicolon
      ':',      // Colon
      '!',      // Exclamation
      '?',      // Question mark
      '\n',     // Enter
      '\t'      // Tab
    ]
    
    if (wordCompletionKeys.includes(e.key)) {
      // Get the text content for grammar checking
      const plainText = editorRef.current.textContent || ""
      
      // Trigger incremental grammar check after a short delay to allow the character to be inserted
      setTimeout(() => {
        console.log('⌨️ Word completion detected, triggering incremental check...')
        debouncedGrammarCheck(plainText + e.key, true, true) // Incremental check of last words only
      }, 10)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    // Enhanced paste handling - check full document since paste can be substantial
    setTimeout(() => {
      if (editorRef.current) {
        const plainText = editorRef.current.textContent || ""
        if (plainText.length > 5) {
          console.log('📋 Paste detected, performing full grammar check...')
          debouncedGrammarCheck(plainText, false, false) // Full document check for paste
        }
      }
    }, 100)
  }

  const updateHighlights = (grammarSuggestions: Suggestion[]) => {
    if (!editorRef.current) {
      return
    }

    // Store suggestions in a global map for event handlers
    if (!window.currentSuggestions) {
      window.currentSuggestions = new Map()
    }
    window.currentSuggestions.clear()

    // Clear existing highlights first
    const existingHighlights = editorRef.current.querySelectorAll('.spelling-error, .grammar-error')
    existingHighlights.forEach(span => {
      const parent = span.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent || ''), span)
        parent.normalize() // Merge adjacent text nodes
      }
    })

    if (grammarSuggestions.length === 0) {
      return
    }

    // Save cursor position before DOM manipulation
    const selection = window.getSelection()
    let cursorPosition = 0
    let cursorNode: Node | null = null
    let cursorOffset = 0

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      cursorNode = range.startContainer
      cursorOffset = range.startOffset
      
      // Calculate cursor position in plain text
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )
      
      let textNode
      let position = 0
      while (textNode = walker.nextNode()) {
        if (textNode === cursorNode) {
          cursorPosition = position + cursorOffset
          break
        }
        position += textNode.textContent?.length || 0
      }
    }

    // Sort suggestions by position (reverse order to avoid position shifts)
    const sortedSuggestions = [...grammarSuggestions].sort((a, b) => b.position - a.position)

    // Apply highlights using proper DOM manipulation
    sortedSuggestions.forEach((suggestion, index) => {
      const { originalText, type } = suggestion
      
      // Create a unique ID for this suggestion
      const suggestionId = `suggestion-${Date.now()}-${index}`
      window.currentSuggestions.set(suggestionId, suggestion)
      
      // Find the text in the DOM using TreeWalker
      const walker = document.createTreeWalker(
        editorRef.current!,
        NodeFilter.SHOW_TEXT,
        null
      )
      
      let textNode
      while (textNode = walker.nextNode()) {
        const nodeText = textNode.textContent || ""
        const startIndex = nodeText.indexOf(originalText)
        
        if (startIndex !== -1) {
          // Split the text node and wrap the target text
          const beforeText = nodeText.substring(0, startIndex)
          const afterText = nodeText.substring(startIndex + originalText.length)
          
          const span = document.createElement('span')
          span.className = type === 'spelling' ? 'spelling-error' : 'grammar-error'
          span.style.cssText = type === 'spelling' 
            ? 'border-bottom: 2px solid #ef4444; cursor: help;'
            : 'background-color: rgba(37, 99, 235, 0.15); border-radius: 2px; cursor: help;'
          span.textContent = originalText
          span.setAttribute('data-suggestion-id', suggestionId)
          
          // Add event listeners directly to the span
          span.addEventListener('mouseenter', (e) => {
            const id = span.getAttribute('data-suggestion-id')
            if (id && window.currentSuggestions.has(id)) {
              showTooltip(span, window.currentSuggestions.get(id)!)
            }
          })
          
          span.addEventListener('mouseleave', (e) => {
            // Small delay to allow moving to tooltip itself
            setTimeout(() => {
              const tooltip = document.querySelector('.grammar-suggestion-tooltip')
              if (tooltip && !tooltip.matches(':hover') && !span.matches(':hover')) {
                hideTooltip()
              }
            }, 100)
          })
          
          // Enhanced: Immediately remove highlight when user starts editing this word
          const handleEditingStart = (e: Event) => {
            console.log('✏️ User started editing highlighted word, removing highlight...')
            // Immediately remove this highlight
            const parent = span.parentNode
            if (parent) {
              parent.replaceChild(document.createTextNode(span.textContent || ''), span)
              parent.normalize()
              
              // Hide any open tooltip
              hideTooltip()
              
              // Set correcting flag to prevent immediate re-checking
              setIsUserCorrecting(true)
              
              // After user finishes editing, re-check according to normal rules
              setTimeout(() => {
                setIsUserCorrecting(false)
                // Trigger a re-check of the area around where they were editing
                if (editorRef.current) {
                  const plainText = editorRef.current.textContent || ""
                  console.log('🔄 Re-checking after user edit...')
                  debouncedGrammarCheck(plainText, true, true) // Incremental check
                }
              }, 2000) // Give user time to finish their edit
            }
          }
          
          // Add multiple event listeners to catch editing start
          span.addEventListener('click', handleEditingStart)
          span.addEventListener('keydown', handleEditingStart)
          span.addEventListener('input', handleEditingStart)
          span.addEventListener('focus', handleEditingStart)
          
          const parent = textNode.parentNode!
          
          // Insert the new nodes
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), textNode)
          }
          parent.insertBefore(span, textNode)
          if (afterText) {
            parent.insertBefore(document.createTextNode(afterText), textNode)
          }
          parent.removeChild(textNode)
          
          break // Only replace first occurrence
        }
      }
    })

    // Restore cursor position
    setTimeout(() => {
      if (editorRef.current && cursorPosition > 0) {
        try {
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          )
          
          let textNode
          let position = 0
          while (textNode = walker.nextNode()) {
            const nodeLength = textNode.textContent?.length || 0
            if (position + nodeLength >= cursorPosition) {
              const range = document.createRange()
              const selection = window.getSelection()
              const offset = Math.min(cursorPosition - position, nodeLength)
              
              range.setStart(textNode, offset)
              range.collapse(true)
              selection?.removeAllRanges()
              selection?.addRange(range)
              break
            }
            position += nodeLength
          }
        } catch (error) {
          // Fallback: place cursor at end
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }
    }, 0)
  }

  const handleErrorHover = (event: Event, suggestion: Suggestion) => {
    showTooltip(event.target as HTMLElement, suggestion)
  }

  const handleErrorLeave = () => {
    hideTooltip()
  }

  const showTooltip = (target: HTMLElement, suggestion: Suggestion) => {
    // Don't show tooltip if there's no suggestion
    if (!suggestion || !suggestion.suggestedText) {
      return
    }
    
    hideTooltip()
    
    const tooltip = document.createElement('div')
    tooltip.className = 'grammar-suggestion-tooltip fixed bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs p-3 z-50'
    tooltip.setAttribute('data-tooltip-target', target.getAttribute('data-suggestion-id') || '')
    
    // Create the content structure properly
    const header = document.createElement('div')
    header.className = 'text-sm font-medium text-gray-900 mb-1'
    header.textContent = `${suggestion.type === 'spelling' ? 'Spelling' : 'Grammar'} Suggestion`
    
    const correction = document.createElement('div')
    correction.className = 'text-sm text-gray-600 mb-2'
    
    const originalSpan = document.createElement('span')
    originalSpan.className = 'line-through text-red-500'
    originalSpan.textContent = suggestion.originalText
    
    const arrow = document.createElement('span')
    arrow.className = 'mx-1'
    arrow.textContent = '→'
    
    const suggestedSpan = document.createElement('span')
    suggestedSpan.className = 'text-green-600 font-medium'
    suggestedSpan.textContent = suggestion.suggestedText
    
    correction.appendChild(originalSpan)
    correction.appendChild(arrow)
    correction.appendChild(suggestedSpan)
    
    const explanation = document.createElement('div')
    explanation.className = 'text-xs text-gray-500 mb-2'
    explanation.textContent = suggestion.explanation
    
    tooltip.appendChild(header)
    tooltip.appendChild(correction)
    tooltip.appendChild(explanation)
    
    // Add tooltip to DOM first to measure its height
    document.body.appendChild(tooltip)
    
    // Get positioning information
    const rect = target.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY
    
    // Calculate if tooltip would be cut off at bottom
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const tooltipHeight = tooltipRect.height
    
    // Position tooltip above if there's not enough space below but enough space above
    const shouldPositionAbove = spaceBelow < tooltipHeight + 10 && spaceAbove > tooltipHeight + 10
    
    // Set horizontal position (ensure it doesn't go off screen)
    const leftPosition = Math.max(10, Math.min(rect.left, window.innerWidth - tooltipRect.width - 10))
    tooltip.style.left = `${leftPosition}px`
    
    // Set vertical position
    if (shouldPositionAbove) {
      tooltip.style.top = `${rect.top - tooltipHeight - 5}px`
      // Add a visual indicator that tooltip is above (optional)
      tooltip.style.borderBottom = '2px solid #10b981'
    } else {
      tooltip.style.top = `${rect.bottom + 5}px`
      tooltip.style.borderTop = '2px solid #10b981'
    }
    
    // Add hover handlers to tooltip to prevent it from disappearing when hovering over it
    tooltip.addEventListener('mouseenter', () => {
      // Keep tooltip visible when hovering over it
    })
    
    tooltip.addEventListener('mouseleave', () => {
      // Hide tooltip when leaving it (unless still hovering over the error span)
      const errorSpan = document.querySelector(`[data-suggestion-id="${tooltip.getAttribute('data-tooltip-target')}"]`)
      if (!errorSpan || !errorSpan.matches(':hover')) {
        hideTooltip()
      }
    })
    
    // Add global event listeners to hide tooltip when clicking elsewhere or moving cursor
    const handleGlobalClick = (e: Event) => {
      const clickedElement = e.target as HTMLElement
      // Hide tooltip if clicking outside the error span or tooltip itself
      if (!clickedElement.closest('.spelling-error, .grammar-error, .grammar-suggestion-tooltip')) {
        hideTooltip()
      }
    }
    
    const handleCursorMove = () => {
      // Small delay to ensure selection has updated
      setTimeout(() => {
        // Check if cursor is still within the error span
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const currentNode = range.startContainer
          
          // Check if cursor is within the target error span
          let isWithinTarget = false
          let node: Node | null = currentNode
          while (node && node !== editorRef.current) {
            if (node === target || (node.nodeType === Node.ELEMENT_NODE && node === target)) {
              isWithinTarget = true
              break
            }
            node = node.parentNode
          }
          
          // Also check if the current selection intersects with the target element
          if (!isWithinTarget && target.contains && target.contains(currentNode)) {
            isWithinTarget = true
          }
          
          if (!isWithinTarget) {
            hideTooltip()
          }
        } else {
          // No selection, hide tooltip
          hideTooltip()
        }
      }, 10)
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hide tooltip on Escape or when user starts typing (except for navigation keys)
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']
      if (e.key === 'Escape' || (!navigationKeys.includes(e.key) && e.key.length === 1)) {
        hideTooltip()
      }
    }
    
    // Add event listeners
    document.addEventListener('click', handleGlobalClick, { once: true })
    document.addEventListener('selectionchange', handleCursorMove)
    document.addEventListener('keydown', handleKeyDown)
    
    // Auto-hide tooltip after 10 seconds as a fallback
    const autoHideTimeout = setTimeout(() => {
      hideTooltip()
    }, 10000)
    
    // Store cleanup function for this tooltip
    ;(tooltip as any)._cleanup = () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('selectionchange', handleCursorMove)
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(autoHideTimeout)
    }
  }

  const hideTooltip = () => {
    const existingTooltip = document.querySelector('.grammar-suggestion-tooltip')
    if (existingTooltip) {
      // Clean up event listeners if they exist
      if ((existingTooltip as any)._cleanup) {
        (existingTooltip as any)._cleanup()
      }
      existingTooltip.remove()
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      hideTooltip()
    }
  }, [])

  return (
    <div className="flex h-full flex-col relative bg-white min-h-0">
      {/* Header */}
      <div className="flex items-center border-b bg-gray-50/50 p-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnselect}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="Close document"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Document title..."
            className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <DocumentActions
            onNew={onNew}
            onSave={handleManualSave}
            onDelete={() => onDelete(initialDocument.id)}
            onSwitch={() => setIsSwitching(true)}
            isSaving={isSaving}
            documentId={initialDocument.id}
            documentTitle={title}
          />
          {/* Right sidebar expand button - only show when collapsed */}
          {isRightSidebarCollapsed && onExpandRightSidebar && (
            <Button
              onClick={onExpandRightSidebar}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-gray-200"
              title="Show writing tools and analysis"
            >
              <PanelRight className="h-4 w-4 text-gray-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Automatic Keystroke Recording - Only for Students, Invisible */}
      {isStudent && (
        <AutomaticRecorder
          ref={recorderRef}
          documentId={initialDocument.id}
          documentTitle={title}
          studentName={userId}
          editorRef={editorRef}
        />
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        <div className="relative min-h-full">
          {/* Content editable editor */}
          <div
            ref={editorRef}
            contentEditable
            spellCheck={false}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="prose prose-lg dark:prose-invert max-w-none mx-auto p-8 focus:outline-none min-h-full leading-relaxed"
            style={{ 
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              background: 'transparent'
            }}
            suppressContentEditableWarning={true}
          >
            {/* Content will be set via useEffect */}
          </div>
        </div>
      </div>

      <DocumentSwitcherDialog
        open={isSwitching}
        onOpenChange={setIsSwitching}
        onSelectDocument={onSelect}
        currentDocumentId={initialDocument.id}
      />
    </div>
  )
}
