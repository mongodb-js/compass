import { ipcRenderer, type HadronIpcRenderer } from 'hadron-ipc';
import * as remote from '@electron/remote';
import { webUtils, webFrame, type MenuItemConstructorOptions } from 'electron';
import { globalAppRegistry } from '@mongodb-js/compass-app-registry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import semver from 'semver';
import { CompassElectron } from './components/entrypoint';
import {
  openToast,
  closeToast,
  ToastBody,
} from '@mongodb-js/compass-components';
import ensureError from 'ensure-error';

import * as webvitals from 'web-vitals';
import React from 'react';
import ReactDOM from 'react-dom';

import { setupIntercom } from '@mongodb-js/compass-intercom';
import { createLogger } from '@mongodb-js/compass-logging';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';

import {
  onAutoupdateExternally,
  onAutoupdateFailed,
  onAutoupdateInstalled,
  onAutoupdateStarted,
  onAutoupdateSuccess,
} from './components/update-toasts';
import { UUID } from 'bson';

import { createElectronFileInputBackend } from '@mongodb-js/compass-components';
import { CompassRendererConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import type { SettingsTabId } from '@mongodb-js/compass-settings';
import type { AutoConnectPreferences } from '../main/auto-connect';

const { log, mongoLogId, debug } = createLogger('COMPASS-APP');
const track = createIpcTrack();

import './index.less';
import 'source-code-pro/source-code-pro.css';
import {
  transformAppMenu,
  type ApplicationMenuProvider,
  type CompassAppMenu,
} from '@mongodb-js/compass-workspaces/application-menu';

const DEFAULT_APP_VERSION = '0.0.0';

function translateCallsToHandlerIds(
  menu: CompassAppMenu
): [CompassAppMenu<string>, Map<string, () => void>] {
  const handlerIds = new Map<string, () => void>();
  const transformedMenu = transformAppMenu(menu, (item) => {
    if (!item.click) return { ...item, click: undefined };
    const id = new UUID().toString();
    handlerIds.set(id, item.click);
    return { ...item, click: id };
  });
  return [transformedMenu, handlerIds];
}

class ApplicationMenu implements ApplicationMenuProvider {
  handlers = new Map<string, () => void>();
  ipcRenderer: HadronIpcRenderer | undefined;

  constructor(ipcRenderer: HadronIpcRenderer | undefined) {
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer?.on(
      'application-menu:invoke-handler',
      (event, { id }: { id: string }) => {
        const handler = this.handlers.get(id);
        if (!handler) debug('No handler found for menu item id', id);
        handler?.();
      }
    );
  }

  showApplicationMenu = (menu: CompassAppMenu): (() => void) => {
    const id = new UUID().toString();
    const [translatedMenu, handlers] = translateCallsToHandlerIds(menu);
    for (const [handlerId, handler] of handlers.entries()) {
      this.handlers.set(handlerId, handler);
    }
    void this.ipcRenderer?.call('application-menu:modify-application-menu', {
      id,
      menu: translatedMenu,
    });
    return () => {
      void this.ipcRenderer?.call('application-menu:modify-application-menu', {
        id,
        menu: undefined,
      });
      for (const handlerId of handlers.keys()) {
        this.handlers.delete(handlerId);
      }
    };
  };

  handleMenuRole = (
    role: MenuItemConstructorOptions['role'],
    handler: () => void
  ): (() => void) => {
    const id = new UUID().toString();
    this.handlers.set(id, handler);
    void this.ipcRenderer?.call('application-menu:modify-application-menu', {
      id,
      role,
    });
    return () => {
      void this.ipcRenderer?.call('application-menu:modify-application-menu', {
        id,
      });
      this.handlers.delete(id);
    };
  };
}

class Application {
  private static instance: Application | null = null;

  private menuProvider: ApplicationMenuProvider;
  version: string;
  previousVersion: string;
  highestInstalledVersion: string;

  private constructor() {
    this.version = remote.app.getVersion() || '';
    this.previousVersion = DEFAULT_APP_VERSION;
    this.highestInstalledVersion = this.version;
    this.menuProvider = new ApplicationMenu(ipcRenderer);
  }

  public static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  /**
   * @see NODE-4281
   * @todo: remove when NODE-4281 is merged.
   */
  private patchNODE4281() {
    (Number.prototype as any).unref = () => {
      // noop
    };
  }

  private setupGlobalErrorHandling() {
    // Global Error Handling
    // Sets up error reporting to main process before any other initialization
    // Ensures all unhandled errors are properly logged and reported
    window.addEventListener('error', (event: ErrorEvent) => {
      event.preventDefault();
      const error = ensureError(event.error);
      void ipcRenderer?.call('compass:error:fatal', {
        message: error.message,
        stack: error.stack,
      });
    });

    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        event.preventDefault();
        const error = ensureError(event.reason);
        void ipcRenderer?.call('compass:rejection:fatal', {
          message: error.message,
          stack: error.stack,
        });
      }
    );
  }

  private setupWebVitals() {
    function trackPerfEvent({
      name,
      value,
    }: Pick<webvitals.Metric, 'name' | 'value'>) {
      const events = {
        FCP: 'First Contentful Paint',
        LCP: 'Largest Contentful Paint',
        FID: 'First Input Delay',
        CLS: 'Cumulative Layout Shift',
        TTFB: 'Time to First Byte',
      } as const;

      track(events[name], { value });
    }

    webvitals.getFCP(trackPerfEvent);
    webvitals.getLCP(trackPerfEvent);
    webvitals.getFID(trackPerfEvent);
    webvitals.getCLS(trackPerfEvent);
  }

  /**
   * Enable all debug output for the development mode.
   */
  private enableDevelopmentDebug() {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('debug').enable('mon*,had*');
    }
  }

  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  private async render() {
    await defaultPreferencesInstance.refreshPreferences();
    const initialAutoConnectPreferences =
      await this.getWindowAutoConnectPreferences();
    const isSecretStorageAvailable = await this.checkSecretStorageIsAvailable();
    const connectionStorage = new CompassRendererConnectionStorage(ipcRenderer);

    log.info(
      mongoLogId(1_001_000_092),
      'Main Window',
      'Rendering app container',
      {
        autoConnectEnabled: initialAutoConnectPreferences.shouldAutoConnect,
      }
    );

    const elem = document.querySelector('#application');
    if (!elem) {
      throw new Error('Application container not found');
    }

    // Create the application container structure
    elem.innerHTML = `
      <div id="application">
        <div data-hook="layout-container"></div>
      </div>
    `;

    const wasNetworkOptInShown =
      defaultPreferencesInstance.getPreferences().showedNetworkOptIn === true;

    // If we haven't showed welcome modal that points users to network opt in
    // yet, update preferences with default values to reflect that ...
    if (!wasNetworkOptInShown) {
      await defaultPreferencesInstance.ensureDefaultConfigurableUserPreferences();
    }

    ReactDOM.render(
      <React.StrictMode>
        <CompassElectron
          appName={remote.app.getName()}
          showWelcomeModal={!wasNetworkOptInShown}
          createFileInputBackend={createElectronFileInputBackend(
            remote,
            webUtils
          )}
          applicationMenuProvider={this.menuProvider}
          showSettings={this.showSettingsModal.bind(this)}
          connectionStorage={connectionStorage}
          onAutoconnectInfoRequest={
            initialAutoConnectPreferences.shouldAutoConnect
              ? () => {
                  return connectionStorage.getAutoConnectInfo(
                    initialAutoConnectPreferences
                  );
                }
              : undefined
          }
        />
      </React.StrictMode>,
      elem.querySelector('[data-hook="layout-container"]')
    );

    if (!isSecretStorageAvailable) {
      openToast('secret-storage-not-available', {
        variant: 'warning',
        title:
          'Compass cannot access credential storage. You can still connect, but please note that passwords will not be saved.',
      });
      track('Secret Storage Not Available', {});
    }

    document.querySelector('#loading-placeholder')?.remove();
  }

  private setupDataRefreshListener() {
    ipcRenderer?.on('app:refresh-data', () =>
      globalAppRegistry.emit('refresh-data')
    );
  }

  private setupDownloadStatusListeners() {
    const fileDownloadCompleteToastId = 'file-download-complete';
    ipcRenderer?.on('download-finished', (event, { path }) => {
      openToast(fileDownloadCompleteToastId, {
        title: 'Success',
        description: (
          <ToastBody
            statusMessage="File download complete"
            actionHandler={() => {
              ipcRenderer?.send('show-file', path);
              closeToast(fileDownloadCompleteToastId);
            }}
            actionText="show file"
          />
        ),
        variant: 'success',
      });
    });

    ipcRenderer?.on('download-failed', (event, { filename }) => {
      openToast('file-download-failed', {
        title: 'Failure',
        description: filename
          ? `Failed to download ${filename}`
          : 'Download failed',
        variant: 'warning',
      });
    });
  }

  private setupIpcListeners() {
    this.setupDataRefreshListener();
    this.setupDownloadStatusListeners();
  }

  private setupAutoUpdateListeners() {
    ipcRenderer?.on(
      'autoupdate:download-update-externally',
      (
        _,
        {
          newVersion,
          currentVersion,
        }: { newVersion: string; currentVersion: string }
      ) => {
        onAutoupdateExternally({
          newVersion,
          currentVersion,
          onDismiss: () => {
            void ipcRenderer?.call('autoupdate:download-update-dismissed');
          },
        });
      }
    );
    ipcRenderer?.on(
      'autoupdate:update-download-in-progress',
      (_, { newVersion }: { newVersion: string }) => {
        onAutoupdateStarted({ newVersion });
      }
    );
    ipcRenderer?.on(
      'autoupdate:update-download-failed',
      (_, reason?: 'outdated-operating-system') => {
        onAutoupdateFailed(reason);
      }
    );
    ipcRenderer?.on(
      'autoupdate:update-download-success',
      (_, { newVersion }: { newVersion: string }) => {
        onAutoupdateSuccess({
          newVersion,
          onUpdate: () => {
            void ipcRenderer?.call(
              'autoupdate:update-download-restart-confirmed'
            );
          },
          onDismiss: () => {
            void ipcRenderer?.call(
              'autoupdate:update-download-restart-dismissed'
            );
          },
        });
      }
    );
  }

  private setupConnectInNewWindowListeners() {
    globalAppRegistry.on('connect-in-new-window', (connectionId: string) => {
      void ipcRenderer?.call('app:connect-in-new-window', connectionId);
    });
  }

  private showUpdateToastIfNeeded() {
    if (
      this.previousVersion !== DEFAULT_APP_VERSION &&
      this.version !== this.previousVersion
    ) {
      // Wait a bit before showing the update toast.
      setTimeout(() => {
        onAutoupdateInstalled({
          newVersion: this.version,
        });
      }, 2000);
    }
  }

  private async setupIntercomAndLogError() {
    try {
      await setupIntercom(defaultPreferencesInstance);
    } catch (e) {
      log.warn(
        mongoLogId(1001000289),
        'Main Window',
        'Failed to set up Intercom',
        {
          error: (e as Error).message,
        }
      );
    }
  }

  private logVersionInfo() {
    log.info(mongoLogId(1_001_000_338), 'Main Window', 'Recent version info', {
      previousVersion: this.previousVersion,
      highestInstalledVersion: this.highestInstalledVersion,
      version: this.version,
    });
  }

  private setupZoomControls() {
    const ZOOM_DEFAULT = 0;
    const ZOOM_INCREMENT = 0.5;
    const ZOOM_MAX = 5;
    const ZOOM_MIN = -3;
    const SAVE_DEBOUNCE_DELAY = 500; // 500ms delay for save operations

    // Debounced save zoom level to preferences
    let saveTimeoutId: NodeJS.Timeout | null = null;
    const debouncedSaveZoomLevel = (zoomLevel: number) => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }

      saveTimeoutId = setTimeout(() => {
        void defaultPreferencesInstance.savePreferences({ zoomLevel });
        saveTimeoutId = null;
      }, SAVE_DEBOUNCE_DELAY);
    };

    const restoreZoomLevel = () => {
      try {
        const preferences = defaultPreferencesInstance.getPreferences();
        const savedZoomLevel = preferences.zoomLevel ?? ZOOM_DEFAULT;

        // Clamp zoom level to allowed range
        const zoomLevel = Math.min(
          Math.max(savedZoomLevel, ZOOM_MIN),
          ZOOM_MAX
        );

        webFrame.setZoomLevel(zoomLevel);
      } catch {
        // noop
      }
    };

    const zoomReset = () => {
      webFrame.setZoomLevel(ZOOM_DEFAULT);
      debouncedSaveZoomLevel(ZOOM_DEFAULT);
    };

    const zoomIn = () => {
      const currentZoomLevel = webFrame.getZoomLevel();
      const newZoomLevel = Math.min(
        currentZoomLevel + ZOOM_INCREMENT,
        ZOOM_MAX
      );
      webFrame.setZoomLevel(newZoomLevel);
      debouncedSaveZoomLevel(newZoomLevel);
    };

    const zoomOut = () => {
      const currentZoomLevel = webFrame.getZoomLevel();
      const newZoomLevel = Math.max(
        currentZoomLevel - ZOOM_INCREMENT,
        ZOOM_MIN
      );
      webFrame.setZoomLevel(newZoomLevel);
      debouncedSaveZoomLevel(newZoomLevel);
    };

    // Restore zoom level on startup
    restoreZoomLevel();

    ipcRenderer?.on('window:zoom-reset', zoomReset);
    ipcRenderer?.on('window:zoom-in', zoomIn);
    ipcRenderer?.on('window:zoom-out', zoomOut);
  }

  private testUncaughtException() {
    if (process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION) {
      queueMicrotask(() => {
        throw new Error('fake exception');
      });
    }
  }

  private allowDevFeatureFlagsFromDevTools() {
    // Lets us call `setShowDevFeatureFlags(true | false)` from DevTools.
    (window as any).setShowDevFeatureFlags = async (
      showDevFeatureFlags = true
    ) => {
      await defaultPreferencesInstance.savePreferences({ showDevFeatureFlags });
    };
  }

  private preventDefaultBrowserBehaviorForDragAndDrop() {
    // Drag and Drop Prevention
    // Prevents default browser behavior for drag and drop events
    // to avoid potential security issues
    document.addEventListener('dragover', (evt) => evt.preventDefault());
    document.addEventListener('drop', (evt) => evt.preventDefault());
  }

  private showSettingsModal(tab?: SettingsTabId) {
    globalAppRegistry?.emit('open-compass-settings', tab);
  }

  private async getWindowAutoConnectPreferences(): Promise<AutoConnectPreferences> {
    return await ipcRenderer?.call(
      'compass:get-window-auto-connect-preferences'
    );
  }

  private async checkSecretStorageIsAvailable(): Promise<boolean> {
    return await ipcRenderer?.call('compass:check-secret-storage-is-available');
  }

  async init() {
    // Setup global error handling first to ensure all
    // unhandled errors are properly logged and reported
    this.setupGlobalErrorHandling();

    // Setup development environment
    this.enableDevelopmentDebug();
    this.allowDevFeatureFlagsFromDevTools();

    this.patchNODE4281();
    this.setupWebVitals();

    // Initialize preferences and version
    await this.initializePreferencesAndVersion();

    void this.setupIntercomAndLogError();

    // Setup all event listeners
    this.setupIpcListeners();
    this.setupAutoUpdateListeners();
    this.setupConnectInNewWindowListeners();
    this.setupZoomControls();
    this.preventDefaultBrowserBehaviorForDragAndDrop();

    // Render the application
    await this.render();

    // Throws a synthetic exception for e2e tests so we can test the handling
    // of uncaught exceptions.
    this.testUncaughtException();

    // Log version info and show update toast if needed
    this.logVersionInfo();
    this.showUpdateToastIfNeeded();
  }

  private async initializePreferencesAndVersion() {
    await defaultPreferencesInstance.refreshPreferences();

    // This code updates the last known version and highest installed version in preferences after
    // the first installation, or a potential update or downgrade.
    // This is useful so that we can track the version history of the application, and
    // handle auto-updates differently in case of downgrades.
    const { lastKnownVersion, highestInstalledVersion } =
      defaultPreferencesInstance.getPreferences();
    this.previousVersion = lastKnownVersion || DEFAULT_APP_VERSION;
    this.highestInstalledVersion =
      semver.sort([
        highestInstalledVersion || DEFAULT_APP_VERSION,
        this.version,
      ])?.[1] ?? this.version;
    await defaultPreferencesInstance.savePreferences({
      lastKnownVersion: this.version,
      highestInstalledVersion: this.highestInstalledVersion,
    });
  }
}

export const app = Application.getInstance();
