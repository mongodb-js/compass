import React from 'react';
import type { LoggerAndTelemetry } from './logger';
export type { LoggerAndTelemetry } from './logger';

function defaultCreateLoggerAndTelemetry(component: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./logger').createGenericLoggerAndTelemetry(component, () => {
    /* ignore */
  });
}

const LoggerAndTelemetryContext = React.createContext<
  (component: string) => LoggerAndTelemetry
>(defaultCreateLoggerAndTelemetry);

export const LoggerAndTelemetryProvider = LoggerAndTelemetryContext.Provider;

export function createLoggerAndTelemetryLocator(component: string) {
  return useLoggerAndTelemetry.bind(null, component);
}

export function useLoggerAndTelemetry(component: string): LoggerAndTelemetry {
  const createLoggerAndTelemetry = React.useContext(LoggerAndTelemetryContext);
  if (!createLoggerAndTelemetry) {
    throw new Error('LoggerAndTelemetry service is missing from React context');
  }
  const loggerRef = React.createRef<LoggerAndTelemetry>();
  if (!loggerRef.current) {
    (loggerRef as any).current = createLoggerAndTelemetry(component);
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
