import { createLogger } from '@mongodb-js/compass-logging';
const { debug } = createLogger('COMPASS-INTERCOM');

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

  if (
    !win.Intercom ||
    typeof win.Intercom !== 'function' ||
    // the last check is because the packages might be embedded in an environment where an external Intercom lives
    // this way we ensure we don't polute such external Intercom with events intended for Compass Intercom
    !process.env.HADRON_METRICS_INTERCOM_APP_ID
  ) {
    return;
  }

  try {
    win.Intercom('track', event, metadata);
  } catch (error) {
    debug('intercom track error', error);
  }
}
