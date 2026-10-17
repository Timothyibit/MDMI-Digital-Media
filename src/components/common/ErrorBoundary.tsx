import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app exception caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errMessage = this.state.error?.message || 'Unknown runtime error';
      const errName = this.state.error?.name || 'Error';
      const errStack = this.state.error?.stack || '';

      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif mb-2">
            {this.props.fallbackTitle || 'Graceful Recovery'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-4 leading-relaxed">
            The app caught a component exception. Your devotional reading progress and spiritual journal are safe.
          </p>

          {/* Diagnostic Details Banner */}
          <div className="w-full max-w-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 mb-5 text-left font-mono text-xs">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold mb-1">
              <span>{errName}</span>
              <button
                type="button"
                onClick={() => {
                  const payload = `Error: ${errName}\nMessage: ${errMessage}\nPlatform: ${navigator.userAgent}\nStack:\n${errStack}`;
                  navigator.clipboard.writeText(payload);
                  alert('Diagnostic info copied to clipboard!');
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Copy Error
              </button>
            </div>
            <p className="text-neutral-800 dark:text-neutral-200 break-words mb-2">
              {errMessage}
            </p>
            {errStack && (
              <details className="mt-1">
                <summary className="text-[10px] text-neutral-500 cursor-pointer hover:underline">
                  View stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-neutral-400 max-h-32 overflow-y-auto whitespace-pre-wrap leading-tight">
                  {errStack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Reset audio state in localStorage if that caused the error
                try {
                  const stateStr = localStorage.getItem('mdmi_audio_state');
                  if (stateStr) localStorage.removeItem('mdmi_audio_state');
                } catch {
                  // ignore
                }
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#84CC16] to-[#65A30D] text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Experience</span>
            </button>

            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-sm hover:bg-neutral-300 dark:hover:bg-neutral-700 active:scale-95 transition-all cursor-pointer"
            >
              <span>Dismiss & Continue</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
