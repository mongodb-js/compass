import type { ConnectionScopeEvent, GeneralEvent } from './events';

export type TelemetryEvent = ConnectionScopeEvent | GeneralEvent;

export type TelemetryEventParameters = Record<string, any>;

export type TrackFunction = (
  event: TelemetryEvent,
  properties:
    | TelemetryEventParameters
    | (() => Promise<TelemetryEventParameters>)
) => void;
