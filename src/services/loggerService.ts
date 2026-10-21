/**
 * Diagnostic In-Memory Logger Service
 * Captures console warnings, errors, and unhandled rejections in a circular buffer
 * with sanitization for passwords, tokens, and sensitive credentials.
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
}

class DiagnosticLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 120;
  private listeners = new Set<() => void>();
  private initialized = false;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Hook console.error
    const originalError = console.error;
    console.error = (...args: any[]) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };

    // Hook console.warn
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };

    // Capture global unhandled exceptions
    window.addEventListener('error', (event) => {
      this.addLog('error', [
        `Global Error: ${event.message}`,
        event.filename ? `at ${event.filename}:${event.lineno}:${event.colno}` : '',
        event.error?.stack || '',
      ]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', [
        `Unhandled Promise Rejection: ${event.reason?.message || event.reason || 'Unknown reason'}`,
        event.reason?.stack || '',
      ]);
    });
  }

  public logInfo(message: string, ...details: any[]): void {
    this.addLog('info', [message, ...details]);
  }

  public logWarn(message: string, ...details: any[]): void {
    this.addLog('warn', [message, ...details]);
  }

  public logError(message: string, ...details: any[]): void {
    this.addLog('error', [message, ...details]);
  }

  private addLog(level: 'info' | 'warn' | 'error', args: any[]): void {
    try {
      const sanitized = args.map((a) => this.sanitize(a));
      const message = sanitized[0] || '';
      const details = sanitized.slice(1).join(' ').trim();

      const entry: LogEntry = {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        details: details || undefined,
      };

      this.logs.unshift(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.pop();
      }

      this.notify();
    } catch {
      // Ignore logger errors
    }
  }

  private sanitize(value: any): string {
    if (value === null || value === undefined) return '';
    let str = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Sanitize passwords, tokens, API keys
    str = str.replace(/("?password"?\s*[:=]\s*)"[^"]+"/gi, '$1"***"');
    str = str.replace(/(AIzaSy[A-Za-z0-9_-]{33})/g, 'AIzaSy***');
    str = str.replace(/(ghp_[A-Za-z0-9]{36})/g, 'ghp_***');
    str = str.replace(/(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+)/g, '[JWT_TOKEN_REDACTED]');

    return str;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public generateSanitizedReport(userMeta?: { email?: string; role?: string }): string {
    const lines: string[] = [];
    lines.push('=== MDMI DEVOTIONALS DIAGNOSTIC LOG ===');
    lines.push(`Generated: ${new Date().toISOString()}`);
    if (typeof window !== 'undefined') {
      lines.push(`URL: ${window.location.href}`);
      lines.push(`UserAgent: ${navigator.userAgent}`);
    }
    lines.push(`User: ${userMeta?.email ? userMeta.email.slice(0, 3) + '***@***' : 'Anonymous'} (Role: ${userMeta?.role || 'user'})`);
    lines.push('----------------------------------------');
    lines.push('RECENT CAPTURED LOGS:');

    this.logs.forEach((l) => {
      lines.push(`[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.details ? `| Details: ${l.details}` : ''}`);
    });

    lines.push('=== END OF DIAGNOSTIC REPORT ===');
    return lines.join('\n');
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }
}

export const diagnosticLogger = new DiagnosticLogger();

/**
 * Submit sanitized diagnostic report to Firestore collection 'diagnostic_reports'
 * Accessible only by administrators in Overseer console.
 */
export async function submitDiagnosticReport(
  userNote?: string,
  userMeta?: { email?: string; uid?: string; role?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { db, collection, addDoc, serverTimestamp } = await import('../lib/firebase');
    const { Capacitor } = await import('@capacitor/core');

    const errorCount = diagnosticLogger.getLogs().filter((l) => l.level === 'error').length;
    const warnCount = diagnosticLogger.getLogs().filter((l) => l.level === 'warn').length;

    const docRef = await addDoc(collection(db, 'diagnostic_reports'), {
      report: diagnosticLogger.generateSanitizedReport(userMeta),
      userNote: userNote?.trim() || 'Diagnostic log report submitted by user',
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userEmail: userMeta?.email || 'Anonymous Disciple',
      userId: userMeta?.uid || null,
      userRole: userMeta?.role || 'guest',
      errorCount,
      warnCount,
      createdAt: serverTimestamp(),
      status: 'pending',
    });

    return { success: true, id: docRef.id };
  } catch (err: any) {
    console.warn('Diagnostic report submission note:', err?.message || err);
    return { success: false, error: err?.message || 'Could not send report' };
  }
}
