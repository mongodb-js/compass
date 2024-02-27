import type { CompassBrowser } from '../compass-browser';
import type { Telemetry } from '../telemetry';

// eslint-disable-next-line @typescript-eslint/require-await
export async function listenForTelemetryEvents(
  browser: CompassBrowser,
  telemetry: Telemetry
): Promise<(eventName: string) => Promise<any>> {
  await telemetry.pollForEvents?.(browser);
  const existingEventCount = telemetry.events().length;

  function lookupNewEvent(eventName: string): any {
    const newEvents = telemetry.events().slice(existingEventCount);
    return newEvents.find((entry) => entry.event === eventName);
  }

  return async (eventName) => {
    let ev: { properties?: any } | undefined;

    await browser.waitUntil(async () => {
      await telemetry.pollForEvents?.(browser);
      ev = lookupNewEvent(eventName);
      return !!ev;
    });

    if (!ev) {
      return;
    }

    const properties = { ...ev.properties };
    delete properties.compass_version;
    delete properties.compass_full_version;
    delete properties.compass_distribution;
    delete properties.compass_channel;
    return properties;
  };
}
