'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents the entire app from crashing when a component fails
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060d1a] text-[#e2e8f0] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0f1a2e] border border-[#1a2a4a] rounded-xl p-6">
            <div className="text-[#f0a030] text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-[#4a5a7a] text-sm mb-4">
              The simulator encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-[#4a9eff] text-xs cursor-pointer mb-2">Error details</summary>
                <pre className="text-[10px] text-[#6a7a9a] bg-[#060d1a] p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 rounded-lg bg-[#f0a030] text-[#060d1a] font-medium hover:bg-[#ff9a40] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
