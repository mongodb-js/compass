export type EventsPayload = Record<string, any>;

export type TelemetryConnectionInfo = {
  id: string;
};

export type TrackParameters =
  | EventsPayload
  | (() => Promise<EventsPayload>)
  | (() => EventsPayload);

export type TrackFunction = (
  event: string,
  parameters?: TrackParameters,
  connectionInfo?: TelemetryConnectionInfo
) => void;

export type AsyncTrackFunction = (
  event: string,
  parameters?: TrackParameters,
  connectionInfo?: TelemetryConnectionInfo
) => Promise<void>;
