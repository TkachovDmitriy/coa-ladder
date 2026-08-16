import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Last-resort UI guard so a render error shows a message, not a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled render error:", error, info)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="container flex min-h-dvh flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
