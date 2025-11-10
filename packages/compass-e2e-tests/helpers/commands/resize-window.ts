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
  height: number
): Promise<WindowSize> {
  let newSize: WindowSize | undefined | void;
  try {
    await browser.waitUntil(async () => {
      // Electron doesn't support setWindowSize, so we use a custom ipc handler
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
      } else {
        await browser.setWindowSize(width, height);
        newSize = await browser.getWindowSize();
      }
      return (
        newSize &&
        isEqualWithMargin(newSize.width, width) &&
        isEqualWithMargin(newSize.height, height)
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
