import fs from 'fs';
import { DOWNLOADS_PATH } from './test-runner-paths.ts';

export const waitForFileDownload = async (
  filename: string,
  browser: WebdriverIO.Browser
): Promise<{
  fileExists: boolean;
  filePath: string;
}> => {
  const filePath = `${DOWNLOADS_PATH}/${filename}`;
  await browser.waitUntil(
    function () {
      return fs.existsSync(filePath);
    },
    { timeout: 10_000, timeoutMsg: `File ${filePath} not downloaded yet.` }
  );

  return { fileExists: fs.existsSync(filePath), filePath };
};

export const cleanUpDownloadedFile = (filename: string) => {
  const filePath = `${DOWNLOADS_PATH}/${filename}`;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file: ${(err as Error).message}`);
  }
};
