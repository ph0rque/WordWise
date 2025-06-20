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
}

export function TextEditor({
  initialDocument,
  onSave,
  onDelete,
  onNew,
  onSelect,
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

  // Grammar checking function
  const debouncedGrammarCheck = useDebouncedCallback(async (text: string) => {
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
      // Use ChatGPT for all grammar and spelling checking
      const suggestions = await checkAcademicGrammarClient(text, {
        academicLevel: 'high-school',
      })
      
      setSuggestions(suggestions)
      updateHighlights(suggestions)
    } catch (error) {
      console.error('Grammar check failed:', error)
      setSuggestions([])
      updateHighlights([])
    } finally {
      setIsCheckingGrammar(false)
    }
  }, 50) // Reduced debounce since we're triggering less frequently

  // Initial grammar check for existing content
  useEffect(() => {
    if (editorRef.current && initialDocument.content) {
      const plainText = editorRef.current.textContent || ""
      if (plainText.length > 5) {
        // Delay initial check to ensure editor is fully loaded
        setTimeout(() => {
          debouncedGrammarCheck(plainText)
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
      }
    } catch (error) {
      console.error("Error in debouncedSave:", error)
    }
    setIsSaving(false)
  }, 1500)

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
      
      // Trigger grammar check after a short delay to allow the character to be inserted
      setTimeout(() => {
        debouncedGrammarCheck(plainText + e.key)
      }, 10)
    }
   }

  const handlePaste = (e: React.ClipboardEvent) => {
    // Trigger grammar check after paste with a delay
    setTimeout(() => {
      if (editorRef.current) {
        const plainText = editorRef.current.textContent || ""
        if (plainText.length > 5) {
          debouncedGrammarCheck(plainText)
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
          
          // Track when user starts correcting an error
          span.addEventListener('click', () => {
            setIsUserCorrecting(true)
            // Reset after a delay to allow for corrections
            setTimeout(() => setIsUserCorrecting(false), 3000)
          })
          
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
    
    const rect = target.getBoundingClientRect()
    tooltip.style.left = `${rect.left}px`
    tooltip.style.top = `${rect.bottom + 5}px`
    
    document.body.appendChild(tooltip)
    
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
    <div className="flex h-full flex-col relative bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-gray-50/50 p-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Document title..."
          className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-gray-400"
        />
        <div className="flex items-center gap-2">
          <DocumentActions
            onNew={onNew}
            onSave={handleManualSave}
            onDelete={() => onDelete(initialDocument.id)}
            onSwitch={() => setIsSwitching(true)}
            isSaving={isSaving}
            documentId={initialDocument.id}
            documentTitle={title}
          />
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
      <div className="flex-1 overflow-y-auto relative">
        <div className="relative h-full">
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
