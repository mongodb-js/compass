import React, { useRef } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import { createTrack, type TelemetryServiceOptions } from './generic-track';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from './types';
import { TestName } from './growth-experiments';

const noop = () => {
  // noop
};

export function createNoopTrack(): TrackFunction {
  return noop;
}

export const TelemetryContext = React.createContext<TrackFunction>(
  createNoopTrack()
);

export const TelemetryProvider: React.FC<{
  options: Omit<TelemetryServiceOptions, 'logger'>;
}> = ({ options, children }) => {
  const logger = useLogger('COMPASS-TELEMETRY');
  const trackFn = useRef(
    createTrack({
      logger,
      ...options,
    })
  );
  return (
    <TelemetryContext.Provider value={trackFn.current}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const telemetryLocator = createServiceLocator(
  useTelemetry.bind(null),
  'telemetryLocator'
);

export function useTelemetry(): TrackFunction {
  const track = React.useContext(TelemetryContext);
  if (!track) {
    throw new Error('Telemetry service is missing from React context');
  }
  return track;
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

/**
 * @deprecated instead of using HOC, refactor class component to functional
 * component
 */
function withTelemetry<
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

export { withTelemetry };

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
 *   if (isShellOpen) { track('Shell Opened', {}, { id: 'connection123' }) }
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

/**
 * Hook that fires Experiment Viewed if user is in an experiment
 *
 * @param testName - The name of the experiment to track.
 * @param shouldFire - A boolean indicating whether to fire the event. Defaults to true.
 *
 * @example
 * useFireExperimentViewed({
 *   testName: TestName.earlyJourneyIndexesGuidance,
 *   shouldFire: enableInIndexesGuidanceExp ,
 * });
 */
export const useFireExperimentViewed = ({
  testName,
  shouldFire = true,
}: {
  testName: TestName;
  shouldFire?: boolean;
}) => {
  useTrackOnChange(
    (track: TrackFunction) => {
      if (!shouldFire) {
        return;
      }
      track('Experiment Viewed', {
        test_name: testName,
      });
    },
    [shouldFire, testName],
    undefined
  );
};

export type { TrackFunction };
export { TestName };
