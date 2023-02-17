import { EventEmitter } from 'events';
import os from 'os';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import COMPASS_ICON from './icon';
import type { FeedURLOptions } from 'electron';
import { app, dialog, BrowserWindow } from 'electron';
import { setTimeout as wait } from 'timers/promises';
import autoUpdater from './auto-updater';
import preferences from 'compass-preferences-model';
import got from 'got';
import dl from 'electron-dl';
import type { CompassApplication } from './application';

const { log, mongoLogId, debug, track } = createLoggerAndTelemetry(
  'COMPASS-AUTO-UPDATES'
);

function* toGenerator<T>(promise: Promise<T>) {
  return (yield promise) as T;
}

async function flow(
  this: CompassAutoUpdateManager,
  fn: GeneratorFunction,
  args: unknown[],
  { signal }: { signal: AbortSignal }
) {
  const iterator = fn.call(this, ...args);
  let res: IteratorResult<unknown> = iterator.next();
  while (!res.done) {
    try {
      const value = await res.value;
      if (signal.aborted) {
        throw signal.reason;
      }
      res = iterator.next(value);
    } catch (err) {
      iterator.throw(err);
    }
  }
  return res.value;
}

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
  Idle = 'idle',
}

const FOUR_HOURS = 1000 * 60 * 60 * 4;
const THIRTY_SECONDS = 30_000;

type StateUpdateAction = (
  this: typeof CompassAutoUpdateManager,
  ...args: any[]
) => Generator;

const manualCheck: StateUpdateAction = function* () {
  yield void this.setState(AutoUpdateManagerState.CheckingForUpdates, true);
};

const checkForUpdates: StateUpdateAction = function* checkForUpdates(
  isManualCheck = false
) {
  yield log.info(
    mongoLogId(1001000135),
    'AutoUpdateManager',
    'Checking for updates ...'
  );

  const updateInfo = yield* toGenerator(this.checkForUpdate());

  if (updateInfo) {
    void this.setState(AutoUpdateManagerState.UpdateAvailable, updateInfo);
  } else {
    if (isManualCheck) {
      void dialog.showMessageBox({
        icon: COMPASS_ICON,
        message: 'There are currently no updates available.',
      });
    }
    void this.setState(AutoUpdateManagerState.NoUpdateAvailable);
  }
};

const handleUpdatePrompt: StateUpdateAction =
  function* handleUpdatePrompt(updateInfo: { from: string; to: string }) {
    yield log.info(
      mongoLogId(1001000127),
      'AutoUpdateManager',
      'Update available'
    );

    const answer = yield* toGenerator(
      promptForUpdate(updateInfo.from, updateInfo.to)
    );

    if (answer === 'update') {
      void this.setState(AutoUpdateManagerState.DownloadingUpdate, updateInfo);
    } else if (answer === 'download') {
      void this.setState(AutoUpdateManagerState.ManualDownload, updateInfo);
    } else {
      void this.setState(AutoUpdateManagerState.UpdateDismissed, updateInfo);
    }
  };

const waitAndCheckForUpdate: StateUpdateAction =
  function* waitAndCheckForUpdate() {
    yield log.info(
      mongoLogId(1001000126),
      'AutoUpdateManager',
      'Update not available'
    );

    yield* toGenerator(wait(this.autoUpdateOptions.updateCheckInterval));

    void this.setState(AutoUpdateManagerState.CheckingForUpdates);
  };

const downloadUpdate: StateUpdateAction = function* downloadUpdate(updateInfo) {
  yield track('Autoupdate Accepted', {
    update_version: updateInfo.to,
  });

  const result = yield* toGenerator(this.downloadUpdate());

  if (result.status === 'fulfilled') {
    void this.setState(AutoUpdateManagerState.ReadyToUpdate, updateInfo);
  } else {
    void this.setState(AutoUpdateManagerState.DownloadingError, result.reason);
  }
};

const startInstallerDownload: StateUpdateAction =
  function* startInstallerDownload(updateInfo: { from: string; to: string }) {
    yield log.info(
      mongoLogId(1_001_000_167),
      'AutoUpdateManager',
      'Manual download'
    );

    yield track('Autoupdate Accepted', {
      update_version: updateInfo.to,
      manual_download: true,
    });

    const url = `https://downloads.mongodb.com/compass/${
      process.env.HADRON_PRODUCT
    }-${updateInfo.to}-${process.platform}-${getSystemArch()}.dmg`;

    void dl.download(BrowserWindow.getAllWindows()[0], url);
  };

const promptForRestart: StateUpdateAction =
  function* promptForRestart(updateInfo: { from: string; to: string }) {
    yield log.info(
      mongoLogId(1001000128),
      'AutoUpdateManager',
      'Update downloaded',
      { releaseVersion: updateInfo.to }
    );

    const answer = yield* toGenerator(
      dialog.showMessageBox({
        icon: COMPASS_ICON,
        title: 'Restart to finish the update',
        message: `Restart Compass to finish installing ${updateInfo.to}`,
        detail:
          'Closing this window without restarting may cause some of the features to not work as intended.',
        buttons: ['Restart', 'Close'],
        cancelId: 1,
      })
    );

    if (answer.response === 0) {
      void this.setState(AutoUpdateManagerState.Restarting, updateInfo);
    } else {
      void this.setState(AutoUpdateManagerState.RestartDismissed, updateInfo);
    }
  };

