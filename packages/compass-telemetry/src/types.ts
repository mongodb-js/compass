import type { EventsPayload } from './events';

export type TelemetryEvent = keyof EventsPayload;

export type TrackFunction = <T extends keyof EventsPayload>(
  event: T,
  parameters: EventsPayload[T] | (() => Promise<EventsPayload[T]>)
) => void;

export type AsyncTrackFunction = <T extends keyof EventsPayload>(
  event: T,
  parameters: EventsPayload[T] | (() => Promise<EventsPayload[T]>)
) => Promise<void>;
