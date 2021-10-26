import createDebug from 'debug';
import AutoUpdateManager from 'hadron-auto-update-manager';
import { ipcMain } from 'hadron-ipc';
import COMPASS_ICON from './icon';

const debug = createDebug(
  'mongodb-compass:main:application:auto-update-manager'
);

/**
 * Map package.json product names to API endpoint product names.
 */
const API_PRODUCT = {
  'mongodb-compass': 'compass',
  'mongodb-compass-readonly': 'compass-readonly',
};

function isSupportedProduct(str?: string): str is keyof typeof API_PRODUCT {
  return Object.keys(API_PRODUCT).includes(str as string);
}

/**
 * Platform API mappings.
 */
const API_PLATFORM = {
  darwin: 'osx',
  win32: 'windows',
  linux: 'linux',
};

function isSupportedPlatform(str?: string): str is keyof typeof API_PLATFORM {
  return Object.keys(API_PLATFORM).includes(str as string);
}

class CompassAutoUpdateManager {
  private static initCalled = false;

  private static _init(): void {
    if (
      !isSupportedPlatform(process.platform) ||
      !isSupportedProduct(process.env.HADRON_PRODUCT)
    ) {
      return;
    }

    const updateManager = new AutoUpdateManager({
      endpoint: process.env.HADRON_AUTO_UPDATE_ENDPOINT,
      icon: COMPASS_ICON,
      product: API_PRODUCT[process.env.HADRON_PRODUCT],
      channel: process.env.HADRON_CHANNEL,
      platform: API_PLATFORM[process.platform],
    });

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