const disableAutoUpdates: StateUpdateAction = function* disableAutoUpdates() {
  yield log.info(
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
    Partial<Record<AutoUpdateManagerState, StateUpdateAction>>
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
    [AutoUpdateManagerState.UpdateAvailable]: handleUpdatePrompt,
    [AutoUpdateManagerState.NoUpdateAvailable]: waitAndCheckForUpdate,
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
    [AutoUpdateManagerState.ManualCheck]: manualCheck,
  },
  [AutoUpdateManagerState.UpdateAvailable]: {
    [AutoUpdateManagerState.DownloadingUpdate]: downloadUpdate,
    [AutoUpdateManagerState.ManualDownload]: startInstallerDownload,
    [AutoUpdateManagerState.UpdateDismissed]: function* (updateInfo) {
      yield track('Autoupdate Dismissed', {
        update_version: updateInfo.to,
      });
    },
    [AutoUpdateManagerState.Disabled]: disableAutoUpdates,
  },
  [AutoUpdateManagerState.DownloadingUpdate]: {
    [AutoUpdateManagerState.ReadyToUpdate]: promptForRestart,
    [AutoUpdateManagerState.DownloadingError]: function* (error) {
      yield log.error(
        mongoLogId(1001000129),
        'AutoUpdateManager',
        'Error Downloading Update',
        { message: error.message }
      );
    },
  },
  [AutoUpdateManagerState.ReadyToUpdate]: {
    [AutoUpdateManagerState.Restarting]: function* (updateInfo) {
      yield log.info(
        mongoLogId(1_001_000_166),
        'AutoUpdateManager',
        'Restart accepted'
      );
      yield track('Application Restart Accepted', {
        update_version: updateInfo.to,
      });
      autoUpdater.quitAndInstall();
    },
    [AutoUpdateManagerState.RestartDismissed]: function* () {
      yield log.info(
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
      const result = await got(this.getUpdateCheckURL());
      if (result.statusCode !== 200) {
        return null;
      }
      try {
        return JSON.parse(result.body);
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

  static async downloadUpdate() {
    try {
      return new Promise<PromiseSettledResult<void>>((resolve) => {
        autoUpdater.once('error', (reason) => {
          resolve({ status: 'rejected', reason });
        });

        autoUpdater.once('update-downloaded', () => {
          resolve({ status: 'fulfilled', value: undefined });
        });
      });
    } finally {
      // checkForUpdate downloads and installs the update when available, there
      // is also no way to interrupt this process so once it starts, disabling
      // updates in the options will not do anything
      autoUpdater.setFeedURL(this.getFeedURLOptions());
      autoUpdater.checkForUpdates();
    }
  }

  private static currentActionAbortController: AbortController =
    new AbortController();

  static stop() {
    this.currentActionAbortController.abort();
  }

  static async setState(newState: AutoUpdateManagerState, ...args: unknown[]) {
    // Something already aborted the state transition outside of the setState
    // loop. This might happen if exit hanler calling stop on the auto update
    // manager was called
    if (this.currentActionAbortController.signal.aborted) {
      return;
    }

    const currentStateHandlers = STATE_UPDATE[this.state];

    if (!currentStateHandlers) {
      debug(`State ${this.state} doesn't support any state transitions`);
    } else if (!currentStateHandlers[newState]) {
      debug(`No state transition from ${this.state} to ${newState} exists`);
    } else {
      this.currentActionAbortController.abort();
      this.currentActionAbortController = new AbortController();
      this.state = newState;
      this.emit('new-state', this.state);

      try {
        await flow.call(
          this,
          currentStateHandlers[newState] as GeneratorFunction,
          args,
          { signal: this.currentActionAbortController.signal }
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        throw err;
      }
    }
  }

  private static _init(
    compassApp: typeof CompassApplication,
    options: Partial<AutoUpdateManagerOptions> = {}
  ): void {
    compassApp.addExitHandler(() => {
      this.stop();
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

    const enabled = !!preferences.getPreferences().autoUpdates;

    preferences.onPreferenceValueChanged('autoUpdates', (enabled) => {
      if (enabled) {
        track('Autoupdate Enabled');
        void this.setState(AutoUpdateManagerState.CheckingForUpdates);
      } else {
        track('Autoupdate Disabled');
        void this.setState(AutoUpdateManagerState.Disabled);
      }
    });

    compassApp.on('check-for-updates', () => {
      void this.setState(AutoUpdateManagerState.ManualCheck);
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
        void this.setState(AutoUpdateManagerState.CheckingForUpdates);
      });
    } else {
      void this.setState(AutoUpdateManagerState.Disabled);
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
