import React, { Component, ErrorInfo, ReactNode } from 'react';
import { VolumeX, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Audio component notice',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('AudioErrorBoundary caught local error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <VolumeX className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Spoken Narration Notice</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Audio reader encountered a minor device format issue. You can continue reading devotional text.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                useUIStore.getState().closeAudioPlayer();
              } catch {
                // ignore
              }
              this.setState({ hasError: false, errorMessage: '' });
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AudioErrorBoundary;
