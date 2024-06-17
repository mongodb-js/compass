import React from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import type { TrackFunction } from './track';

const noop = () => {
  // noop
};

export function createNoopTrack(): TrackFunction {
  return noop;
}

const TrackingContext = React.createContext<{
  createTrack(): TrackFunction;
}>({ createTrack: createNoopTrack });

export const TrackingProvider = TrackingContext.Provider;

export function createTrackingLocator() {
  return createServiceLocator(useTracking.bind(null), 'createTrackingLocator');
}

export function useTracking(): TrackFunction {
  const context = React.useContext(TrackingContext);
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

export function withTrack<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(
  ReactComponent: T
): React.FunctionComponent<Omit<FirstArgument<T>, 'tracking'>> {
  const WithTrack = (
    props: Omit<FirstArgument<T>, 'tracking'> & React.Attributes
  ) => {
    const track = useTracking();
    return React.createElement(ReactComponent, { ...props, track });
  };
  return WithTrack;
}
