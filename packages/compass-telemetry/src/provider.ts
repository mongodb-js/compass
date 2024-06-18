import React from 'react';
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
>(
  ReactComponent: T
): React.FunctionComponent<Omit<FirstArgument<T>, 'tracking'>> {
  const WithTelemetry = (
    props: Omit<FirstArgument<T>, 'tracking'> & React.Attributes
  ) => {
    const track = useTelemetry();
    return React.createElement(ReactComponent, { ...props, track });
  };
  return WithTelemetry;
}
