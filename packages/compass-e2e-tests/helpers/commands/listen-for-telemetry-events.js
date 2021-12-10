module.exports = function (app, page, commands) {
  return async function (telemetry) {
    const existingEventCount = telemetry.events().length;

    function lookupNewEvent(eventName) {
      const newEvents = telemetry.events().slice(existingEventCount);
      return newEvents.find((entry) => entry.event === eventName);
    }

    return async (eventName) => {
      await commands.waitUntil(
        async () => {
          await page.evaluate(() => {
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
