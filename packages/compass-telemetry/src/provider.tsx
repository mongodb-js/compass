import React, { useCallback, useRef } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import {
  createTrack,
  type TelemetryServiceOptions,
  type TrackFunction,
} from './generic-track';
import { useLogger } from '@mongodb-js/compass-logging/provider';

const noop = () => {
  // noop
};

export function createNoopTrack(): TrackFunction {
  return noop;
}

type ConnectionInfo = any;

export const TelemetryContext = React.createContext<{
  track: TrackFunction;
  useConnectionInfo: () => ConnectionInfo;
}>({
  track: createNoopTrack(),
  useConnectionInfo() {
    return {};
  },
});

export const TelemetryProvider: React.FC<{
  options: Omit<TelemetryServiceOptions, 'logger'> & {
    useConnectionInfo: () => ConnectionInfo;
  };
}> = ({ options, children }) => {
  const logger = useLogger('COMPASS-TELEMETRY');
  const value = useRef({
    track: createTrack({
      logger,
      ...options,
    }),
    useConnectionInfo: options.useConnectionInfo,
  });
  return (
    <TelemetryContext.Provider value={value.current}>
      {children}
    </TelemetryContext.Provider>
  );
};

export function createTelemetryLocator() {
  return createServiceLocator(
    useTelemetry.bind(null),
    'createTelemetryLocator'
  );
}

export function useTelemetry(): TrackFunction {
  const { track, useConnectionInfo } = React.useContext(TelemetryContext);
  let connectionInfo;
  try {
    // We are not breaking the rules of hooks because this will always either throw or not
    // eslint-disable-next-line react-hooks/rules-of-hooks
    connectionInfo = useConnectionInfo();
  } catch {
    // We are outside of connection scope
  }
  const connectionInfoRef = useRef(connectionInfo);
  connectionInfoRef.current = connectionInfo;
  return useCallback(
    (event, properties) => {
      track(event, properties, connectionInfoRef.current);
    },
    [track]
  );
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
