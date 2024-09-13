import type {
  ConnectionScopedProperties,
  TelemetryEvent,
} from './telemetry-events';
export type {
  TelemetryEvent,
  IdentifyTraits,
  ExtraConnectionData,
} from './telemetry-events';

type TelemetryConnectionInfo = {
  id: string;
};

export type TrackFunctionPayload<TPayload extends TelemetryEvent['payload']> =
  | Omit<TPayload, 'connection_id'>
  | (() => Omit<TPayload, 'connection_id'>)
  | (() => Promise<Omit<TPayload, 'connection_id'>>);

export interface TrackFunction {
  <
    TName extends TelemetryEvent['name'],
    TPayload extends Extract<TelemetryEvent, { name: TName }>['payload']
  >(
    eventName: TName,
    payload: TrackFunctionPayload<TPayload>,
    ...connectionInfo: TPayload extends ConnectionScopedProperties
      ? [TelemetryConnectionInfo | undefined]
      : []
  ): void;
}
