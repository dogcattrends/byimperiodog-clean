type LogLevel = "debug" | "info" | "warn" | "error";

function serializeError(err: Error) {
  const anyErr = err as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };

  if ("cause" in anyErr && anyErr.cause instanceof Error) {
    out.cause = serializeError(anyErr.cause);
  } else if ("cause" in anyErr && anyErr.cause != null) {
    out.cause = anyErr.cause;
  }

  for (const key of ["code", "details", "hint", "status", "statusCode"]) {
    if (key in anyErr && anyErr[key] != null) out[key] = anyErr[key];
  }

  return out;
}

function safeJsonStringify(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val instanceof Error) return serializeError(val);
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  });
}

const CONSOLE_METHOD: Record<LogLevel, keyof Console> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ENV_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

export interface Logger {
  scope: string;
  correlationId: string;
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
  child: (extension: string, context?: Record<string, unknown>) => Logger;
}

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[ENV_LOG_LEVEL];
}

function emitLog(
  level: LogLevel,
  scope: string,
  correlationId: string,
  message: string,
  context?: Record<string, unknown>,
) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    scope,
    correlationId,
    message,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  };

  const method = CONSOLE_METHOD[level] ?? "log";
  // eslint-disable-next-line no-console
  const logFn = console[method] as (message: string) => void;
  // eslint-disable-next-line no-console
  logFn(safeJsonStringify(payload));
}

export function createLogger(
  scope: string,
  correlationId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
  baseContext?: Record<string, unknown>,
): Logger {
  const scopedBase = { ...(baseContext ?? {}) };

  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    emitLog(level, scope, correlationId, message, { ...scopedBase, ...(context ?? {}) });
  }

  return {
    scope,
    correlationId,
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
    child: (extension: string, context?: Record<string, unknown>) =>
      createLogger(`${scope}:${extension}`, correlationId, { ...scopedBase, ...(context ?? {}) }),
  };
}

export function resolveCorrelationId(headers?: Headers) {
  if (!headers) return undefined;
  const direct = headers.get("x-correlation-id")?.trim();
  if (direct) return direct;
  const requestId = headers.get("x-request-id")?.trim();
  if (requestId) return requestId;
  return undefined;
}

