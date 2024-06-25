import type {
  Logger,
  MongoLogWriter,
} from '@mongodb-js/compass-logging/provider';
import { Writable } from 'stream';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { useRef } from 'react';

export type TrackFunction = (
  event: string,
  properties: Record<string, any>
) => void;

export type LogFunction = (
  type: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  ...args: any[]
) => void;

export type DebugFunction = (...args: any[]) => void;

class CompassWebLogWriter extends Writable implements MongoLogWriter {
  _logId = '';
  get logId() {
    return this._logId;
  }
  _logFilePath = null;
  get logFilePath() {
    return this._logFilePath;
  }
  _target = {} as Writable;
  get target() {
    return this._target;
  }
  _now = () => {
    return new Date();
  };
  constructor(private callbackRef: { current: { onLog?: LogFunction } }) {
    super();
  }
  private _log = (
    type: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    ...args: any[]
  ) => {
    this.callbackRef?.current.onLog?.(type, ...args);
  };
  mongoLogId = mongoLogId;
  flush = () => {
    return Promise.resolve();
  };
  debug = (...args: any[]) => {
    this._log('debug', ...args);
  };
  info = (...args: any[]) => {
    this._log('info', ...args);
  };
  warn = (...args: any[]) => {
    this._log('warn', ...args);
  };
  error = (...args: any[]) => {
    this._log('error', ...args);
  };
  fatal = (...args: any[]) => {
    this._log('fatal', ...args);
  };
  bindComponent = (component: string) => {
    return {
      component,
      unbound: this as CompassWebLogWriter,
      debug: (...args: any[]) => {
        return this.info(component, ...args);
      },
      info: (...args: any[]) => {
        return this.info(component, ...args);
      },
      warn: (...args: any[]) => {
        return this.warn(component, ...args);
      },
      error: (...args: any[]) => {
        return this.error(component, ...args);
      },
      fatal: (...args: any[]) => {
        return this.fatal(component, ...args);
      },
      write: () => {
        return true;
      },
    };
  };
}

type Debugger = Logger['debug'];

function createCompassWebDebugger(
  namespace: string,
  callbackRef: { current: { onDebug?: DebugFunction } } = { current: {} }
): Debugger {
  return Object.assign(
    (...args: any[]) => {
      callbackRef.current.onDebug?.(namespace, ...args);
    },
    {
      namespace,
      color: '',
      diff: -1,
      enabled: true,
      log: (...args: any[]) => {
        callbackRef.current.onDebug?.(namespace, ...args);
      },
      destroy: () => {
        return false;
      },
      extend: (extendedNamespace: string, delimiter = ':') => {
        return createCompassWebDebugger(
          `${namespace}${delimiter}${extendedNamespace}`,
          callbackRef
        );
      },
    }
  );
}

export class CompassWebLoggerAndTelemetry implements Logger {
  log: Logger['log'];

  debug: Debugger;

  constructor(
    private component: string,
    private callbackRef: {
      current: {
        onLog?: LogFunction;
        onDebug?: DebugFunction;
      };
    }
  ) {
    this.log = new CompassWebLogWriter(this.callbackRef).bindComponent(
      this.component
    );

    this.debug = createCompassWebDebugger(this.component, this.callbackRef);
  }

  mongoLogId = mongoLogId;

  createLogger = (component: string): Logger => {
    return new CompassWebLoggerAndTelemetry(component, this.callbackRef);
  };
}

export function useCompassWebLoggerAndTelemetry(callbacks: {
  onLog?: LogFunction;
  onDebug?: DebugFunction;
}): CompassWebLoggerAndTelemetry {
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;
  const loggerAndTelemetryRef = useRef<CompassWebLoggerAndTelemetry>();
  if (!loggerAndTelemetryRef.current) {
    loggerAndTelemetryRef.current = new CompassWebLoggerAndTelemetry(
      'COMPASS-WEB',
      callbackRef
    );
  }
  return loggerAndTelemetryRef.current;
}
