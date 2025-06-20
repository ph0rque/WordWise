"use client"

import { useState } from "react"
import { MoreVertical, FilePlus, Save, Trash2, List, BarChart3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MyRecordings } from "@/components/student/my-recordings"
import { useUserRole } from "@/lib/hooks/use-user-role"

interface DocumentActionsProps {
  onNew: () => void
  onSave: () => void
  onDelete: () => void
  onSwitch: () => void
  isSaving: boolean
  documentId?: string
  documentTitle?: string
}

export function DocumentActions({ onNew, onSave, onDelete, onSwitch, isSaving, documentId, documentTitle }: DocumentActionsProps) {
  const [showMySessions, setShowMySessions] = useState(false)
  const { isStudent } = useUserRole()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onNew}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>New Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSwitch}>
            <List className="mr-2 h-4 w-4" />
            <span>Switch Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </DropdownMenuItem>
          
          {/* Show My Sessions only for students */}
          {isStudent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowMySessions(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>My Sessions</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* My Sessions Dialog */}
      <Dialog open={showMySessions} onOpenChange={setShowMySessions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {documentTitle ? `Sessions for "${documentTitle}"` : 'My Writing Sessions'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <MyRecordings 
              documentId={documentId}
              documentTitle={documentTitle}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 