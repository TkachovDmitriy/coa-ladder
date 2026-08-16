import { RouterProvider } from "@tanstack/react-router"

import { ErrorBoundary } from "@/presentation/error-boundary"
import { ThemeProvider } from "@/presentation/theme/theme-provider"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

import { router } from "@/router/router"

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider delayDuration={100}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
