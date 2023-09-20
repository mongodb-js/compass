import { EventEmitter } from 'events';
import os from 'os';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import COMPASS_ICON from './icon';
import type { FeedURLOptions } from 'electron';
import { app, dialog, BrowserWindow } from 'electron';
import { setTimeout as wait } from 'timers/promises';
import autoUpdater, { supportsAutoupdater } from './auto-updater';
import preferences from 'compass-preferences-model';
import fetch from 'node-fetch';
import dl from 'electron-dl';
import type { CompassApplication } from './application';

const { log, mongoLogId, debug, track } = createLoggerAndTelemetry(
  'COMPASS-AUTO-UPDATES'
);

function getSystemArch() {
  return process.platform === 'darwin'
    ? os.cpus().some((cpu) => {
        // process.arch / os.arch() will return the arch for which the node
        // binary was compiled. Checking if one of the CPUs has Apple in its
        // name is the way to check (there is slight difference between the
        // earliest models naming and a current one, so we check only for
        // Apple in the name)
        return /Apple/.test(cpu.model);
      })
      ? 'arm64'
      : 'x64'
    : process.arch;
}

async function promptForUpdate(
  from: string,
  to: string
): Promise<'download' | 'update' | 'cancel'> {
  const isMismatchedArchDarwin =
    process.platform === 'darwin' && getSystemArch() !== process.arch;
  const commonOptions = {
    icon: COMPASS_ICON,
    title: 'New version available',
    message: 'A new version of Compass is available to install',
  };

  if (!isMismatchedArchDarwin) {
    const answer = await dialog.showMessageBox({
      ...commonOptions,
      detail: `Compass ${to} is available. You are currently using ${from}. Would you like to download and install it now?`,
      buttons: ['Install', 'Ask me later'],
      cancelId: 1,
    });

    return answer.response === 0 ? 'update' : 'cancel';
  }

  const answer = await dialog.showMessageBox({
    ...commonOptions,
    detail: `Compass ${to} is available. You are currently using a build of Compass that is not optimized for M1/M2 processors. Would you like to download the version of Compass ${to} optimized for M1/M2 processors now?`,
    buttons: [
      'Download Compass for M1/M2 (Recommended)',
      'Update current installation',
      'Ask me later',
    ],
    cancelId: 2,
  });

  return answer.response === 0
    ? 'download'
    : answer.response === 1
    ? 'update'
    : 'cancel';
}

/**
 * AutoUpdateManager is implemented as a state machine with the following flow:
 *
 *     Disabled  ←  Idle      Manual check
 *       ↓↑          ↓          ↓
 *    [      Checking for updates      ]
 *       ↓↑          ↓↑              ↓
 *     Disabled ← Not available    Available → Update dismissed / Manual download (special case for apple silicon)
 *                                   ↓
 *                                  Downloading
 *                                   ↓
 *                                  Ready to update → Restart dismissed
 *                                   ↓
 *                                  Restarting
 *
 * Autoupdate manager can freely switch between disabled, checking for updates,
 * and update not available states.
 *
 * After update is found and user confirmed the update, there is no way to stop
 * the process anymore (because `autoUpdater.checkForUpdates` method will check
 * for updates and automatically install them right away) so starting from
 * downloading state update process can not be interrupted by anything, even
 * disabling autoupdates in settings.
 */
export const enum AutoUpdateManagerState {
  Initial = 'initial',
  Disabled = 'disabled',
  ManualCheck = 'manual-check',
  CheckingForUpdates = 'checking-for-updates',
  NoUpdateAvailable = 'no-update-available',
  UpdateAvailable = 'update-available',
  UpdateDismissed = 'update-dismissed',
  ManualDownload = 'manual-download',
  DownloadingUpdate = 'downloading-update',
  DownloadingError = 'downloading-error',
  ReadyToUpdate = 'ready-to-update',
  Restarting = 'restarting',
  RestartDismissed = 'restart-dismissed',
}

const FOUR_HOURS = 1000 * 60 * 60 * 4;
const THIRTY_SECONDS = 30_000;

type StateUpdateAction = (
  this: { maybeInterrupt(): void | never },
  updateManager: typeof CompassAutoUpdateManager,
  ...args: any[]
) => void | Promise<void>;

const manualCheck: StateUpdateAction = function (updateManager) {
  updateManager.setState(AutoUpdateManagerState.CheckingForUpdates, true);
};

