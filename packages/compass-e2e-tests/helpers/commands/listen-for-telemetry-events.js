module.exports = function (compass) {
  return async function (telemetry) {
    const existingEventCount = telemetry.events().length;
    const { browser } = compass;

    function lookupNewEvent(eventName) {
      const newEvents = telemetry.events().slice(existingEventCount);
      return newEvents.find((entry) => entry.event === eventName);
    }

    return async (eventName) => {
      await browser.waitUntil(
        async () => {
          await browser.execute(() => {
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
  };
};
