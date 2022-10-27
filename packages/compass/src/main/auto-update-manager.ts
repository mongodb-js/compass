import { EventEmitter } from 'events';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import COMPASS_ICON from './icon';
import type { FeedURLOptions } from 'electron';
import { app, dialog } from 'electron';
import { setTimeout as wait } from 'timers/promises';
import autoUpdater from './auto-updater';
import preferences from 'compass-preferences-model';
import got from 'got';

const { log, mongoLogId, debug, track } = createLoggerAndTelemetry(
  'COMPASS-AUTO-UPDATES'
);

/**
 * AutoUpdateManager is implemented as a state machine with the following flow:
 *
 *     Disabled  ←  Idle
 *       ↓↑          ↓
 *    [      Checking for updates      ]
 *       ↓↑          ↓↑              ↓
 *     Disabled ← Not available    Available → Update dismissed
 *                                   ↓
 *                                  Downloading
 *                                   ↓
 *                                  Ready to update → Restart dismissed
 *                                   ↓
 *                                  Restarting
 */
export const enum AutoUpdateManagerState {
  Initial = 'initial',
  Disabled = 'disabled',
  CheckingForUpdates = 'checking-for-updates',
  NoUpdateAvailable = 'no-update-available',
  UpdateAvailable = 'update-available',
  UpdateDismissed = 'update-dismissed',
  DownloadingUpdate = 'downloading-update',
  DownloadingError = 'downloading-error',
  ReadyToUpdate = 'ready-to-update',
  Restarting = 'restarting',
  RestartDismissed = 'restart-dismissed',
}

const FOUR_HOURS = 1000 * 60 * 60 * 4;
const THIRTY_SECONDS = 30_000;

type StateUpdateAction = (
  this: AbortSignal,
  updateManager: typeof CompassAutoUpdateManager,
  ...args: any[]
) => void | Promise<void>;

const checkForUpdates: StateUpdateAction = async function checkForUpdates(
  updateManager
) {
  log.info(
    mongoLogId(1001000135),
    'AutoUpdateManager',
    'Checking for updates ...'
  );
  const updateInfo = await updateManager.checkForUpdate();
  if (this.aborted) {
    return;
  }
  if (updateInfo) {
    updateManager.setState(AutoUpdateManagerState.UpdateAvailable, updateInfo);
  } else {
    updateManager.setState(AutoUpdateManagerState.NoUpdateAvailable);
  }
};

const disableAutoUpdates: StateUpdateAction = function disableAutoUpdates() {
  log.info(
    mongoLogId(1_001_000_148),
    'AutoUpdateManager',
    'Disabling auto updates'
  );
};

/**
 * State update map defined as `{ fromState: toState() }` where toState is the
 * action that needs to happen on state transition
 */
const STATE_UPDATE: Partial<
  Record<
    AutoUpdateManagerState,
    Partial<
      Record<
        AutoUpdateManagerState,
        (
          this: AbortSignal,
          updateManager: typeof CompassAutoUpdateManager,
          ...extraArgs: any[]
        ) => void | Promise<void>
      >
    >
  >
