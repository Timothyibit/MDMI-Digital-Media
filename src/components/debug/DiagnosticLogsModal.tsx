import React, { useState, useEffect } from 'react';
import {
  Terminal,
  X,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Smartphone,
  Radio,
  AlertTriangle,
  Info,
  Bug,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { diagnosticLogger, LogEntry } from '../../services/loggerService';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticLogsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'warn-error'>('all');
  const [copied, setCopied] = useState(false);

  const { user, isAdmin } = useAuthStore();
  const { audioState } = useUIStore();

  useEffect(() => {
    if (!isOpen) return;
    setLogs(diagnosticLogger.getLogs());
    const unsub = diagnosticLogger.subscribe(() => {
      setLogs(diagnosticLogger.getLogs());
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === 'warn-error') return log.level === 'warn' || log.level === 'error';
    return true;
  });

  const generateDiagnosticReport = (): string => {
    const lines: string[] = [];
    lines.push('=== MDMI DEVOTIONALS DIAGNOSTIC LOG ===');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Platform: ${Capacitor.getPlatform()} (isNative: ${Capacitor.isNativePlatform()})`);
    lines.push(`URL: ${window.location.href}`);
    lines.push(`UserAgent: ${navigator.userAgent}`);
    lines.push(`Auth User: ${user ? `${user.email ? user.email.slice(0, 3) + '***@***' : 'anonymous'} (Role: ${user.role})` : 'Signed Out'}`);
    lines.push(`Audio State: Playing=${audioState.isPlaying}, NativeSpeech=${audioState.useNativeSpeech}, HasURL=${Boolean(audioState.audioUrl)}, Rate=${audioState.playbackRate}`);
    lines.push('----------------------------------------');
    lines.push('RECENT CAPTURED LOGS:');

    logs.forEach((l) => {
      lines.push(`[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.details ? `| Details: ${l.details}` : ''}`);
    });

    lines.push('=== END OF DIAGNOSTIC REPORT ===');
    return lines.join('\n');
  };

  const handleCopyLogs = () => {
    const report = generateDiagnosticReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    diagnosticLogger.clear();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>In-App Diagnostics & Logs</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  Sanitized
                </span>
              </h2>
              <p className="text-xs text-neutral-500">Live APK runtime telemetry & error inspector</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Diagnostics Health Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 text-[11px]">
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-500 flex items-center gap-1 font-semibold mb-0.5">
              <Smartphone className="w-3 h-3 text-indigo-500" />
              <span>Platform</span>
            </div>
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {Capacitor.getPlatform()} ({Capacitor.isNativePlatform() ? 'Native' : 'Web'})
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-500 flex items-center gap-1 font-semibold mb-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Auth State</span>
            </div>
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {user ? (user.isAnonymous ? 'Guest Disciple' : 'Authenticated') : 'Signed Out'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-500 flex items-center gap-1 font-semibold mb-0.5">
              <Radio className="w-3 h-3 text-amber-500" />
              <span>Audio Engine</span>
            </div>
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {audioState.isPlaying ? 'Active (Playing)' : 'Idle'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
            <div className="text-neutral-500 flex items-center gap-1 font-semibold mb-0.5">
              <Bug className="w-3 h-3 text-rose-500" />
              <span>Captured Events</span>
            </div>
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {logs.length} logged
            </p>
          </div>
        </div>

        {/* Filter Controls & Action Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              All Logs ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('warn-error')}
              className={`px-2.5 py-1 rounded-md transition-all ${filter === 'warn-error' ? 'bg-white dark:bg-neutral-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              Warnings & Errors ({logs.filter((l) => l.level === 'warn' || l.level === 'error').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#84CC16] to-[#65A30D] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Sanitized Log'}</span>
            </button>
          </div>
        </div>

        {/* Console Log Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] bg-neutral-950 text-neutral-200">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Info className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>No logged issues found for current filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.level === 'error';
              const isWarn = log.level === 'warn';

              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border ${
                    isError
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : isWarn
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                    <span className="flex items-center gap-1 font-bold">
                      {isError ? (
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Info className="w-3 h-3 text-indigo-400" />
                      )}
                      <span>{log.level.toUpperCase()}</span>
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="break-words whitespace-pre-wrap">{log.message}</div>
                  {log.details && (
                    <details className="mt-1">
                      <summary className="text-[10px] text-neutral-400 hover:text-white cursor-pointer">
                        Details & Stack
                      </summary>
                      <pre className="mt-1 p-2 rounded bg-black/60 text-[10px] text-neutral-400 whitespace-pre-wrap overflow-x-auto">
                        {log.details}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <span>All sensitive authentication tokens and passwords are automatically redacted.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticLogsModal;
