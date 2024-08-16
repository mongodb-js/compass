import type { TelemetryEvent } from './telemetry-events';
export type { TelemetryEvent } from './telemetry-events';

type TelemetryConnectionInfo = {
  id: string;
};

type TelemetryEventPayload =
  | TelemetryEvent['payload']
  | (() => TelemetryEvent['payload'])
  | (() => Promise<TelemetryEvent['payload']>);

export interface TrackFunction {
  (
    eventName: TelemetryEvent['name'],
    payload: Omit<TelemetryEventPayload, 'connection_id'>,
    connectionInfo?: TelemetryConnectionInfo | undefined
  ): void;
}
