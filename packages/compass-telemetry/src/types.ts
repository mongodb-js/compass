import type { TelemetryEvent } from './telemetry-events';
export type { TelemetryEvent } from './telemetry-events';

type TelemetryConnectionInfo = {
  id: string;
};

type TelemetryEventPayload<E extends TelemetryEvent> =
  | E['payload']
  | (<E extends TelemetryEvent>() => TelemetryEventPayload<E>)
  | (<E extends TelemetryEvent>() => Promise<TelemetryEventPayload<E>>);

export interface TrackFunction {
  (
    eventName: TelemetryEvent['name'],
    payload: Omit<TelemetryEventPayload<E>, 'connection_id'>,
    connectionInfo?: TelemetryConnectionInfo | undefined
  ): void;
}
