import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { debug } = createLoggerAndTelemetry('COMPASS-INTERCOM');

type WindowWithIntercomGlobals = Window &
  typeof globalThis & {
    Intercom?: (...args: any[]) => any;
    attachEvent?: (...args: any[]) => any;
  };

export enum IntercomTrackingEvent {
  submittedNlPrompt = 'submitted-nl-prompt',
}

export function intercomTrack(
  event: IntercomTrackingEvent,
  metadata?: unknown
) {
  const win = window as WindowWithIntercomGlobals;
  if (typeof win === 'undefined') {
    return;
  }
  if (!win.Intercom || typeof win.Intercom !== 'function') {
    return;
  }

  try {
    win.Intercom('track', event, metadata);
  } catch (error) {
    debug('intercom track error', error);
  }
}
