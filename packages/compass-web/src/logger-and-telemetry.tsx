import type { Logger } from '@mongodb-js/compass-logging/provider';
import { MongoLogWriter } from 'mongodb-log-writer/mongo-log-writer';
import type { Writable } from 'stream';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import {
  useCurrentValueRef,
  useInitialValue,
} from '@mongodb-js/compass-components';
import type { TelemetryServiceOptions } from '@mongodb-js/compass-telemetry';
import type { PreferencesAccess } from 'compass-preferences-model';

/** @public */
export type TrackFunction = (
  event: string,
  properties: Record<string, any>
) => void;

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

/**
 * @internal
 * exported for the sandbox to be able to hook into these
 */
export const compassWebLoggingAndTrackingEvents: {
  logging: unknown[] | null;
  tracking: unknown[] | null;
} = {
  logging: null,
  tracking: null,
};

export class CompassWebLogger implements Logger {
  log: Logger['log'];
  debug: Debugger;
  private component: string;
  private callbackRef: {
    current: {
      onLog?: LogFunction;
      onDebug?: DebugFunction;
    };
  };
  constructor(
    component: string,
    callbackRef: {
      current: {
        onLog?: LogFunction;
        onDebug?: DebugFunction;
      };
    }
  ) {
    this.component = component;
    this.callbackRef = callbackRef;
    const target = {
      write(line: string, callback: () => void) {
        const parsedLine = JSON.parse(line);
        compassWebLoggingAndTrackingEvents.logging?.push(parsedLine);
        callbackRef.current.onLog?.(parsedLine);
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

export function useCompassWebLoggerAndTelemetry({
  preferences,
  ...callbacks
}: {
  onLog?: LogFunction;
  onDebug?: DebugFunction;
  onTrack?: TrackFunction;
  preferences: PreferencesAccess;
}): {
  logger: CompassWebLogger;
  telemetry: Omit<TelemetryServiceOptions, 'logger'>;
} {
  const callbackRef = useCurrentValueRef(callbacks);
  const logger = useInitialValue<CompassWebLogger>(() => {
    return new CompassWebLogger('COMPASS-WEB', callbackRef);
  });
  const telemetry = useInitialValue<TelemetryServiceOptions>({
    sendTrack: (
      event: string,
      properties: Record<string, any> | undefined = {}
    ) => {
      compassWebLoggingAndTrackingEvents.tracking?.push({ event, properties });
      void callbackRef.current.onTrack?.(event, properties);
    },
    logger,
    preferences,
  });
  return { logger, telemetry };
}
