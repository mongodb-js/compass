import type { EventsPayload } from './events';

export type TelemetryEvent = keyof EventsPayload;

type TrackParameters<T extends keyof EventsPayload> =
  | EventsPayload[T]
  | (() => Promise<EventsPayload[T]>)
  | (() => EventsPayload[T]);

export type TrackFunction = <T extends keyof EventsPayload>(
  event: T,
  parameters: TrackParameters<T>
) => void;

export type AsyncTrackFunction = <T extends keyof EventsPayload>(
  event: T,
  parameters: TrackParameters<T>
) => Promise<void>;
