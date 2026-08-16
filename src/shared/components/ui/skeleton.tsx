import type { HTMLAttributes } from "react"

import { cn } from "@/shared/utils/utils"

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}
