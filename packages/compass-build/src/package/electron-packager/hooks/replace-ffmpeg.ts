/**
 * Replaces the ffmpeg library that ships with the prebuilt electron, with one that
 * doesn't have proprietart codecs.
 *
 * See: https://stackoverflow.com/a/68041638 and
 * https://github.com/electron/electron-packager/issues/270 for more details.
 */

import type { HookFunction } from 'electron-packager';

export const replaceFfmpeg: HookFunction =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('electron-packager-plugin-non-proprietary-codecs-ffmpeg').default;
