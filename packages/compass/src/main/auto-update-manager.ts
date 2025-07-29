import assert from 'assert/strict';
import { EventEmitter } from 'events';
import os from 'os';
import { createLogger } from '@mongodb-js/compass-logging';
import COMPASS_ICON from './icon';
import type { FeedURLOptions } from 'electron';
import { app, dialog, BrowserWindow, autoUpdater, shell } from 'electron';
import { setTimeout as wait } from 'timers/promises';
import path from 'path';
import fs from 'fs';
import dl from 'electron-dl';
import type { CompassApplication } from './application';
import { ipcMain } from 'hadron-ipc';
import semver from 'semver';
import type { PreferencesAccess } from 'compass-preferences-model';
import { getOsInfo } from '@mongodb-js/get-os-info';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';
import type { Response } from '@mongodb-js/devtools-proxy-support';
import { pathToFileURL } from 'url';

const { log, mongoLogId, debug } = createLogger('COMPASS-AUTO-UPDATES');
const track = createIpcTrack();

function hasSquirrel() {
  const updateExe = path.resolve(
    path.dirname(process.execPath),
    '..',
    'Update.exe'
  );
  return fs.existsSync(updateExe);
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

function isMismatchedArchDarwin(): boolean {
  return process.platform === 'darwin' && getSystemArch() !== process.arch;
}

async function waitForWindow(timeout = 5_000) {
  const start = Date.now();
  while (start + timeout > Date.now()) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      return window;
    }
  }
  return null;
}

async function download(url: string): Promise<void> {
  const maybeWindow = await waitForWindow();
  if (maybeWindow) {
    await dl.download(maybeWindow, url, {
      onCompleted(file) {
        const fileURL = pathToFileURL(file.path).toString();
        void shell.openExternal(fileURL);
      },
    });
  } else {
    await shell.openExternal(url);
  }
}

function getMacOSDownloadUrl(channel: string, version: string): string {
  version = channel === 'dev' ? 'latest' : version;
  return `https://compass.mongodb.com/api/v2/download/${version}/compass/${channel}/darwin-${getSystemArch()}`;
}

