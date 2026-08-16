import { ClassIcon } from "@/shared/components/class-icon"
import { Badge } from "@/shared/components/ui/badge"

interface ClassBadgeProps {
  name: string | null
  iconOnly?: boolean
}

/** Class icon + name in a badge. */
export function ClassBadge({ name, iconOnly = false }: ClassBadgeProps) {
  if (!name) return <span className="text-muted-foreground">—</span>
  return (
    <Badge>
      <ClassIcon name={name} size={16} />
      {iconOnly ? null : name}
    </Badge>
  )
}
