import type { Logger } from '@mongodb-js/compass-logging/provider';
import { MongoLogWriter } from 'mongodb-log-writer/mongo-log-writer';
import type { Writable } from 'stream';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import {
  useCurrentValueRef,
  useInitialValue,
} from '@mongodb-js/compass-components';

/** @public */
export type LogMessage = {
  id: number;
  t: { $date: string };
  s: 'F' | 'E' | 'W' | 'I' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  c: string;
  ctx: string;
  msg: string;
  attr?: any;
};

/** @public */
export type LogFunction = (message: LogMessage) => void;

/** @public */
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
    const target = {
      write(line: string, callback: () => void) {
        callbackRef.current.onLog?.(JSON.parse(line));
        callback();
      },
      end(callback: () => void) {
        callback();
      },
    } as Writable;

    this.log = new MongoLogWriter('', '', target).bindComponent(this.component);

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
  const callbackRef = useCurrentValueRef(callbacks);
  const loggerAndTelemetry = useInitialValue<CompassWebLogger>(() => {
    return new CompassWebLogger('COMPASS-WEB', callbackRef);
  });
  return loggerAndTelemetry;
}
