import {
  Boxes,
  Container,
  GitBranch,
  KeyRound,
  ListTree,
  NotebookText,
  Rocket,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

interface PromptChip {
  label: string
  icon: LucideIcon
}

const PROMPT_CHIPS: PromptChip[] = [
  { label: "Explain authentication", icon: KeyRound },
  { label: "Summarize deployment guide", icon: Rocket },
  { label: "Show Docker notes", icon: Container },
  { label: "Find Kubernetes docs", icon: Boxes },
  { label: "List API endpoints", icon: ListTree },
  { label: "Search meeting notes", icon: NotebookText },
  { label: "What's new in my wiki?", icon: Sparkles },
  { label: "Explain the CI/CD pipeline", icon: GitBranch },
]

interface PromptChipsProps {
  onSelect: (prompt: string) => void
}

export function PromptChips({ onSelect }: PromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMPT_CHIPS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
