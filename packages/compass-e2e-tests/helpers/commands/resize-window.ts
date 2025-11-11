import { inspect } from 'util';
import type { CompassBrowser } from '../compass-browser';
import { isTestingDesktop } from '../test-runner-context';

type WindowSize = Awaited<ReturnType<CompassBrowser['getWindowSize']>>;

function isEqualWithMargin(a: number, b: number, margin = 30) {
  return Math.abs(a - b) <= margin;
}

export async function resizeWindow(
  browser: CompassBrowser,
  width: number,
  height: number,
  dangerouslySkipWaitFor?: boolean
): Promise<WindowSize> {
  let newSize: WindowSize | undefined | void;
  // On macOS you can only change height as much as the system allows, so when
  // on macOS, skip checking for the height matching what we requested. That's
  // not great that we can't be sure that we got what we requested, but there's
  // little we can do and generally speaking we usually mostly care about the
  // width being big enough when resizing
  const skipHeightCheck = process.platform === 'darwin';
  try {
    await browser.waitUntil(async () => {
      // Electron doesn't support setWindowSize / getWindowSize, so we use a
      // custom ipc handler
      if (isTestingDesktop()) {
        newSize = await browser.execute(
          async (_width: number, _height: number) => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return await require('electron').ipcRenderer.invoke(
              'compass:maximize',
              _width,
              _height
            );
          },
          width,
          height
        );
        newSize ??= { width: 0, height: 0 }; // in older compass versions 'compass:maximize' doesn't return anything
      } else {
        await browser.setWindowSize(width, height);
        newSize = await browser.getWindowSize();
      }
      return (
        dangerouslySkipWaitFor ||
        (newSize &&
          isEqualWithMargin(newSize.width, width) &&
          (skipHeightCheck || isEqualWithMargin(newSize.height, height)))
      );
    });
  } catch (err) {
    throw new Error(
      `Failed to update window size: expected ${inspect({
        width,
        height,
      })}, but got ${inspect(newSize)}. Original error:\n\n${
        (err as Error).message
      }`
    );
  }
  return newSize!;
}
