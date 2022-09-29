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
}
