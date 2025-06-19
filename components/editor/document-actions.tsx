"use client"

import { MoreVertical, FilePlus, Save, Trash2, List } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface DocumentActionsProps {
  onNew: () => void
  onSave: () => void
  onDelete: () => void
  onSwitch: () => void
  isSaving: boolean
}

export function DocumentActions({ onNew, onSave, onDelete, onSwitch, isSaving }: DocumentActionsProps) {
  return (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 