const checkForUpdates: StateUpdateAction = async function checkForUpdates(
  updateManager,
  isManualCheck = false
) {
  log.info(
    mongoLogId(1001000135),
    'AutoUpdateManager',
    'Checking for updates ...'
  );

  this.maybeInterrupt();

  const updateInfo = await updateManager.checkForUpdate();

  this.maybeInterrupt();

  if (updateInfo) {
    updateManager.setState(AutoUpdateManagerState.UpdateAvailable, updateInfo);
  } else {
    if (isManualCheck) {
      void dialog.showMessageBox({
        icon: COMPASS_ICON,
        message: 'There are currently no updates available.',
      });
    }

    this.maybeInterrupt();

    updateManager.setState(AutoUpdateManagerState.NoUpdateAvailable);
  }
};

const disableAutoUpdates: StateUpdateAction = function disableAutoUpdates() {
  log.info(
    mongoLogId(1_001_000_162),
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
          this: { maybeInterrupt(): void | never },
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
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.ManualCheck]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
  },
  [AutoUpdateManagerState.Disabled]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.NoUpdateAvailable]: {
    [AutoUpdateManagerState.CheckingForUpdates]: checkForUpdates,
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.CheckingForUpdates]: {
    [AutoUpdateManagerState.UpdateAvailable]: async function (
      updateManager,
      updateInfo: { from: string; to: string }
    ) {
      log.info(mongoLogId(1001000127), 'AutoUpdateManager', 'Update available');

      this.maybeInterrupt();

      const answer = await promptForUpdate(updateInfo.from, updateInfo.to);

      this.maybeInterrupt();

      if (answer === 'update') {
        updateManager.setState(
          AutoUpdateManagerState.DownloadingUpdate,
          updateInfo
        );
        return;
      }

      if (answer === 'download') {
        updateManager.setState(
          AutoUpdateManagerState.ManualDownload,
          updateInfo
        );
        return;
      }

      updateManager.setState(
        AutoUpdateManagerState.UpdateDismissed,
        updateInfo
      );
    },
    [AutoUpdateManagerState.NoUpdateAvailable]: async function (updateManager) {
      log.info(
        mongoLogId(1001000126),
        'AutoUpdateManager',
        'Update not available'
      );

      this.maybeInterrupt();

      await wait(updateManager.autoUpdateOptions.updateCheckInterval);

      this.maybeInterrupt();

      updateManager.setState(AutoUpdateManagerState.CheckingForUpdates);
    },
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.UpdateAvailable]: {
    [AutoUpdateManagerState.DownloadingUpdate]: function (
      updateManager,
      updateInfo
    ) {
      log.info(
        mongoLogId(1_001_000_246),
        'AutoUpdateManager',
        'Downloading update',
        { releaseVersion: updateInfo.to }
      );
      track('Autoupdate Accepted', { update_version: updateInfo.to });

      this.maybeInterrupt();

      autoUpdater.once('error', (error) => {
        updateManager.setState(AutoUpdateManagerState.DownloadingError, error);
      });

      this.maybeInterrupt();

      autoUpdater.once('update-downloaded', () => {
        updateManager.setState(
          AutoUpdateManagerState.ReadyToUpdate,
          updateInfo
        );
      });

      this.maybeInterrupt();

      // checkForUpdate downloads and installs the update when available, there
      // is also no way to interrupt this process so once it starts, disabling
      // updates in the options will not do anything
      autoUpdater.setFeedURL(updateManager.getFeedURLOptions());

      this.maybeInterrupt();

      autoUpdater.checkForUpdates();
    },
    [AutoUpdateManagerState.ManualDownload]: function (
      _updateManager,
      updateInfo: { from: string; to: string }
    ) {
      log.info(
        mongoLogId(1_001_000_167),
        'AutoUpdateManager',
        'Manual download'
      );

      this.maybeInterrupt();

      track('Autoupdate Accepted', {
        update_version: updateInfo.to,
        manual_download: true,
      });

      this.maybeInterrupt();

      const url = `https://downloads.mongodb.com/compass/${
        process.env.HADRON_PRODUCT
      }-${updateInfo.to}-${process.platform}-${getSystemArch()}.dmg`;
      void dl.download(BrowserWindow.getAllWindows()[0], url);
    },
    [AutoUpdateManagerState.UpdateDismissed]: (_updateManager, updateInfo) => {
      log.info(
        mongoLogId(1_001_000_245),
        'AutoUpdateManager',
        'Update dismissed',
        { releaseVersion: updateInfo.to }
      );
      track('Autoupdate Dismissed', { update_version: updateInfo.to });
    },
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
  },
  [AutoUpdateManagerState.DownloadingUpdate]: {
    [AutoUpdateManagerState.ReadyToUpdate]: async function (
      updateManager,
      updateInfo: { from: string; to: string }
    ) {
      log.info(
        mongoLogId(1001000128),
        'AutoUpdateManager',
        'Update downloaded',
        { releaseVersion: updateInfo.to }
      );

      this.maybeInterrupt();

      const answer = await dialog.showMessageBox({
        icon: COMPASS_ICON,
        title: 'Restart to finish the update',
        message: `Restart Compass to finish installing ${updateInfo.to}`,
        detail:
          'Closing this window without restarting may cause some of the features to not work as intended.',
        buttons: ['Restart', 'Close'],
        cancelId: 1,
      });

      this.maybeInterrupt();

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
    [AutoUpdateManagerState.Restarting]: function (_updateManager, updateInfo) {
      log.info(
        mongoLogId(1_001_000_166),
        'AutoUpdateManager',
        'Restart accepted'
      );

      this.maybeInterrupt();

      track('Application Restart Accepted', { update_version: updateInfo.to });

      this.maybeInterrupt();

      autoUpdater.quitAndInstall();
    },
    [AutoUpdateManagerState.RestartDismissed]: () => {
      log.info(
        mongoLogId(1_001_000_165),
        'AutoUpdateManager',
        'Restart dismissed'
      );
    },
  },
  [AutoUpdateManagerState.ManualDownload]: {
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.UpdateDismissed]: {
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.RestartDismissed]: {
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.DownloadingError]: {
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
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
      const response = await fetch(this.getUpdateCheckURL());
      if (response.status !== 200) {
        return null;
      }
      try {
        return await response.json();
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_163),
          'AutoUpdateManager',
          'Failed to parse update info',
          { error: (err as Error).message }
        );
        return null;
      }
    } catch (err) {
      log.warn(
        mongoLogId(1_001_000_164),
        'AutoUpdateManager',
        'Failed to check for update',
        { error: (err as Error).message }
      );
      return null;
    }
  }

  private static currentActionAbortController: AbortController =
    new AbortController();

  private static currentStateTransition: Promise<unknown | void> | undefined;

  static setState(newState: AutoUpdateManagerState, ...args: unknown[]) {
    // State update was aborted outside state transition loop. This indicates
    // that we completely stopped auto update manager and no other state updates
    // will be allowed
    if (this.currentActionAbortController.signal.aborted) {
      return;
    }

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

    const controller = new AbortController();
    this.currentActionAbortController = controller;
    this.state = newState;
    this.emit('new-state', this.state);

    this.currentStateTransition = currentStateHandlers[newState]
      ?.call(
        {
          maybeInterrupt() {
            if (controller.signal.aborted) {
              throw controller.signal.reason;
            }
          },
        },
        this,
        ...args
      )
      ?.catch((err: Error) => {
        if (err.name !== 'AbortError') {
          throw err;
        }
      });
  }

  private static stop() {
    this.currentActionAbortController.abort();
  }

  private static _init(
    compassApp: typeof CompassApplication,
    options: Partial<AutoUpdateManagerOptions> = {}
  ): void {
    compassApp.addExitHandler(() => {
      this.stop();
      return Promise.resolve();
    });

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

    // TODO(COMPASS-7232): If auto-updates are not supported, then there is
    // still a menu item to check for updates and then if it finds an update but
    // auto-updates aren't supported it will still display a popup with an
    // Install button that does nothing.
    compassApp.on('check-for-updates', () => {
      this.setState(AutoUpdateManagerState.ManualCheck);
    });

    const supported = supportsAutoupdater();
    const enabled = !!preferences.getPreferences().autoUpdates;

    log.info(
      mongoLogId(1001000133),
      'AutoUpdateManager',
      'Setting up updateManager',
      { ...this.autoUpdateOptions, supported, enabled }
    );

    if (!supported) {
      this.setState(AutoUpdateManagerState.Disabled);
      return;
    }

    // If autoupdate is supported, then enable/disable it depending on preferences

    preferences.onPreferenceValueChanged('autoUpdates', (enabled) => {
      log.info(
        mongoLogId(1_001_000_251),
        'AutoUpdateManager',
        `autoUpdate preference toggled to ${enabled ? 'enabled' : 'disabled'}`,
        {
          enabled,
        }
      );

      if (enabled) {
        track('Autoupdate Enabled');
        this.setState(AutoUpdateManagerState.CheckingForUpdates);
      } else {
        track('Autoupdate Disabled');
        this.setState(AutoUpdateManagerState.Disabled);
      }
    });

    // TODO(COMPASS-7233): This is kinda pointless at the moment because the
    // preferences start as disabled and then become enabled the moment they are
    // loaded. Which would immediately kick off the state change.
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

  static init(
    compassApp: typeof CompassApplication,
    options: Partial<AutoUpdateManagerOptions> = {}
  ): void {
    if (!this.initCalled) {
      this.initCalled = true;
      this._init(compassApp, options);
    }
  }

  static on = emitter.on.bind(emitter);
  static off = emitter.off.bind(emitter);
  static once = emitter.once.bind(emitter);
  static emit = emitter.emit.bind(emitter);
}

export { CompassAutoUpdateManager };
