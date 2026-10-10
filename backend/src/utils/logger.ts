export interface LogPayload {
  requestId?: string;
  action: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

export const logger = {
  info: (action: string, message: string, data?: Record<string, unknown>, requestId?: string) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        action,
        message,
        requestId,
        data,
      })
    );
  },
  warn: (action: string, message: string, data?: Record<string, unknown>, requestId?: string) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        action,
        message,
        requestId,
        data,
      })
    );
  },
  error: (action: string, message: string, error?: unknown, requestId?: string) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        action,
        message,
        requestId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      })
    );
  },
};
