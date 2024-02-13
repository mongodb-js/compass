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
  if (!win.Intercom) {
    console.log('Intercom is not enabled, skipping the event', event);
    return;
  }

  // TODO: add log?
  console.log('Intercom track event', event);
  win.Intercom('track', event, metadata);
}
