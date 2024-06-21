import {
  useTelemetry,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { connectionInfoAccessLocator } from './provider';
import React from 'react';

export type ConnectionScopedTrackFunction = (
  event: Parameters<TrackFunction>[0],
  parameters: Omit<Parameters<TrackFunction>[1], 'connectionId'>
) => ReturnType<TrackFunction>;

export function useConnectionScopedTelemetry(): ConnectionScopedTrackFunction {
  const track = useTelemetry();
  const connectionInfoAccess = connectionInfoAccessLocator();
  const curriedTrack: ConnectionScopedTrackFunction = (event, parameters) => {
    track(event, {
      ...parameters,
      connectionId: connectionInfoAccess.getCurrentConnectionInfo().id,
    });
  };

  return curriedTrack;
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

export function withConnectionScopedTelemetry<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(ReactComponent: T): React.FunctionComponent<Omit<FirstArgument<T>, 'track'>> {
  const WithTelemetry = (
    props: Omit<FirstArgument<T>, 'track'> & React.Attributes
  ) => {
    const track = useConnectionScopedTelemetry();
    return React.createElement(ReactComponent, { ...props, track });
  };
  return WithTelemetry;
}
