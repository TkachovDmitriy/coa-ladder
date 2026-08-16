import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** shadcn class-name helper: merge conditional + Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
