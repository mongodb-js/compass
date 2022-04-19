/**
 * This is an adaptation of `electron-packager-plugin-non-proprietary-codecs-ffmpeg`
 * for `electron-builder`.
 *
 * Replaces the ffmpeg library that ships with the prebuilt electron, with one that
 * doesn't have proprietart codecs.
 *
 * See: https://stackoverflow.com/a/68041638 and
 * https://github.com/electron/electron-packager/issues/270 for more details.
 */
import path from 'path';
import fs from 'fs';
import type { AfterPackContext } from 'electron-builder';
import makeFetchHappen from 'make-fetch-happen';
import unzipper from 'unzipper';
import { pipeline } from 'stream';
import util from 'util';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function replaceFfmpeg(context: AfterPackContext, dest: string) {
  const electronVersion = context.packager.config.electronVersion;
  if (typeof electronVersion !== 'string') {
    throw new Error('Missing electronVersion');
  }

  const ffmpegFileName = `ffmpeg-v${electronVersion}-${context.electronPlatformName}-${process.arch}.zip`;
  const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/${ffmpegFileName}`;

  const response = await makeFetchHappen(url, {
    cache: 'no-store',
  });

  if (response.status >= 400) {
    throw new Error(response.statusText);
  }

  await util.promisify(pipeline)(
    response.body,
    unzipper.ParseOne(new RegExp(escapeRegExp(path.basename(dest)))),
    fs.createWriteStream(dest, {})
  );
}

export async function replaceLibffmpeg(
  context: AfterPackContext
): Promise<void> {
  const libDir =
    context.electronPlatformName === 'darwin'
      ? path.resolve(
          context.appOutDir,
          `${context.packager.appInfo.productFilename}.app`,
          'Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries'
        )
      : context.appOutDir;

  let libFileName = 'libffmpeg.dll';
  if (context.electronPlatformName === 'darwin') {
    libFileName = 'libffmpeg.dylib';
  } else if (context.electronPlatformName === 'linux') {
    libFileName = 'libffmpeg.so';
  }

  const outFile = path.resolve(libDir, libFileName);

  if (!fs.existsSync(outFile)) {
    throw new Error(
      `No original ffmpeg to be replaced was found. Was looking for: ${outFile}`
    );
  }

  await replaceFfmpeg(context, outFile);
}