> = {
  [AutoUpdateManagerState.Initial]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
  },
  [AutoUpdateManagerState.Disabled]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
  },
  [AutoUpdateManagerState.NoUpdateAvailable]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
  },
  [AutoUpdateManagerState.CheckingForUpdates]: {
    [AutoUpdateManagerState.UpdateAvailable]: async (
      updateManager,
      updateInfo: { from: string; to: string }
    ) => {
      log.info(mongoLogId(1001000127), 'AutoUpdateManager', 'Update available');

      const answer = await dialog.showMessageBox({
        icon: COMPASS_ICON,
        title: 'New version available',
        message: 'A new version of Compass is available to install',
        detail: `Compass ${updateInfo.to} is available – you are currently using ${updateInfo.from}. Would you like to download and install it now?`,
        buttons: ['Install', 'Ask me later'],
        cancelId: 1,
      });

      if (answer.response === 0) {
        updateManager.setState(
          AutoUpdateManagerState.DownloadingUpdate,
          updateInfo
        );
      } else {
        updateManager.setState(
          AutoUpdateManagerState.UpdateDismissed,
          updateInfo
        );
      }
    },
    [AutoUpdateManagerState.NoUpdateAvailable]: async function (updateManager) {
      log.info(
        mongoLogId(1001000126),
        'AutoUpdateManager',
        'Update not available'
      );
      await wait(updateManager.autoUpdateOptions.updateCheckInterval);
      if (this.aborted) {
        return;
      }
      updateManager.setState(AutoUpdateManagerState.CheckingForUpdates);
    },
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
  },
  [AutoUpdateManagerState.UpdateAvailable]: {
    [AutoUpdateManagerState.DownloadingUpdate]: function (
      updateManager,
      updateInfo
    ) {
      track('Autoupdate Accepted', { update_version: updateInfo.to });

      autoUpdater.once('error', (error) => {
        updateManager.setState(AutoUpdateManagerState.DownloadingError, error);
      });

      autoUpdater.once('update-downloaded', () => {
        updateManager.setState(
          AutoUpdateManagerState.ReadyToUpdate,
          updateInfo
        );
      });
      // checkForUpdate downloads and installs the update when available, there
      // is also no way to interrupt this process so once it starts, disabling
      // updates in the options will not do anything
      autoUpdater.setFeedURL(updateManager.getFeedURLOptions());
      autoUpdater.checkForUpdates();
    },
    [AutoUpdateManagerState.UpdateDismissed]: (_updateManager, updateInfo) => {
      track('Autoupdate Dismissed', { update_version: updateInfo.to });
    },
  },
  [AutoUpdateManagerState.DownloadingUpdate]: {
    [AutoUpdateManagerState.ReadyToUpdate]: async (
      updateManager,
      updateInfo: { from: string; to: string }
    ) => {
      log.info(
        mongoLogId(1001000128),
        'AutoUpdateManager',
        'Update downloaded',
        {
          releaseVersion: updateInfo.to,
        }
      );
      const answer = await dialog.showMessageBox({
        icon: COMPASS_ICON,
        title: 'Restart to finish the update',
        message: `Restart Compass to finish installing ${updateInfo.to}`,
        detail:
          'Closing this window without restarting may cause things to not work as intended.',
        buttons: ['Restart', 'Close'],
        cancelId: 1,
      });
      if (answer.response === 0) {
        updateManager.setState(AutoUpdateManagerState.Restarting, updateInfo);
      } else {
        updateManager.setState(
          AutoUpdateManagerState.RestartDismissed,
          updateInfo
        );
      }
    },
    [AutoUpdateManagerState.DownloadingError]: (_updateManager, error) => {
      log.error(
        mongoLogId(1001000129),
        'AutoUpdateManager',
        'Error Downloading Update',
        { message: error.message }
      );
    },
  },
  [AutoUpdateManagerState.ReadyToUpdate]: {
    [AutoUpdateManagerState.Restarting]: (_updateManager, updateInfo) => {
      track('Application Restart Accepted', { update_version: updateInfo.to });
      app.relaunch();
      app.exit();
    },
    [AutoUpdateManagerState.RestartDismissed]: (_updateManager, updateInfo) => {
      track('Application Restart Dismissed', { update_version: updateInfo.to });
    },
  },
};

/**
 * Map package.json product names to API endpoint product names.
 */
const API_PRODUCT: Record<string, string> = {
  'mongodb-compass': 'compass',
  'mongodb-compass-readonly': 'compass-readonly',
};

export type AutoUpdateManagerOptions = {
  endpoint: string;
  platform: string;
  arch: string;
  product: string;
  channel: string;
  version: string;
  updateCheckInterval: number;
  initialUpdateDelay: number;
};

const emitter = new EventEmitter();

class CompassAutoUpdateManager {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static initCalled = false;
  private static state = AutoUpdateManagerState.Initial;

  static autoUpdateOptions: AutoUpdateManagerOptions;

