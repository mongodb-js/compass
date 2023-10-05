import React from 'react';
import type { LoggerAndTelemetry } from './logger';
export type { LoggerAndTelemetry } from './logger';

const LoggerAndTelemetryContext = React.createContext<
  ((component: string) => LoggerAndTelemetry) | null
>(null);

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

type ComponentProps<T> = T extends (props: infer P) => any
  ? P
  : T extends { new (props: infer P): any }
  ? P
  : never;

type ComponentReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : T extends { new (...args: any[]): { render(...args: any[]): infer R } }
  ? R
  : never;

export function withLoggerAndTelemetry<T = any>(
  ReactComponent: T,
  component: string,
  React: any
) {
  const WithLoggerAndTelemetry = (
    props: Omit<ComponentProps<T>, 'logger'>
  ): ComponentReturnType<T> => {
    const logger = useLoggerAndTelemetry(component);
    return React.createElement(ReactComponent, { ...props, logger });
  };
  return WithLoggerAndTelemetry;
}
