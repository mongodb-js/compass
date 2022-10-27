import { EventEmitter } from 'events';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AutoUpdater, FeedURLOptions } from 'electron';
import { autoUpdater as electronAutoUpdater } from 'electron';
import got from 'got';

const { debug } = createLoggerAndTelemetry('COMPASS-AUTO-UPDATES');

/**
 * Electron can't currently provide a consistent upgrade path for linux users.
 * Instead, provide a stub class for linux so the auto update service is
 * still called which allows us to know how many Linux users exist.
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
    if (!this.feedURLOptions?.url) {
      debug('No feedURL set.');
      return;
    }
    got(this.feedURLOptions.url)
      .then((res) => {
        debug('got response %j', res);
        setTimeout(() => {
          this.emit('update-downloaded');
        }, 10_000);
      })
      .catch((err) => {
        console.log(err);
        debug('error from updater service', err);
      });
  }
  quitAndInstall() {
    return false;
  }
}

const autoUpdater =
  process.platform === 'linux' ? new LinuxAutoUpdater() : electronAutoUpdater;

export default autoUpdater;
