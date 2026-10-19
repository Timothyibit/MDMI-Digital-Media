import React, { Component, ErrorInfo, ReactNode } from 'react';
import { VolumeX, RefreshCw, Terminal, Copy } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { diagnosticLogger } from '../../services/loggerService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
}

export class AudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    errorStack: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Audio component error',
      errorStack: error?.stack || '',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AudioErrorBoundary caught local error:', error, errorInfo);
    diagnosticLogger.logError(
      `Audio reader error: ${error?.message || 'Unknown audio error'}`,
      errorInfo?.componentStack || ''
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-neutral-800 dark:text-neutral-200 text-xs shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <VolumeX className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400">Audio Narration Notice</p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Audio reader encountered a device format issue. You can continue reading devotional text.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    useUIStore.getState().openDiagnosticLogs();
                  } catch {
                    // ignore
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                title="View full APK diagnostic logs"
              >
                <Terminal className="w-3 h-3" />
                <span>Logs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    useUIStore.getState().closeAudioPlayer();
                  } catch {
                    // ignore
                  }
                  this.setState({ hasError: false, errorMessage: '', errorStack: '' });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {this.state.errorMessage && (
            <div className="p-2.5 rounded-xl bg-black/40 text-[11px] font-mono text-amber-300 dark:text-amber-200 break-words flex items-center justify-between gap-2">
              <span className="truncate">{this.state.errorMessage}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Audio Error: ${this.state.errorMessage}\nStack: ${this.state.errorStack}`);
                  alert('Audio error copied to clipboard!');
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AudioErrorBoundary;
