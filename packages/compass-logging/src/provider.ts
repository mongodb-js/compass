import React from 'react';
import type {
  LoggerAndTelemetry,
  LoggingAndTelemetryPreferences,
} from './logger';
import type { MongoLogId, MongoLogWriter } from 'mongodb-log-writer';

export type { LoggerAndTelemetry } from './logger';

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
};

export function createNoopLoggerAndTelemetry(
  component = 'NOOP-LOGGER'
): LoggerAndTelemetry {
  return {
    log: {
      component,
      get unbound() {
        return this as unknown as MongoLogWriter;
      },
      write: () => true,
      info: throwIfNotTestEnv,
      warn: throwIfNotTestEnv,
      error: throwIfNotTestEnv,
      fatal: throwIfNotTestEnv,
      debug: throwIfNotTestEnv,
    },
    debug: throwIfNotTestEnv as unknown as LoggerAndTelemetry['debug'],
    track: throwIfNotTestEnv,
    mongoLogId,
  };
}

const LoggerAndTelemetryContext = React.createContext<{
  createLogger(
    component: string,
    preferences: LoggingAndTelemetryPreferences
  ): LoggerAndTelemetry;
  preferences?: LoggingAndTelemetryPreferences;
}>({ createLogger: createNoopLoggerAndTelemetry });

export const LoggerAndTelemetryProvider = LoggerAndTelemetryContext.Provider;

export function createLoggerAndTelemetryLocator(component: string) {
  return useLoggerAndTelemetry.bind(null, component);
}

export function useLoggerAndTelemetry(component: string): LoggerAndTelemetry {
  const context = React.useContext(LoggerAndTelemetryContext);
  if (!context) {
    throw new Error('LoggerAndTelemetry service is missing from React context');
  }
  const loggerRef = React.createRef<LoggerAndTelemetry>();
  if (!loggerRef.current) {
    (loggerRef as any).current = context.createLogger(
      component,
      context.preferences ?? {
        getPreferences() {
          return { trackUsageStatistics: true };
        },
      }
    );
  }
  return loggerRef.current!;
}

export function useTrackOnChange(
  component: string,
  onChange: (track: LoggerAndTelemetry['track']) => void,
  dependencies: unknown[],
  options: { skipOnMount: boolean } = { skipOnMount: false }
) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const { track } = useLoggerAndTelemetry(component);
  let initial = true;
  React.useEffect(() => {
    if (options.skipOnMount && initial) {
      initial = false;
      return;
    }
    onChangeRef.current(track);
  }, [...dependencies, track]);
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

export function withLoggerAndTelemetry<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(
  ReactComponent: T,
  component: string
): React.FunctionComponent<Omit<FirstArgument<T>, 'logger'>> {
  const WithLoggerAndTelemetry = (
    props: Omit<FirstArgument<T>, 'logger'> & React.Attributes
  ) => {
    const logger = useLoggerAndTelemetry(component);
    return React.createElement(ReactComponent, { ...props, logger });
  };
  return WithLoggerAndTelemetry;
}

export function mongoLogId(id: number): MongoLogId {
  return { __value: id };
}
