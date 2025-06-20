"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Bot, SlidersHorizontal, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatPanel } from "@/components/tutor/chat-panel"
import type { Document } from "@/lib/types"
import { useRoleBasedFeatures } from "@/lib/hooks/use-user-role"
import ReadabilityDashboard from "@/components/analysis/readability-dashboard"
import VocabularyEnhancer from "@/components/analysis/vocabulary-enhancer"

interface RightSidebarProps {
  document: Document | null
  aiAvailable: boolean
  onCollapse?: () => void
}

export function RightSidebar({ document, aiAvailable, onCollapse }: RightSidebarProps) {
  const { canUseAITutor } = useRoleBasedFeatures()

  return (
    <div className="border-l bg-gray-50/50 h-full max-h-screen flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-white flex-shrink-0">
        <h2 className="text-sm font-medium text-gray-700">Writing Tools</h2>
        {onCollapse && (
          <Button
            onClick={onCollapse}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Hide writing tools for focused writing"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Tabs defaultValue="analysis" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="analysis">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="ai-tutor">
            <Bot className="mr-2 h-4 w-4" />
            AI Tutor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <ReadabilityDashboard analysis={undefined} isLoading={!document} />
          <VocabularyEnhancer text={document?.content} isLoading={!document} />
        </TabsContent>
        <TabsContent value="ai-tutor" className="flex-1 overflow-y-auto p-4 min-h-0">
          {document && canUseAITutor ? (
            <ChatPanel
              documentId={document.id}
              documentTitle={document.title}
              aiAvailable={aiAvailable}
              isStudent={true}
            />
          ) : (
            <div className="text-center text-sm text-gray-500">
              {canUseAITutor
                ? "Select a document to use the AI Tutor."
                : "The AI Tutor is not available for your account."}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 