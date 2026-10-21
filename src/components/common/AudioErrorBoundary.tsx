import React, { Component, ErrorInfo, ReactNode } from 'react';
import { VolumeX, RefreshCw, Terminal, Send, Check } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { diagnosticLogger, submitDiagnosticReport } from '../../services/loggerService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  reportSent: boolean;
  isSendingReport: boolean;
}

export class AudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    reportSent: false,
    isSendingReport: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Audio playback unavailable',
      reportSent: false,
      isSendingReport: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AudioErrorBoundary caught local error:', error, errorInfo);
    diagnosticLogger.logError(
      `Audio reader error: ${error?.message || 'Unknown audio error'}`,
      errorInfo?.componentStack || ''
    );
  }

  private handleSendReport = async () => {
    this.setState({ isSendingReport: true });
    try {
      const user = useAuthStore.getState().user;
      await submitDiagnosticReport(
        `Audio reader error on device: ${this.state.errorMessage}`,
        {
          email: user?.email || undefined,
          uid: user?.uid || undefined,
          role: user?.role,
        }
      );
      this.setState({ reportSent: true, isSendingReport: false });
    } catch {
      this.setState({ isSendingReport: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      const isAdmin = useAuthStore.getState().isAdmin;

      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-neutral-800 dark:text-neutral-200 text-xs shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <VolumeX className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-300">Spoken Reflection Notice</p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Audio reader is currently unavailable on this device. You can enjoy reading the devotional scripture and prayer below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {/* Only admins see raw diagnostic terminal logs button */}
              {isAdmin && (
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
                  title="View Overseer Diagnostic Logs"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Logs</span>
                </button>
              )}

              {/* Disciples / Users can submit diagnostic report directly to ministry support */}
              <button
                type="button"
                disabled={this.state.isSendingReport || this.state.reportSent}
                onClick={this.handleSendReport}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {this.state.reportSent ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Report Sent</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-emerald-600" />
                    <span>{this.state.isSendingReport ? 'Sending...' : 'Report Issue'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    useUIStore.getState().closeAudioPlayer();
                  } catch {
                    // ignore
                  }
                  this.setState({ hasError: false, errorMessage: '', reportSent: false });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AudioErrorBoundary;
