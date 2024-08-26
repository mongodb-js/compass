import type { TelemetryEvent } from './telemetry-events';
export type { TelemetryEvent } from './telemetry-events';

type TelemetryConnectionInfo = {
  id: string;
};

export type TrackFunctionPayload<TPayload extends Record<string, unknown>> =
  | TPayload
  | (() => TPayload)
  | (() => Promise<TPayload>);

export interface TrackFunction {
  <
    TName extends TelemetryEvent['name'],
    TPayload extends Extract<TelemetryEvent, { name: TName }>['payload']
  >(
    eventName: TName,
    payload: TrackFunctionPayload<Omit<TPayload, 'connection_id'>>,
    connectionInfo?: TelemetryConnectionInfo | undefined
  ): void;
}
