import { Browser } from 'webdriverio';

// TODO
/*
   {
    requests,
    stop,
    events,
    key,
    screens,
  }
*/
type Telemetry = any;

export default function (
  browser: Browser<'async'>,
  telemetry: Telemetry
): (eventName: string) => Promise<void> {
  const existingEventCount = telemetry.events().length;

  function lookupNewEvent(eventName) {
    const newEvents = telemetry.events().slice(existingEventCount);
    return newEvents.find((entry) => entry.event === eventName);
  }

  return async (eventName) => {
    await browser.waitUntil(
      async () => {
        await browser.execute(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('compass:usage:flush');
        });
        return !!lookupNewEvent(eventName);
      },
      { timeout: 20000 }
    );

    const ev = lookupNewEvent(eventName);
    const properties = { ...ev.properties };
    delete properties.compass_version;
    delete properties.compass_distribution;
    delete properties.compass_channel;
    return properties;
  };
}
