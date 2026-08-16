import { Moon, Sun } from "lucide-react"

import { Button } from "@/shared/components/ui/button"

import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle light/dark theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