type PromptForUpdateResult = 'download' | 'update' | 'cancel';
async function promptForUpdate(
  from: string,
  to: string
): Promise<PromptForUpdateResult> {
  const commonOptions = {
    icon: COMPASS_ICON,
    title: 'New version available',
    message: 'A new version of Compass is available to install',
  };

  if (!isMismatchedArchDarwin()) {
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
    detail: `Compass ${to} is available. You are currently using a build of Compass that is not optimized for Apple processors. Would you like to download the version of Compass ${to} optimized for Apple processors now?`,
    buttons: [
      'Download Compass for Apple silicon (Recommended)',
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
  UserPromptedManualCheck = 'manual-check',
  CheckingForUpdatesForManualCheck = 'checking-for-updates-manual',
  CheckingForUpdatesForAutomaticCheck = 'checking-for-updates-automatic',
  NoUpdateAvailable = 'no-update-available',
  UpdateAvailable = 'update-available',
  UpdateDismissed = 'update-dismissed',
  ManualDownload = 'manual-download',
  DownloadingUpdate = 'downloading-update',
  DownloadingError = 'downloading-error',
  PromptForRestart = 'prompt-for-restart',
  Restarting = 'restarting',
  RestartDismissed = 'restart-dismissed',
  PromptToUpdateExternally = 'prompt-to-update-externally',
  OutdatedOperatingSystem = 'outdated-operating-system',
}

type UpdateInfo = {
  from: string;
  to: string;
};

const FOUR_HOURS = 1000 * 60 * 60 * 4;
const THIRTY_SECONDS = 30_000;

type StateEnterAction = (
  this: { maybeInterrupt(): void | never },
  updateManager: typeof CompassAutoUpdateManager,
  fromState: AutoUpdateManagerState,
  ...args: any[]
) => void | Promise<void>;

const manualCheck: StateEnterAction = function (updateManager) {
  updateManager.setState(
    AutoUpdateManagerState.CheckingForUpdatesForManualCheck
  );
};

const checkForUpdates: StateEnterAction = async function checkForUpdates(
  updateManager,
  fromState
) {
  log.info(
    mongoLogId(1001000135),
    'AutoUpdateManager',
    'Checking for updates ...'
  );

  this.maybeInterrupt();

  const updateInfo = await updateManager.checkForUpdate();

  this.maybeInterrupt();

  if (updateInfo.available) {
    updateManager.setState(AutoUpdateManagerState.UpdateAvailable, updateInfo);
  } else {
    if (fromState === AutoUpdateManagerState.UserPromptedManualCheck) {
      if (updateInfo.reason === 'outdated-operating-system') {
        void dialog
          .showMessageBox({
            icon: COMPASS_ICON,
            message: `The version of your operating system is no longer supported. Expected at least ${updateInfo.expectedVersion}.`,
            buttons: ['OK', 'Visit Documentation on System Requirements'],
          })
          .then(async (value) => {
            if (value.response === 1) {
              await shell.openExternal(
                'https://www.mongodb.com/docs/compass/current/install/'
              );
            }
          });
      } else {
        void dialog.showMessageBox({
          icon: COMPASS_ICON,
          message: 'There are currently no updates available.',
        });
      }
    }

    if (updateInfo.reason === 'outdated-operating-system') {
      updateManager.setState(AutoUpdateManagerState.OutdatedOperatingSystem);
      return;
    }

    this.maybeInterrupt();

    updateManager.setState(AutoUpdateManagerState.NoUpdateAvailable);
  }
};

const disableAutoUpdates: StateEnterAction = function disableAutoUpdates() {
  log.info(
    mongoLogId(1_001_000_162),
    'AutoUpdateManager',
    'Disabling auto updates'
  );
};

interface AutoUpdateManagerStateDefinition {
  nextStates: AutoUpdateManagerState[];
  enter: StateEnterAction;
}

const noop = () => {
  /* noop */
};

/**
 * State update map defined as `{ state: [fromStates, enter()]}` where `enter` is
 * the action that needs to happen when entering the respective state.
 */
const STATE_UPDATE: Record<
  AutoUpdateManagerState,
  AutoUpdateManagerStateDefinition
> = {
  [AutoUpdateManagerState.Initial]: {
    nextStates: [
      AutoUpdateManagerState.CheckingForUpdatesForManualCheck,
      AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck,
      AutoUpdateManagerState.Disabled,
      AutoUpdateManagerState.UserPromptedManualCheck,
    ],
    enter: noop,
  },
  [AutoUpdateManagerState.UserPromptedManualCheck]: {
    nextStates: [AutoUpdateManagerState.CheckingForUpdatesForManualCheck],
    enter: manualCheck,
  },
  [AutoUpdateManagerState.Disabled]: {
    nextStates: [
      AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck,
      AutoUpdateManagerState.UserPromptedManualCheck,
    ],
    enter: disableAutoUpdates,
  },
  [AutoUpdateManagerState.NoUpdateAvailable]: {
    nextStates: [
      AutoUpdateManagerState.CheckingForUpdatesForManualCheck,
      AutoUpdateManagerState.UserPromptedManualCheck,
      AutoUpdateManagerState.Disabled,
    ],
    enter: async function (updateManager) {
      log.info(
        mongoLogId(1001000126),
        'AutoUpdateManager',
        'Update not available'
      );

      this.maybeInterrupt();

      await wait(updateManager.autoUpdateOptions.updateCheckInterval);

      this.maybeInterrupt();

      updateManager.setState(
        AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck
      );
    },
  },
  [AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck]: {
    nextStates: [
      AutoUpdateManagerState.UpdateAvailable,
      AutoUpdateManagerState.NoUpdateAvailable,
      AutoUpdateManagerState.Disabled,
      AutoUpdateManagerState.UserPromptedManualCheck,
      AutoUpdateManagerState.OutdatedOperatingSystem,
    ],
    enter: checkForUpdates,
  },
  [AutoUpdateManagerState.CheckingForUpdatesForManualCheck]: {
    nextStates: [
      AutoUpdateManagerState.UpdateAvailable,
      AutoUpdateManagerState.NoUpdateAvailable,
      AutoUpdateManagerState.Disabled,
      AutoUpdateManagerState.UserPromptedManualCheck,
      AutoUpdateManagerState.OutdatedOperatingSystem,
    ],
    enter: checkForUpdates,
  },
  [AutoUpdateManagerState.UpdateAvailable]: {
    nextStates: [
      AutoUpdateManagerState.DownloadingUpdate,
      AutoUpdateManagerState.ManualDownload,
      AutoUpdateManagerState.UpdateDismissed,
      AutoUpdateManagerState.Disabled,
      AutoUpdateManagerState.PromptToUpdateExternally,
    ],
    enter: async function (updateManager, fromState, updateInfo: UpdateInfo) {
      const automaticCheck =
        fromState ===
        AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck;
      log.info(
        mongoLogId(1001000127),
        'AutoUpdateManager',
        'Update available',
        { automaticCheck }
      );

      if (!supportsAutoupdater()) {
        updateManager.setState(
          AutoUpdateManagerState.PromptToUpdateExternally,
          updateInfo,
          !automaticCheck
        );
        return;
      }

      let answer: PromptForUpdateResult;
      if (
        automaticCheck &&
        !updateManager.isDowngradedCompassInstallation() &&
        !isMismatchedArchDarwin()
      ) {
        answer = 'update';
      } else {
        answer = await promptForUpdate(updateInfo.from, updateInfo.to);
      }

      this.maybeInterrupt();

      if (answer === 'update') {
        updateManager.setState(
          AutoUpdateManagerState.DownloadingUpdate,
          updateInfo,
          !automaticCheck
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
  },
  [AutoUpdateManagerState.DownloadingUpdate]: {
    nextStates: [
      AutoUpdateManagerState.PromptForRestart,
      AutoUpdateManagerState.DownloadingError,
    ],
    enter: function (
      updateManager,
      _fromState,
      updateInfo: UpdateInfo,
      isDownloadForManualCheck: boolean
    ) {
      log.info(
        mongoLogId(1_001_000_246),
        'AutoUpdateManager',
        'Downloading update',
        { releaseVersion: updateInfo.to, isDownloadForManualCheck }
      );
      track('Autoupdate Accepted', {
        update_version: updateInfo.to,
        manual_update: isDownloadForManualCheck,
      });

      this.maybeInterrupt();

      autoUpdater.once('error', (error) => {
        updateManager.setState(AutoUpdateManagerState.DownloadingError, error);
      });

      this.maybeInterrupt();

      autoUpdater.once('update-downloaded', () => {
        updateManager.setState(
          AutoUpdateManagerState.PromptForRestart,
          updateInfo
        );
      });

      this.maybeInterrupt();

      // checkForUpdate downloads and installs the update when available, there
      // is also no way to interrupt this process so once it starts, disabling
      // updates in the options will not do anything
      autoUpdater.setFeedURL(updateManager.getFeedURLOptions());

      this.maybeInterrupt();

      ipcMain?.broadcast('autoupdate:update-download-in-progress', {
        newVersion: updateInfo.to,
      });

      autoUpdater.checkForUpdates();
    },
  },
  [AutoUpdateManagerState.PromptForRestart]: {
    nextStates: [
      AutoUpdateManagerState.Restarting,
      AutoUpdateManagerState.RestartDismissed,
    ],
    enter: function (updateManager, _fromState, updateInfo: UpdateInfo) {
      log.info(
        mongoLogId(1001000128),
        'AutoUpdateManager',
        'Update downloaded',
        { releaseVersion: updateInfo.to }
      );

      this.maybeInterrupt();

      ipcMain?.broadcast('autoupdate:update-download-success', {
        newVersion: updateInfo.to,
      });
    },
  },
  [AutoUpdateManagerState.ManualDownload]: {
    nextStates: [AutoUpdateManagerState.UserPromptedManualCheck],
    enter: function (updateManager, _fromState, updateInfo: UpdateInfo) {
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

      if (!supportsAutoupdater()) {
        return shell.openExternal(
          'https://www.mongodb.com/try/download/compass'
        );
      }

      const url = getMacOSDownloadUrl(
        updateManager.autoUpdateOptions.channel,
        updateInfo.to
      );
      void download(url);
    },
  },
  [AutoUpdateManagerState.UpdateDismissed]: {
    nextStates: [AutoUpdateManagerState.UserPromptedManualCheck],
    enter: (_updateManager, _fromState, updateInfo: UpdateInfo) => {
      log.info(
        mongoLogId(1_001_000_245),
        'AutoUpdateManager',
        'Update dismissed',
        { releaseVersion: updateInfo.to }
      );
      track('Autoupdate Dismissed', { update_version: updateInfo.to });
    },
  },
  [AutoUpdateManagerState.RestartDismissed]: {
    nextStates: [AutoUpdateManagerState.UserPromptedManualCheck],
    enter: () => {
      log.info(
        mongoLogId(1_001_000_165),
        'AutoUpdateManager',
        'Restart dismissed'
      );
    },
  },
  [AutoUpdateManagerState.OutdatedOperatingSystem]: {
    nextStates: [AutoUpdateManagerState.UserPromptedManualCheck],
    enter: () => {
      ipcMain?.broadcast(
        'autoupdate:update-download-failed',
        'outdated-operating-system'
      );
      log.info(
        mongoLogId(1_001_000_346),
        'AutoUpdateManager',
        'Outdated operating system'
      );
    },
  },
  [AutoUpdateManagerState.DownloadingError]: {
    nextStates: [AutoUpdateManagerState.UserPromptedManualCheck],
    enter: (_updateManager, _fromState, error) => {
      ipcMain?.broadcast('autoupdate:update-download-failed');
      log.error(
        mongoLogId(1001000129),
        'AutoUpdateManager',
        'Error Downloading Update',
        {
          message: error.message,
          attr: { code: error.code, domain: error.domain },
        }
      );
    },
  },
  [AutoUpdateManagerState.Restarting]: {
    nextStates: [],
    enter: function () {
      log.info(
        mongoLogId(1_001_000_166),
        'AutoUpdateManager',
        'Restart accepted'
      );

      this.maybeInterrupt();

      track('Application Restart Accepted', {
        //
      });

      this.maybeInterrupt();

      autoUpdater.quitAndInstall();
    },
  },
  [AutoUpdateManagerState.PromptToUpdateExternally]: {
    nextStates: [
      AutoUpdateManagerState.UpdateDismissed,
      AutoUpdateManagerState.ManualDownload,
    ],
    enter: async function (
      updateManager,
      _fromState,
      updateInfo: UpdateInfo,
      isDownloadForManualCheck: boolean
    ) {
      log.info(
        mongoLogId(1_001_000_247),
        'AutoUpdateManager',
        'Prompting to download externally',
        { releaseVersion: updateInfo.to, isDownloadForManualCheck }
      );

      if (!isDownloadForManualCheck) {
        ipcMain?.broadcast('autoupdate:download-update-externally', {
          currentVersion: updateInfo.from,
          newVersion: updateInfo.to,
        });
        return;
      }

      const answer = await dialog.showMessageBox({
        icon: COMPASS_ICON,
        title: 'New version available',
        message: `Compass ${updateInfo.to} is available`,
        detail: `You are currently using ${updateInfo.from}. Update now for the latest Compass features.`,
        buttons: ['Visit download center', 'Ask me later'],
        cancelId: 1,
      });

      this.maybeInterrupt();

      if (answer.response === 1) {
        updateManager.setState(
          AutoUpdateManagerState.UpdateDismissed,
          updateInfo
        );
        return;
      }

      updateManager.setState(AutoUpdateManagerState.ManualDownload, updateInfo);
      return;
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

type AutoUpdateResponse =
  | {
      available: true;
      name: string;
      from: string;
      to: string;
    }
  | {
      available: false;
      reason?: never;
    }
  | {
      available: false;
      reason: 'outdated-operating-system';
      expectedVersion: string;
    };

const emitter = new EventEmitter();

class CompassAutoUpdateManager {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static initCalled = false;
  private static state = AutoUpdateManagerState.Initial;
  private static fetch: (url: string) => Promise<Response>;

  static autoUpdateOptions: AutoUpdateManagerOptions;
  static preferences: PreferencesAccess;

  static getFeedURLOptions(): FeedURLOptions {
    const { endpoint, product, channel, platform, arch, version } =
      this.autoUpdateOptions;

    return {
      url: `${endpoint}/api/v2/update/${product}/${channel}/${platform}-${arch}/${version}`,
    };
  }

  static async getUpdateCheckURL() {
    const { endpoint, product, channel, platform, arch, version } =
      this.autoUpdateOptions;
    const {
      os_release: release,
      os_linux_dist,
      os_linux_release,
      os_darwin_product_version,
    } = await getOsInfo();
    const url = new URL(
      `${endpoint}/api/v2/update/${product}/${channel}/${platform}-${arch}/${version}/check`
    );

    for (const [key, value] of Object.entries({
      release,
      os_linux_dist,
      os_linux_release,
      os_darwin_product_version,
    })) {
      if (typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    }

    return url;
  }

  static async checkForUpdate(): Promise<AutoUpdateResponse> {
    try {
      const response = await this.fetch((await this.getUpdateCheckURL()).href);

      if (response.status === 426) {
        try {
          const json = await response.json();
          assert(
            typeof json === 'object' && json !== null,
            'Expected response to be an object'
          );
          if ('reason' in json && json.reason === 'outdated-operating-system') {
            assert(
              'expectedVersion' in json,
              "Expected 'expectedVersion' in response"
            );
            const { expectedVersion } = json;
            assert(
              typeof expectedVersion === 'string',
              "Expected 'expectedVersion' in response"
            );
            return {
              available: false,
              reason: 'outdated-operating-system',
              expectedVersion,
            };
          } else {
            // Some future reason that no update is available
            return {
              available: false,
            };
          }
        } catch (err) {
          log.warn(
            mongoLogId(1_001_000_347),
            'AutoUpdateManager',
            'Failed to parse HTTP 426 (Upgrade Required) response',
            { error: err instanceof Error ? err.message : 'Unknown error' }
          );
          return { available: false };
        }
      } else if (response.status !== 200) {
        return { available: false };
      }

      try {
        const json = await response.json();
        assert(
          typeof json === 'object' && json !== null,
          'Expected response to be an object'
        );
        assert('name' in json, 'Expected "name" in response');
        assert('to' in json, 'Expected "to" in response');
        assert('from' in json, 'Expected "from" in response');

        const { name, from, to } = json;
        assert(typeof name === 'string', 'Expected "name" to be a string');
        assert(typeof from === 'string', 'Expected "from" to be a string');
        assert(typeof to === 'string', 'Expected "to" to be a string');

        return { available: true, name, from, to };
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_163),
          'AutoUpdateManager',
          'Failed to parse update info',
          { error: (err as Error).message }
        );
        return { available: false };
      }
    } catch (err) {
      log.warn(
        mongoLogId(1_001_000_164),
        'AutoUpdateManager',
        'Failed to check for update',
        { error: (err as Error).message }
      );
      return { available: false };
    }
  }

  private static currentActionAbortController: AbortController =
    new AbortController();

  private static currentStateTransition: Promise<unknown> | undefined;

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

    if (!currentStateHandlers.nextStates.includes(newState)) {
      debug(`No state transition from ${this.state} to ${newState} exists`);
      return;
    }

    this.currentActionAbortController.abort();

    const previousState = this.state;
    const controller = new AbortController();
    this.currentActionAbortController = controller;
    this.state = newState;
    this.emit('new-state', this.state);

    this.currentStateTransition = STATE_UPDATE[newState].enter
      .call(
        {
          maybeInterrupt() {
            if (controller.signal.aborted) {
              throw controller.signal.reason;
            }
          },
        },
        this,
        previousState,
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

  private static handleIpcUpdateDownloadRestartConfirmed() {
    this.setState(AutoUpdateManagerState.Restarting);
  }

  private static handleIpcUpdateDownloadRestartDismissed() {
    this.setState(AutoUpdateManagerState.RestartDismissed);
  }

  private static checkForMismatchedMacOSArch() {
    const mismatchedOnArm =
      isMismatchedArchDarwin() && getSystemArch() === 'arm64';

    if (!mismatchedOnArm) {
      return;
    }

    void dialog
      .showMessageBox({
        icon: COMPASS_ICON,
        message: 'Mismatched architecture detected',
        detail:
          'You are currently using a build of Compass that is not optimized for Apple Silicon processors. This version might have significant performance issues when used. ' +
          'Would you like to download the version of Compass optimized for Apple Silicon processors now?',
        buttons: [
          'Download Compass for Apple Silicon (Recommended)',
          'Not now',
        ],
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          const url = getMacOSDownloadUrl(
            this.autoUpdateOptions.channel,
            this.autoUpdateOptions.version
          );
          return download(url);
        }
      })
      .catch((err) => {
        log.warn(
          mongoLogId(1_001_000_362),
          'AutoUpdateManager',
          'Failed to download Compass for a mismatched macos arch',
          { error: err.message }
        );
      });
  }

  private static async _init(
    compassApp: typeof CompassApplication,
    options: Partial<AutoUpdateManagerOptions> = {}
  ): Promise<void> {
    await app.whenReady();

    this.fetch = (url: string) => compassApp.httpClient.fetch(url);

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
      endpoint:
        process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE ??
        process.env.HADRON_AUTO_UPDATE_ENDPOINT,
      product: product,
      channel: process.env.HADRON_CHANNEL,
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      updateCheckInterval: FOUR_HOURS,
      initialUpdateDelay: THIRTY_SECONDS,
      ...options,
    };

    this.checkForMismatchedMacOSArch();

    // TODO(COMPASS-7232): If auto-updates are not supported, then there is
    // still a menu item to check for updates and then if it finds an update but
    // auto-updates aren't supported it will still display a popup with an
    // Install button that does nothing.
    compassApp.on('check-for-updates', () => {
      this.setState(AutoUpdateManagerState.UserPromptedManualCheck);
    });

    this.on('new-state', (state: AutoUpdateManagerState) =>
      compassApp.emit('auto-updater:new-state', state)
    );

    compassApp.on(
      'menu-request-restart',
      this.setState.bind(this, AutoUpdateManagerState.Restarting)
    );

    ipcMain?.on(
      'autoupdate:update-download-restart-confirmed',
      this.handleIpcUpdateDownloadRestartConfirmed.bind(this)
    );

    ipcMain?.on(
      'autoupdate:update-download-restart-dismissed',
      this.handleIpcUpdateDownloadRestartDismissed.bind(this)
    );

    ipcMain?.on(
      'autoupdate:download-update-dismissed',
      this.setState.bind(this, AutoUpdateManagerState.UpdateDismissed)
    );

    const { preferences } = compassApp;
    this.preferences = preferences;
    const supported = supportsAutoupdater();
    const enabled = !!preferences.getPreferences().autoUpdates;

    log.info(
      mongoLogId(1001000133),
      'AutoUpdateManager',
      'Setting up updateManager',
      { ...this.autoUpdateOptions, supported, enabled }
    );

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
        track('Autoupdate Enabled', {
          //
        });
        this.setState(
          AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck
        );
      } else {
        track('Autoupdate Disabled', {
          //
        });
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
        this.setState(
          AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck
        );
      });
    } else {
      this.setState(AutoUpdateManagerState.Disabled);
    }
  }

  static isDowngradedCompassInstallation(): boolean {
    const { highestInstalledVersion } = this.preferences.getPreferences();
    return (
      !!highestInstalledVersion &&
      semver.lt(app.getVersion(), highestInstalledVersion)
    );
  }

  static async init(
    compassApp: typeof CompassApplication,
    options: Partial<AutoUpdateManagerOptions> = {}
  ): Promise<void> {
    if (!this.initCalled) {
      this.initCalled = true;
      await this._init(compassApp, options);
    }
  }

  static on = emitter.on.bind(emitter);
  static off = emitter.off.bind(emitter);
  static once = emitter.once.bind(emitter);
  static emit = emitter.emit.bind(emitter);
}

export { CompassAutoUpdateManager };
