import type { CompassBrowser } from '../compass-browser';

export async function setFeature(
  browser: CompassBrowser,
  name: string,
  value: boolean | string
): Promise<void> {
  await browser.execute(
    (_name, _value) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('electron').ipcRenderer.invoke('compass:save-preferences', {
        [_name]: _value,
      });
    },
    name,
    value
  );

  // Enable telemetry (CompassTelemetry.state).
  // Setting the feature above, just updates it in the global hadron.
  // Since the app has bootrapped already, we force update.
  if (name === 'trackUsageStatistics') {
    const event = value ? 'compass:usage:enabled' : 'compass:usage:disabled';
    await browser.execute((_event) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('electron').ipcRenderer.call(_event);
    }, event);
  }
}
