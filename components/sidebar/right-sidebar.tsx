"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Bot, FileCheck, Search, SlidersHorizontal } from "lucide-react"
import { ChatPanel } from "@/components/tutor/chat-panel"
import type { Document } from "@/lib/types"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import ReadabilityDashboard from "@/components/analysis/readability-dashboard"
import VocabularyEnhancer from "@/components/analysis/vocabulary-enhancer"

interface RightSidebarProps {
  document: Document | null
  aiAvailable: boolean
}

function SuggestionsPanelPlaceholder() {
  return (
    <div className="p-4 text-center text-sm text-gray-500">
      <p>Suggestions will appear here as you write.</p>
    </div>
  )
}

export function RightSidebar({ document, aiAvailable }: RightSidebarProps) {
  const { canUseAITutor } = useRoleBasedFeatures()

  return (
    <div className="border-l bg-gray-50/50 h-full flex flex-col">
      <Tabs defaultValue="analysis" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <FileCheck className="mr-2 h-4 w-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 space-y-4">
          <ReadabilityDashboard analysis={undefined} isLoading={!document} />
          <VocabularyEnhancer text={document?.content} isLoading={!document} />
        </TabsContent>
        <TabsContent value="suggestions" className="flex-1 overflow-y-auto p-4">
          <SuggestionsPanelPlaceholder />
        </TabsContent>
      </Tabs>
      <div className="border-t p-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ai-tutor">
            <AccordionTrigger className="px-2">
              <div className="flex items-center">
                <Bot className="mr-2 h-4 w-4" />
                AI Tutor
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1">
              {document && canUseAITutor ? (
                <ChatPanel
                  documentId={document.id}
                  documentTitle={document.title}
                  aiAvailable={aiAvailable}
                  isStudent={true}
                />
              ) : (
                <p className="p-4 text-sm text-gray-500">
                  {canUseAITutor
                    ? "Select a document to use the AI Tutor."
                    : "The AI Tutor is not available for your account."}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
} 