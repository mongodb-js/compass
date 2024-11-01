// THESE IMPORTS SHOULD ALWAYS BE THE FIRST ONE FOR THE APPLICATION ENTRY POINT
import '../setup-hadron-distribution';
import './utils/csp';
import dns from 'dns';
import ensureError from 'ensure-error';
import { ipcRenderer } from 'hadron-ipc';
import * as remote from '@electron/remote';
import { webUtils } from 'electron';
import { globalAppRegistry } from 'hadron-app-registry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import semver from 'semver';
import { CompassElectron } from './components/entrypoint';
import { openToast } from '@mongodb-js/compass-components';

// https://github.com/nodejs/node/issues/40537
dns.setDefaultResultOrder('ipv4first');

// this is so sub-processes (ie. the shell) will do the same
process.env.NODE_OPTIONS ??= '';
if (!process.env.NODE_OPTIONS.includes('--dns-result-order')) {
  process.env.NODE_OPTIONS += ` --dns-result-order=ipv4first`;
}

// Setup error reporting to main process before anything else.
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

import './index.less';
import 'source-code-pro/source-code-pro.css';

import * as marky from 'marky';
import EventEmitter from 'events';
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

EventEmitter.defaultMaxListeners = 100;

document.addEventListener('dragover', (evt) => evt.preventDefault());
document.addEventListener('drop', (evt) => evt.preventDefault());

/**
 * The main entrypoint for the application!
 */
const APP_VERSION = remote.app.getVersion() || '';
const DEFAULT_APP_VERSION = '0.0.0';

import View from 'ampersand-view';
import * as webvitals from 'web-vitals';

import './menu-renderer';

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
import { createElectronFileInputBackend } from '@mongodb-js/compass-components';
import { CompassRendererConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import type { SettingsTabId } from '@mongodb-js/compass-settings';
import type { AutoConnectPreferences } from '../main/auto-connect';
const { log, mongoLogId } = createLogger('COMPASS-APP');
const track = createIpcTrack();

// Lets us call `setShowDevFeatureFlags(true | false)` from DevTools.
(window as any).setShowDevFeatureFlags = async (showDevFeatureFlags = true) => {
  await defaultPreferencesInstance.savePreferences({ showDevFeatureFlags });
};

function showCollectionSubMenu({ isReadOnly }: { isReadOnly: boolean }) {
  void ipcRenderer?.call('window:show-collection-submenu', {
    isReadOnly,
  });
}

function hideCollectionSubMenu() {
  void ipcRenderer?.call('window:hide-collection-submenu');
}

function notifyMainProcessOfDisconnect() {
  void ipcRenderer?.call('compass:disconnected');
}

function showSettingsModal(tab?: SettingsTabId) {
  globalAppRegistry?.emit('open-compass-settings', tab);
}

async function getWindowAutoConnectPreferences(): Promise<AutoConnectPreferences> {
  return await ipcRenderer?.call('compass:get-window-auto-connect-preferences');
}

async function checkSecretStorageIsAvailable(): Promise<boolean> {
  return await ipcRenderer?.call('compass:check-secret-storage-is-available');
}

/**
 * The top-level application singleton that brings everything together!
 */
const Application = View.extend({
  template: function () {
    return [
      '<div id="application">',
      '  <div data-hook="layout-container"></div>',
      '</div>',
    ].join('\n');
  },
  props: {
    version: {
      type: 'string',
      default: APP_VERSION,
    },
  },
  session: {
    /**
     * Details of the MongoDB Instance we're currently connected to.
     */
    instance: 'state',
    /**
     * @see http://learn.humanjavascript.com/react-ampersand/creating-a-router-and-pages
     */
    router: 'object',
    /**
     * The previously shown app version.
     */
    previousVersion: {
      type: 'string',
      default: DEFAULT_APP_VERSION,
    },
  },
  initialize: function () {
    /**
     * @see NODE-4281
     * @todo: remove when NODE-4281 is merged.
     */
    (Number.prototype as any).unref = () => {
      // noop
    };

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
  },
  /**
   * Enable all debug output for the development mode.
   */
  preRender: function () {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('debug').enable('mon*,had*');
    }
  },
  /**
   * Pre-load into the require cache a bunch of expensive modules while the
   * user is choosing which connection, so when the user clicks on Connect,
   * Compass can connect to the MongoDB instance faster.
   */
  postRender: function () {
    marky.mark('Pre-loading additional modules required to connect');
    // Seems like this doesn't have as much of an effect as we'd hoped as
    // most of the expense has already occurred. You can see it take 1700ms
    // or so if you move this to the top of the file.
    require('local-links');
    require('mongodb-instance-model');
    marky.stop('Pre-loading additional modules required to connect');
  },
  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  render: async function () {
    await defaultPreferencesInstance.refreshPreferences();
    const initialAutoConnectPreferences =
      await getWindowAutoConnectPreferences();
    const isSecretStorageAvailable = await checkSecretStorageIsAvailable();
    const connectionStorage = new CompassRendererConnectionStorage(ipcRenderer);

    log.info(
      mongoLogId(1_001_000_092),
      'Main Window',
      'Rendering app container',
      {
        autoConnectEnabled: initialAutoConnectPreferences.shouldAutoConnect,
      }
    );

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);

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
          onDisconnect={notifyMainProcessOfDisconnect}
          showCollectionSubMenu={showCollectionSubMenu}
          hideCollectionSubMenu={hideCollectionSubMenu}
          showSettings={showSettingsModal}
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
      this.queryByHook('layout-container')
    );

    if (!isSecretStorageAvailable) {
      openToast('secret-storage-not-available', {
        variant: 'warning',
        title:
          'Compass cannot access credential storage. You can still connect, but please note that passwords will not be saved.',
      });
      track('Secret Storage Not Available', {
        //
      });
    }

    document.querySelector('#loading-placeholder')?.remove();
  },
  updateAppVersion: async function () {
    const { lastKnownVersion, highestInstalledVersion } =
      defaultPreferencesInstance.getPreferences();
    this.previousVersion = lastKnownVersion || DEFAULT_APP_VERSION;
    this.highestInstalledVersion =
      semver.sort([
        highestInstalledVersion || DEFAULT_APP_VERSION,
        APP_VERSION,
      ])?.[1] ?? APP_VERSION;
    await defaultPreferencesInstance.savePreferences({
      lastKnownVersion: APP_VERSION,
      highestInstalledVersion: this.highestInstalledVersion,
    });
  },
});

