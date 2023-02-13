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
  value: unknown,
  onChange: (track: LoggerAndTelemetry['track']) => void,
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
  }, [value, track]);
}

export function withLoggerAndTelemetry<T = any>(
  ReactComponent: T,
  component: string,
  React: any
): T {
  const WithLoggerAndTelemetry = (props: any) => {
    const logger = useLoggerAndTelemetry(component, React);
    return React.createElement(ReactComponent, { ...props, logger });
  };
  return WithLoggerAndTelemetry as T;
}
