import path from 'path';
import type { CompassBrowser } from '../compass-browser';
import { LOG_SCREENSHOTS_PATH } from '../test-runner-paths';

const withTimeout = (millis: number, promise: Promise<any>) => {
  let timeoutPid: NodeJS.Timeout;
  const timeout = new Promise(
    (resolve, reject) =>
      (timeoutPid = setTimeout(
        () => reject(new Error(`Timed out after ${millis} ms.`)),
        millis
      ))
  );
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutPid) {
      clearTimeout(timeoutPid);
    }
  });
};

export async function screenshot(
  browser: CompassBrowser,
  filename: string
): Promise<void> {
  // Give animations a second. Hard to have a generic way to know if animations
  // are still in progress or not.
  await browser.pause(1000);

  const fullPath = path.join(LOG_SCREENSHOTS_PATH, filename);
  try {
    await withTimeout(10000, browser.saveScreenshot(fullPath));
  } catch (err: any) {
    // For some reason browser.saveScreenshot() sometimes times out on mac with
    // `WARN webdriver: Request timed out! Consider increasing the
    // "connectionRetryTimeout" option.`. The default is 120 seconds.
    console.error(`Unable to save screenshot: ${fullPath}`);
  }
}
