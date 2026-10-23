import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Settings,
  RefreshCw,
  X,
  Volume2,
  BatteryCharging,
  Moon,
  Info,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export const NotificationDeliveryTroubleshooterModal: React.FC = () => {
  const {
    showTroubleshooterModal,
    setShowTroubleshooterModal,
    permission,
    platform,
    pendingDeliveriesCount,
    checkAndSyncPermissions,
    retryPendingDeliveries,
    testDeviceDelivery,
  } = useNotificationStore();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    diagnostic?: string;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  if (!showTroubleshooterModal) return null;

  const handleTestDelivery = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testDeviceDelivery();
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: 'Could not trigger test notification.',
        diagnostic: 'Check whether your device is in Do Not Disturb mode.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCheckAndRetry = async () => {
    setIsRetrying(true);
    setRetryResult(null);
    try {
      const actualPerm = await checkAndSyncPermissions();
      if (actualPerm === 'granted') {
        const flushRes = await retryPendingDeliveries();
        if (flushRes.delivered > 0) {
          setRetryResult(`Success! Delivered ${flushRes.delivered} queued broadcast alert(s) to this phone.`);
        } else if (flushRes.remaining === 0) {
          setRetryResult('Permission active! All broadcasts are up to date on this device.');
        } else {
          setRetryResult(`Permission active! ${flushRes.remaining} alert(s) will continue delivering.`);
        }
      } else {
        setRetryResult('Notification permission is still disabled in phone settings. Please follow the steps below.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 flex items-center justify-center text-[#5E72E4] dark:text-[#889af7]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                Notification Delivery Assistant
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ensure daily devotionals and broadcasts reach this phone every time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTroubleshooterModal(false)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Current Device Status Banner */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <Smartphone className="w-4 h-4 text-[#5E72E4]" />
                <span>Detected Platform:</span>
                <span className="font-bold text-neutral-900 dark:text-white capitalize">
                  {platform === 'android' ? 'Android Device' : platform === 'ios' ? 'Apple iOS' : 'Web Browser'}
                </span>
              </div>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : permission === 'denied'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {permission === 'granted'
                  ? 'System Push Allowed'
                  : permission === 'denied'
                  ? 'Permission Blocked'
                  : 'Needs Permission'}
              </span>
            </div>

            {pendingDeliveriesCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>{pendingDeliveriesCount} broadcast alert(s)</strong> are queued and retrying for this phone.
                </span>
              </div>
            )}
          </div>

          {/* Test & Verification Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.diagnostic && (
                <p className="text-[11px] opacity-90 pl-6 leading-relaxed">
                  {testResult.diagnostic}
                </p>
              )}
            </div>
          )}

          {/* Retry Flush Result */}
          {retryResult && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-[#5E72E4]" />
              <span>{retryResult}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleTestDelivery}
              disabled={isTesting}
              className="py-2.5 px-4 rounded-xl bg-[#5E72E4] hover:bg-[#4a5ec2] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>{isTesting ? 'Testing Device...' : 'Test Device Notification'}</span>
            </button>

            <button
              type="button"
              onClick={handleCheckAndRetry}
              disabled={isRetrying}
              className="py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-98 text-neutral-800 dark:text-neutral-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 text-[#5E72E4] ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking OS...' : 'Check Settings & Retry'}</span>
            </button>
          </div>

          {/* Step-by-Step Resolution Guide */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#5E72E4]" />
              <span>How to Enable Notifications on this Phone</span>
            </h4>

            <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Open Android Phone Settings ⚙️
                  </p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Swipe down or open your phone's home screen, tap <strong>Settings</strong>, then tap <strong>Apps</strong> (or "Application Manager").
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Locate "MDMI Devotionals" & Turn Notifications ON
                  </p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Select <strong>Notifications</strong> and make sure <strong>Allow Notifications</strong> and <strong>MDMI Devotionals</strong> channel are toggled to <strong>ON</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <BatteryCharging className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Background Battery Optimization (Samsung, Xiaomi, Pixel)
                  </p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    In App info → <strong>Battery</strong>, select <strong>Unrestricted</strong> so daily morning devotionals alert you on time even while the screen is asleep.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/70 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Check "Do Not Disturb" Mode
                  </p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    If your phone is in Focus or Do Not Disturb mode, notification banners will be silenced until DND is turned off.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Retrying continuously in the background
          </p>
          <button
            type="button"
            onClick={() => setShowTroubleshooterModal(false)}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-xs font-bold text-neutral-800 dark:text-neutral-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
