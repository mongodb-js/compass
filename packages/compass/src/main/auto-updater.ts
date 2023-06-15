import path from 'path';
import { EventEmitter } from 'events';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AutoUpdater, FeedURLOptions } from 'electron';
import { autoUpdater as electronAutoUpdater } from 'electron';
import { pathExistsSync } from 'fs-extra';

const { debug } = createLoggerAndTelemetry('COMPASS-AUTO-UPDATES');

/**
 * Electron autoUpdater doesn't support linux, so we provide our noop
 * implementation so that we can use autoUpdater seamlessly in the manager code
 */
class NoopAutoUpdater extends EventEmitter implements AutoUpdater {
  private feedURLOptions: FeedURLOptions | null = null;
  setFeedURL(feedURLOptions: FeedURLOptions) {
    this.feedURLOptions = feedURLOptions;
    debug(`feedURL is \`${this.feedURLOptions.url}\``);
  }
  getFeedURL() {
    return this.feedURLOptions?.url ?? '';
  }
  checkForUpdates() {
    // noop
  }
  quitAndInstall() {
    return false;
  }
}

function hasSquirrel() {
  const updateExe = path.resolve(
    path.dirname(process.execPath),
    '..',
    'Update.exe'
  );
  return pathExistsSync(updateExe);
}

function supportsAutoupdater() {
  if (process.platform === 'linux') {
    return false;
  }

  if (process.platform === 'win32') {
    return hasSquirrel();
  }

  return true;
}

const autoUpdater = supportsAutoupdater()
  ? electronAutoUpdater
  : new NoopAutoUpdater();

export default autoUpdater;
