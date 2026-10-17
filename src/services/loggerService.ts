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
