import type { Logger } from '@mongodb-js/compass-logging/provider';
import { MongoLogWriter } from 'mongodb-log-writer/mongo-log-writer';
import { PassThrough } from 'stream';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { useRef } from 'react';

export type LogMessage = {
  id: number;
  t: { $date: string };
  s: 'F' | 'E' | 'W' | 'I' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  c: string;
  ctx: string;
  msg: string;
  attr?: any;
};
export type LogFunction = (message: LogMessage) => void;

export type DebugFunction = (...args: any[]) => void;

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

export class CompassWebLogger implements Logger {
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
    const passThrough = new PassThrough({ objectMode: true });
    this.log = new MongoLogWriter('', '', passThrough).bindComponent(
      this.component
    );
    passThrough.on('data', (line) => {
      callbackRef.current.onLog?.(JSON.parse(line));
    });

    this.debug = createCompassWebDebugger(this.component, this.callbackRef);
  }

  mongoLogId = mongoLogId;

  createLogger = (component: string): Logger => {
    return new CompassWebLogger(component, this.callbackRef);
  };
}

export function useCompassWebLogger(callbacks: {
  onLog?: LogFunction;
  onDebug?: DebugFunction;
}): CompassWebLogger {
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;
  const loggerAndTelemetryRef = useRef<CompassWebLogger>();
  if (!loggerAndTelemetryRef.current) {
    loggerAndTelemetryRef.current = new CompassWebLogger(
      'COMPASS-WEB',
      callbackRef
    );
  }
  return loggerAndTelemetryRef.current;
}
