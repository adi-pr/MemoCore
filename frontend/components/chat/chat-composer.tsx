"use client"

import {
  Eraser,
  FileUp,
  Mic,
  Paperclip,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ToolbarAction {
  label: string
  icon: LucideIcon
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "Attach file", icon: Paperclip },
  { label: "Upload document", icon: FileUp },
  { label: "Voice input", icon: Mic },
  { label: "Search knowledge base", icon: Search },
  { label: "Clear conversation", icon: Eraser },
]

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
}

export function ChatComposer({ value, onChange }: ChatComposerProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask MemoCore anything about your knowledge base..."
          className="min-h-[56px] resize-none border-none bg-transparent px-4 py-3.5 shadow-none focus-visible:ring-0"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-2.5 py-2">
          <div className="flex items-center gap-0.5">
            {TOOLBAR_ACTIONS.map(({ label, icon: Icon }) => (
              <Tooltip key={label}>
                <TooltipTrigger
                  aria-label={label}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                >
                  <Icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Select defaultValue="semantic">
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semantic">Semantic Search</SelectItem>
                <SelectItem value="hybrid">Hybrid Search</SelectItem>
                <SelectItem value="keyword">Keyword Search</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="streaming">
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streaming">Streaming</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="5">
              <SelectTrigger size="sm" className="w-[68px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Top 3</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" size="icon" className="rounded-full" aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
