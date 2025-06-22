"use client"

import { MoreVertical, FilePlus, Save, Trash2, List, BarChart3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useRouter } from "next/navigation"

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
  const { isStudent } = useUserRole()
  const router = useRouter()

  const handleViewSessions = () => {
    if (documentId) {
      router.push(`/documents/${documentId}/sessions`)
    } else {
      // Fallback to old sessions page if no document ID
      router.push('/sessions')
    }
  }

  return (
    <>
      {/* Save button - now always visible */}
      <Button
        onClick={onSave}
        disabled={isSaving}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span>{isSaving ? "Saving..." : "Save"}</span>
      </Button>

      {/* Three dots dropdown menu */}
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
          
          {/* Show My Sessions only for students */}
          {isStudent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewSessions}>
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
    </>
  )
} 