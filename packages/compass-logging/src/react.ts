import createLoggerAndTelemetry from './logger';
import type { LoggerAndTelemetry } from './logger';

export function useLoggerAndTelemetry(
  component: string,
  React: { useRef: any }
): LoggerAndTelemetry {
  const loggerRef = React.useRef();
  if (!loggerRef.current) {
    loggerRef.current = createLoggerAndTelemetry(component);
  }
  return loggerRef.current as LoggerAndTelemetry;
}

export function useTrackOnChange(
  component: string,
  onChange: (track: LoggerAndTelemetry['track']) => void,
  dependencies: unknown[],
  options: { skipOnMount: boolean } = { skipOnMount: false },
  React: { useRef: any; useEffect: any }
) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const { track } = useLoggerAndTelemetry(component, React);
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
    const logger = useLoggerAndTelemetry(component, React);
    return React.createElement(ReactComponent, { ...props, logger });
  };
  return WithLoggerAndTelemetry;
}
