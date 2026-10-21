import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Globe,
  Clock,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from '../../lib/firebase';
import { MotionButton } from '@/components/ui/motion-button';

interface DiagnosticReportItem {
  id: string;
  report: string;
  userNote: string;
  platform: string;
  isNative: boolean;
  userAgent: string;
  userEmail: string;
  userId: string | null;
  userRole: string;
  errorCount: number;
  warnCount: number;
  status: 'pending' | 'reviewed';
  createdAt?: any;
}

export const AdminDiagnosticReports: React.FC = () => {
  const [reports, setReports] = useState<DiagnosticReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'diagnostic_reports'),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: DiagnosticReportItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              report: data.report || '',
              userNote: data.userNote || 'User diagnostic submission',
              platform: data.platform || 'unknown',
              isNative: Boolean(data.isNative),
              userAgent: data.userAgent || '',
              userEmail: data.userEmail || 'Anonymous Disciple',
              userId: data.userId || null,
              userRole: data.userRole || 'guest',
              errorCount: data.errorCount || 0,
              warnCount: data.warnCount || 0,
              status: data.status || 'pending',
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleString()
                : data.createdAt || 'Just now',
            };
          });
          setReports(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Diagnostic reports snapshot error:', err);
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    return () => unsub();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diagnostic_reports', id));
    } catch (e) {
      console.warn('Error deleting report:', e);
    }
  };

  const handleMarkReviewed = async (id: string, currentStatus: string) => {
    try {
      const next = currentStatus === 'reviewed' ? 'pending' : 'reviewed';
      await updateDoc(doc(db, 'diagnostic_reports', id), { status: next });
    } catch (e) {
      console.warn('Error updating status:', e);
    }
  };

  const handleClearAll = async () => {
    if (reports.length === 0) return;
    setIsClearingAll(true);
    try {
      await Promise.all(
        reports.map((r) => deleteDoc(doc(db, 'diagnostic_reports', r.id)).catch(() => {}))
      );
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Disciples' Technical Support & Diagnostic Logs
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                User-submitted device logs and error telemetry. Only accessible by Ministry Overseers.
              </p>
            </div>
          </div>

          {reports.length > 0 && (
            <MotionButton
              size="sm"
              variant="secondary"
              icon={isClearingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              label={isClearingAll ? 'Clearing...' : 'Purge All Logs'}
              onClick={handleClearAll}
              className="self-start sm:self-auto"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#5E72E4]" />
          <p className="text-xs font-semibold">Retrieving diagnostic reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/40 dark:bg-neutral-900/40 p-6">
          <CheckCircle2 className="w-10 h-10 stroke-1 mx-auto mb-2 text-emerald-500" />
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
            No pending diagnostic reports
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Disciples' devices are operating smoothly. When a user sends a diagnostic log from their profile or audio notice, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs space-y-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.errorCount > 0
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {item.isNative ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {item.userEmail}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.platform === 'android'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {item.platform} {item.isNative ? '(APK)' : '(Web)'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'reviewed'
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.status === 'reviewed' ? 'Reviewed' : 'New Report'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                        {item.userNote}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {String(item.createdAt)}
                        </span>
                        <span>•</span>
                        <span>Errors: {item.errorCount}</span>
                        <span>•</span>
                        <span>Warnings: {item.warnCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(item.id, item.status)}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {item.status === 'reviewed' ? 'Mark New' : 'Mark Reviewed'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.report)}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                      title="Copy Sanitized Log"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#5E72E4]/10 text-[#5E72E4] hover:bg-[#5E72E4]/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ml-1"
                    >
                      <span>{isExpanded ? 'Hide Log' : 'View Log'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Log Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 animate-in fade-in duration-150">
                    <div className="p-3.5 rounded-xl bg-neutral-950 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-72 whitespace-pre leading-relaxed select-text border border-neutral-800">
                      {item.report}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDiagnosticReports;
