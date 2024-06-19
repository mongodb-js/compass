import React, { useRef } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import type { TrackFunction } from './track';

const noop = () => {
  // noop
};

export function createNoopTrack(): TrackFunction {
  return noop;
}

const TelemetryContext = React.createContext<{
  createTrack(): TrackFunction;
}>({ createTrack: createNoopTrack });

export const TelemetryProvider = TelemetryContext.Provider;

export function createTelemetryLocator() {
  return createServiceLocator(
    useTelemetry.bind(null),
    'createTelemetryLocator'
  );
}

export function useTelemetry(): TrackFunction {
  const context = React.useContext(TelemetryContext);
  if (!context) {
    throw new Error('Tracking service is missing from React context');
  }
  const trackRef = React.createRef<TrackFunction>();
  if (!trackRef.current) {
    (trackRef as any).current = context.createTrack();
  }
  return trackRef.current!;
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

export function withTelemetry<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(ReactComponent: T): React.FunctionComponent<Omit<FirstArgument<T>, 'track'>> {
  const WithTelemetry = (
    props: Omit<FirstArgument<T>, 'track'> & React.Attributes
  ) => {
    const track = useTelemetry();
    return React.createElement(ReactComponent, { ...props, track });
  };
  return WithTelemetry;
}

/**
 * Hook that allows to track telemetry events as a side effect of dependencies changing.
 *
 * @param {function(TrackFunction): void} onChange - Function to be called when dependencies change. Receives the current track as an argument.
 * @param {unknown[]} dependencies - Array of dependencies to watch for changes.
 * @param {Object} [options]
 * @param {boolean} [options.skipOnMount=false] - If true, the onChange function is skipped on the initial mount.
 *
 * @example
 * useTrackOnChange((track) => {
 *   if (isShellOpen) { track('Shell Opened') }
 * }, [isShellOpen], { skipOnMount: true });
 */
export function useTrackOnChange(
  onChange: (track: TrackFunction) => void,
  dependencies: unknown[],
  options: { skipOnMount: boolean } = { skipOnMount: false }
) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const track = useTelemetry();
  const initialRef = useRef<boolean>(true);
  React.useEffect(() => {
    if (options.skipOnMount && initialRef.current) {
      initialRef.current = false;
      return;
    }
    onChangeRef.current(track);
  }, [...dependencies, track, options.skipOnMount]);
}

export type { TrackFunction };
