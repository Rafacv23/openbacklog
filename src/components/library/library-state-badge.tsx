import type { LibraryState } from "@/server/library/states"

import { Badge } from "@/components/ui/badge"

type LibraryStateBadgeProps = {
  labels: Record<LibraryState, string>
  state: LibraryState
}

const STATE_CLASSNAMES: Record<LibraryState, string> = {
  planned: "border-border/60 text-muted-foreground",
  playing: "border-primary/50 text-primary",
  completed: "border-emerald-500/50 text-emerald-400",
  dropped: "border-destructive/50 text-destructive",
  on_hold: "border-amber-500/50 text-amber-400",
}

export function LibraryStateBadge({ labels, state }: LibraryStateBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`rounded-none bg-background px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${STATE_CLASSNAMES[state]}`}
    >
      {labels[state]}
    </Badge>
  )
}