  static getFeedURLOptions(): FeedURLOptions {
    const { endpoint, product, channel, platform, arch, version } =
      this.autoUpdateOptions;

    return {
      url: `${endpoint}/api/v2/update/${product}/${channel}/${platform}-${arch}/${version}`,
    };
  }

  static getUpdateCheckURL() {
    const { endpoint, product, channel, platform, arch, version } =
      this.autoUpdateOptions;

    return `${endpoint}/api/v2/update/${product}/${channel}/${platform}-${arch}/${version}/check`;
  }

  static async checkForUpdate(): Promise<{
    name: string;
    from: string;
    to: string;
  } | null> {
    try {
      const result = await got(this.getUpdateCheckURL());
      if (result.statusCode !== 200) {
        return null;
      }
      try {
        return JSON.parse(result.body);
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_146),
          'AutoUpdateManager',
          'Failed to parse update info',
          { error: (err as Error).message }
        );
        return null;
      }
    } catch (err) {
      log.warn(
        mongoLogId(1_001_000_141),
        'AutoUpdateManager',
        'Failed to check for update',
        { error: (err as Error).message }
      );
      return null;
    }
  }

  private static currentActionAbortController: AbortController =
    new AbortController();

  static setState(newState: AutoUpdateManagerState, ...args: unknown[]) {
    const currentStateHandlers = STATE_UPDATE[this.state];

    if (!currentStateHandlers) {
      debug(`State ${this.state} doesn't support any state transitions`);
      return;
    }

    if (!currentStateHandlers[newState]) {
      debug(`No state transition from ${this.state} to ${newState} exists`);
      return;
    }

    this.currentActionAbortController.abort();
    this.currentActionAbortController = new AbortController();
    this.state = newState;
    this.emit('new-state', this.state);

    void currentStateHandlers[newState]?.call(
      this.currentActionAbortController.signal,
      this,
      ...args
    );
  }

  private static _init(options: Partial<AutoUpdateManagerOptions> = {}): void {
    log.info(mongoLogId(1001000130), 'AutoUpdateManager', 'Initializing');

    const product = API_PRODUCT[process.env.HADRON_PRODUCT];

    if (!product) {
      log.info(
        mongoLogId(1001000131),
        'AutoUpdateManager',
        'Skipping setup for unknown product',
        {
          productId: process.env.HADRON_PRODUCT,
        }
      );

      return;
    }

    this.autoUpdateOptions = {
      endpoint: process.env.HADRON_AUTO_UPDATE_ENDPOINT,
      product: product,
      channel: process.env.HADRON_CHANNEL,
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      updateCheckInterval: FOUR_HOURS,
      initialUpdateDelay: THIRTY_SECONDS,
      ...options,
    };

    const enabled = !!preferences.getPreferences().autoUpdates;

    preferences.onPreferenceValueChanged('autoUpdates', (enabled) => {
      if (enabled) {
        track('Autoupdate Enabled');
        this.setState(AutoUpdateManagerState.CheckingForUpdates);
      } else {
        track('Autoupdate Disabled');
        this.setState(AutoUpdateManagerState.Disabled);
      }
    });

    log.info(
      mongoLogId(1001000133),
      'AutoUpdateManager',
      'Setting up updateManager',
      { ...this.autoUpdateOptions, enabled }
    );

    if (enabled) {
      // Do not kick off update check immediately, wait a little before that so
      // that we 1) don't waste time checking on the application start 2) don't
      // show the popup while the app is loading
      void wait(this.autoUpdateOptions.initialUpdateDelay).then(() => {
        this.setState(AutoUpdateManagerState.CheckingForUpdates);
      });
    } else {
      this.setState(AutoUpdateManagerState.Disabled);
    }
  }

  static init(options: Partial<AutoUpdateManagerOptions> = {}): void {
    if (!this.initCalled) {
      this.initCalled = true;
      this._init(options);
    }
  }

  static on = emitter.on.bind(emitter);
  static off = emitter.off.bind(emitter);
  static once = emitter.once.bind(emitter);
  static emit = emitter.emit.bind(emitter);
}

export { CompassAutoUpdateManager };
