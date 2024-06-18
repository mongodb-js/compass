import type { TrackFunction } from '@mongodb-js/compass-telemetry';

const tracking: { event: string; properties: any }[] = ((
  globalThis as any
).tracking = []);

export const sandBoxTelemetry = {
  createTrack: (): TrackFunction => {
    const track = (event: string, properties: any) => {
      tracking.push({ event, properties });
    };

    return track;
  },
};