const state = new Application();

const app = {
  init: async function () {
    await defaultPreferencesInstance.refreshPreferences();
    await state.updateAppVersion();
    state.preRender();

    try {
      void setupIntercom(defaultPreferencesInstance);
    } catch (e) {
      log.warn(
        mongoLogId(1_001_000_289),
        'Main Window',
        'Failed to set up Intercom',
        {
          error: (e as Error).message,
        }
      );
      // noop
    }
    // Catch a data refresh coming from window-manager.
    ipcRenderer?.on('app:refresh-data', () =>
      globalAppRegistry.emit('refresh-data')
    );
    ipcRenderer?.on('window:menu-share-schema-json', () => {
      globalAppRegistry.emit('menu-share-schema-json');
    });
    ipcRenderer?.on('compass:open-export', () => {
      globalAppRegistry.emit('open-active-namespace-export');
    });
    ipcRenderer?.on('compass:open-import', () => {
      globalAppRegistry.emit('open-active-namespace-import');
    });
    // Autoupdate handlers
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
    ipcRenderer?.on('autoupdate:update-download-failed', onAutoupdateFailed);
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
    // As soon as dom is ready, render and set up the rest.
    state.render();
    marky.stop('Time to Connect rendered');
    state.postRender();
    marky.stop('Time to user can Click Connect');
    if (process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION) {
      queueMicrotask(() => {
        throw new Error('fake exception');
      });
    }

    if (
      semver.gt(APP_VERSION, state.previousVersion) &&
      state.previousVersion !== DEFAULT_APP_VERSION
    ) {
      // Wait a bit before showing the update toast.
      setTimeout(() => {
        onAutoupdateInstalled({
          newVersion: APP_VERSION,
        });
      }, 2000);
    }
  },
};

Object.defineProperty(app, 'autoUpdate', {
  get: function () {
    return state.autoUpdate;
  },
});

Object.defineProperty(app, 'instance', {
  get: function () {
    return state.instance;
  },
  set: function (instance) {
    state.instance = instance;
  },
});

Object.defineProperty(app, 'router', {
  get: function () {
    return state.router;
  },
});

Object.defineProperty(app, 'state', {
  get: function () {
    return state;
  },
});

void app.init();
