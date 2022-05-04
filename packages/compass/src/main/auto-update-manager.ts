import AutoUpdateManager from 'hadron-auto-update-manager';
import { ipcMain } from 'hadron-ipc';
import COMPASS_ICON from './icon';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, mongoLogId, debug } = createLoggerAndTelemetry(
  'COMPASS-AUTO-UPDATES'
);

/**
 * Map package.json product names to API endpoint product names.
 */
const API_PRODUCT: Record<string, string> = {
  'mongodb-compass': 'compass',
  'mongodb-compass-readonly': 'compass-readonly',
};

/**
 * Platform API mappings.
 */
const API_PLATFORM: Record<string, string> = {
  darwin: 'osx',
  win32: 'windows',
  linux: 'linux',
};

class CompassAutoUpdateManager {
  private static initCalled = false;

  private static _init(): void {
    log.info(
      mongoLogId(1001000130),
      'CompassAutoUpdateManager',
      'Initializing'
    );

    const product = API_PRODUCT[process.env.HADRON_PRODUCT];
    if (!product) {
      log.info(
        mongoLogId(1001000131),
        'CompassAutoUpdateManager',
        'Skipping setup for unknown product',
        {
          productId: product,
        }
      );

      return;
    }

    const platform = API_PLATFORM[process.platform];
    if (!platform) {
      log.info(
        mongoLogId(1001000132),
        'CompassAutoUpdateManager',
        'Skipping setup on unknown platform',
        {
          platformId: platform,
        }
      );

      return;
    }

    const autoUpdateManagerOptions = {
      endpoint: process.env.HADRON_AUTO_UPDATE_ENDPOINT,
      icon: COMPASS_ICON,
      product: product,
      channel: process.env.HADRON_CHANNEL,
      platform: platform,
    };

    log.info(
      mongoLogId(1001000133),
      'CompassAutoUpdateManager',
      'Setting up updateManager',
      {
        ...autoUpdateManagerOptions,
      }
    );

    const updateManager = new AutoUpdateManager(autoUpdateManagerOptions);

    updateManager.on('state-change', (newState) => {
      debug('new state', newState);

      if (newState === 'update-available') {
        ipcMain.broadcast('app:update-available', {
          releaseNotes: updateManager.releaseNotes,
          releaseVersion: updateManager.releaseVersion,
        });
      }
    });

    ipcMain.respondTo({
      'app:install-update': () => {
        updateManager.install();
      },
      'app:enable-auto-update': () => {
        updateManager.enable();
      },
      'app:disable-auto-update': () => {
        updateManager.disable();
      },
      'app:check-for-update': () => {
        updateManager.check();
      },
    });
  }

  static init(): void {
    if (!this.initCalled) {
      this.initCalled = true;
      this._init();
    }
  }
}

export { CompassAutoUpdateManager };
