import { EventEmitter } from 'events';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AutoUpdater, FeedURLOptions } from 'electron';
import { autoUpdater as electronAutoUpdater } from 'electron';

const { debug } = createLoggerAndTelemetry('COMPASS-AUTO-UPDATES');

/**
 * Electron autoUpdater doesn't support linux, so we provide our noop
 * implementation so that we can use autoUpdater seamlessly in the manager code
 */
class LinuxAutoUpdater extends EventEmitter implements AutoUpdater {
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

const autoUpdater =
  process.platform === 'linux' ? new LinuxAutoUpdater() : electronAutoUpdater;

export default autoUpdater;
