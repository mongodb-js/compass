import './disable-node-deprecations'; // Separate module so it runs first
import path from 'path';
import { EventEmitter } from 'events';
import type { BrowserWindow, Event, ProxyConfig } from 'electron';
import { app, safeStorage, session } from 'electron';
import { ipcMain } from 'hadron-ipc';
import type { AutoUpdateManagerState } from './auto-update-manager';
import { CompassAutoUpdateManager } from './auto-update-manager';
import { CompassLogging } from './logging';
import { CompassTelemetry } from './telemetry';
import { CompassWindowManager } from './window-manager';
import { CompassMenu } from './menu';
import { setupCSFLELibrary } from './setup-csfle-library';
import type {
  ParsedGlobalPreferencesResult,
  PreferencesAccess,
} from 'compass-preferences-model';
import {
  proxyPreferenceToProxyOptions,
  setupPreferencesAndUser,
} from 'compass-preferences-model';
import { CompassAuthService } from '@mongodb-js/atlas-service/main';
import { createLogger } from '@mongodb-js/compass-logging';
import { setupTheme } from './theme';
import { setupProtocolHandlers } from './protocol-handling';
import {
  initCompassMainConnectionStorage,
  getCompassMainConnectionStorage,
} from '@mongodb-js/connection-storage/main';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';
import type {
  AgentWithInitialize,
  RequestInit,
  Response,
} from '@mongodb-js/devtools-proxy-support';
import {
  createAgent,
  createFetch,
  extractProxySecrets,
  translateToElectronProxyConfig,
} from '@mongodb-js/devtools-proxy-support';
import { handleSquirrelWindowsStartup } from './squirrel-startup';

const { debug, log, mongoLogId } = createLogger('COMPASS-MAIN');
const track = createIpcTrack();

type ExitHandler = () => Promise<unknown>;
type CompassApplicationMode = 'CLI' | 'GUI';

const getContext = (): 'terminal' | 'desktop_app' => {
  return process.stdin.isTTY || process.stdout.isTTY || process.stderr.isTTY
    ? 'terminal'
    : 'desktop_app';
};

const getLaunchConnectionSource = (
  file?: string,
  positionalArguments?: string[]
): 'JSON_file' | 'string' | 'none' => {
  if (file) return 'JSON_file';
  if (positionalArguments?.length) return 'string';
  return 'none';
};

const hasConfig = (
  source: 'global' | 'cli',
  globalPreferences: ParsedGlobalPreferencesResult
) => {
  return !!Object.keys(globalPreferences[source]).length;
};

// The properties of this object are changed when proxy options change
interface CompassProxyClient {
  agent: AgentWithInitialize | undefined;
  fetch: (url: string, fetchOptions?: RequestInit) => Promise<Response>;
}

class CompassApplication {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static emitter: EventEmitter = new EventEmitter();
  private static exitHandlers: ExitHandler[] = [];
  private static initPromise: Promise<void> | null = null;
  private static mode: CompassApplicationMode | null = null;
  public static preferences: PreferencesAccess;
  public static httpClient: CompassProxyClient;

  private static async _init(
    mode: CompassApplicationMode,
    globalPreferences: ParsedGlobalPreferencesResult
  ) {
    if (this.mode !== null && this.mode !== mode) {
      throw new Error(
        `Cannot re-initialize Compass in different mode (${mode} vs previous ${this.mode})`
      );
    }
    this.mode = mode;

    const enablePlainTextEncryption =
      process.env.MONGODB_COMPASS_TEST_USE_PLAIN_SAFE_STORAGE === 'true';
    if (enablePlainTextEncryption) {
      // When testing we want to use plain text encryption to avoid having to
      // deal with keychain popups or setting up keychain for test on CI (Linux env).
      // This method is only available on Linux and is no-op on other platforms.
      safeStorage.setUsePlainTextEncryption(true);
    }

    const { preferences } = await setupPreferencesAndUser(
      globalPreferences,
      safeStorage
    );
    this.preferences = preferences;
    await this.setupLogging();
    await this.setupProxySupport(app, 'Application');
    // need to happen after setupPreferencesAndUser and setupProxySupport
    await this.setupTelemetry();
    await setupProtocolHandlers(
      process.argv.includes('--squirrel-uninstall') ? 'uninstall' : 'install',
      this.preferences
    );

    // needs to happen after setupProtocolHandlers
    if (await handleSquirrelWindowsStartup()) {
      app.quit();
      return;
    }

    // Accessing isEncryptionAvailable is not allowed when app is not ready on Windows
    // https://github.com/electron/electron/issues/33640
    await app.whenReady();

    const { networkTraffic } = this.preferences.getPreferences();

    if (!networkTraffic) {
      // Electron fetches spellcheck dictionaries from a CDN
      // on all OSs expect mac (it provides a built-in spell check).
      // Passing a non-resolving URL prevents it from fetching
      // as there aren't any options to disable it provided.
      // https://github.com/electron/electron/issues/22995
      session.defaultSession.setSpellCheckerDictionaryDownloadURL(
        'http://127.0.0.1:0/'
      );
    }

    log.info(
      mongoLogId(1_001_000_307),
      'Application',
      'SafeStorage initialized',
      {
        enablePlainTextEncryption,
        isAvailable: safeStorage.isEncryptionAvailable(),
        backend: safeStorage.getSelectedStorageBackend?.(),
      }
    );

    // ConnectionStorage offers import/export which is used via CLI as well.
    const connectionStorage = initCompassMainConnectionStorage();

    try {
      await connectionStorage.migrateToSafeStorage();
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_275),
        'SafeStorage Migration',
        'Failed to migrate connections',
        { message: (e as Error).message }
      );
    }

    if (mode === 'CLI') {
      return;
    }

    await this.setupCORSBypass();
    void this.setupCompassAuthService();
    await setupCSFLELibrary();
    setupTheme(this);
    this.setupJavaScriptArguments();
    this.setupLifecycleListeners();
    this.setupApplicationMenu();
    this.setupWindowManager();
    this.setupAutoUpdate();
    this.trackApplicationLaunched(globalPreferences);
  }

  static init(
    mode: CompassApplicationMode,
    globalPreferences: ParsedGlobalPreferencesResult
  ): Promise<void> {
    return (this.initPromise ??= this._init(mode, globalPreferences));
  }

  private static async setupCompassAuthService() {
    await CompassAuthService.init(this.preferences, this.httpClient);
    this.addExitHandler(() => {
      return CompassAuthService.onExit();
    });
  }

  private static setupJavaScriptArguments(): void {
    // For Linux users with drivers that are avoided by Chromium we disable the
    // GPU check to attempt to bypass the disabled WebGL settings.
    app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');

    if (process.platform === 'linux') {
      // Force GTK 3 on Linux (Workaround for https://github.com/electron/electron/issues/46538)
      app.commandLine.appendSwitch('gtk-version', '3');
    }
  }

  private static setupAutoUpdate(): void {
    if (!process.env.CI || process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE) {
      void CompassAutoUpdateManager.init(this);
    }
  }

  private static setupApplicationMenu(): void {
    CompassMenu.init(this);
  }

  private static setupWindowManager(): void {
    void CompassWindowManager.init(this);
  }

  private static trackApplicationLaunched(
    globalPreferences: ParsedGlobalPreferencesResult
  ): void {
    const {
      protectConnectionStrings,
      readOnly,
      file,
      positionalArguments,
      maxTimeMS,
    } = this.preferences.getPreferences();

    debug('application launched');
    track('Application Launched', async () => {
      let hasLegacyConnections: boolean;
      try {
        hasLegacyConnections =
          (await getCompassMainConnectionStorage().getLegacyConnections())
            .length > 0;
      } catch (e) {
        debug('Failed to check legacy connections', e);
        hasLegacyConnections = false;
      }
      return {
        context: getContext(),
        launch_connection: getLaunchConnectionSource(file, positionalArguments),
        protected: protectConnectionStrings,
        readOnly,
        maxTimeMS,
        global_config: hasConfig('global', globalPreferences),
        cli_args: hasConfig('cli', globalPreferences),
        legacy_connections: hasLegacyConnections,
      };
    });
  }

  private static setupLifecycleListeners(): void {
    app.on('window-all-closed', function () {
      debug('All windows closed. Waiting for a new connection window.');
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    app.on('will-quit', async (event: Event) => {
      event.preventDefault(); // Only exit asynchronously, after the cleanup handlers
      await this.runExitHandlers();
      app.exit();
    });

    ipcMain?.respondTo({
      'license:disagree': function () {
        debug('Did not agree to license, quitting app.');
        app.quit();
      },
      'compass:check-secret-storage-is-available': async function () {
        // Accessing isEncryptionAvailable is not allowed when app is not ready on Windows
        // https://github.com/electron/electron/issues/33640
        await app.whenReady();
        return safeStorage.isEncryptionAvailable();
      },
    });

    ipcMain?.handle('coverage', () => {
      return (global as any).__coverage__;
    });

    ipcMain?.handle('compass:appName', () => {
      return app.getName();
    });

    ipcMain?.handle('compass:mainProcessPid', () => {
      return process.pid;
    });
  }

  private static async setupLogging(): Promise<void> {
    const home = app.getPath('home');
    const appData = process.env.LOCALAPPDATA || process.env.APPDATA;
    const logDir =
      process.env.MONGODB_COMPASS_TEST_LOG_DIR ??
      (process.platform === 'win32'
        ? path.join(appData || home, 'mongodb', 'compass')
        : path.join(home, '.mongodb', 'compass'));

    app.setAppLogsPath(logDir);

    await CompassLogging.init(this);
  }

  public static async setupProxySupport(
    target: { setProxy(config: ProxyConfig): Promise<void> | void },
    logContext: string
  ): Promise<() => void> {
    const onChange = async (value: string) => {
      try {
        const proxyOptions = proxyPreferenceToProxyOptions(value);
        await app.whenReady();

        try {
          const electronProxyConfig =
            translateToElectronProxyConfig(proxyOptions);
          await target.setProxy(electronProxyConfig);
        } catch (err) {
          const headline = String(
            err && typeof err === 'object' && 'message' in err
              ? err.message
              : err ||
                  'Currently Compass does not support authenticated or ssh proxies.'
          );

          log.warn(
            mongoLogId(1_001_000_332),
            logContext,
            'Unable to set proxy configuration',
            {
              error: headline,
            }
          );
          await target.setProxy({});
        }

        const agent = createAgent(proxyOptions);
        const fetch = createFetch(agent || {});
        this.httpClient?.agent?.destroy();
        this.httpClient = Object.assign(this.httpClient ?? {}, {
          agent,
          fetch,
        });

        log.info(mongoLogId(1_001_000_327), logContext, 'Configured proxy', {
          options: extractProxySecrets(proxyOptions).proxyOptions,
        });
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_326),
          logContext,
          'Unable to set proxy configuration',
          {
            error: String(
              err && typeof err === 'object' && 'message' in err
                ? err.message
                : err
            ),
          }
        );
      }
    };
    const unsubscribe = this.preferences.onPreferenceValueChanged(
      'proxy',
      (value) => void onChange(value)
    );
    await onChange(this.preferences.getPreferences().proxy);
    return unsubscribe;
  }

  private static async setupTelemetry(): Promise<void> {
    await CompassTelemetry.init(this);
  }

  static addExitHandler(handler: ExitHandler): void {
    this.exitHandlers.push(handler);
  }

  static async runExitHandlers(): Promise<void> {
    let handler: ExitHandler | undefined;
    // Run exit handlers in reverse order of addition.
    while ((handler = this.exitHandlers.pop()) !== undefined) {
      await handler();
    }
  }

  static on(
    event: 'show-connect-window',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: 'show-log-file-dialog',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: 'new-window',
    handler: (bw: BrowserWindow) => void
  ): typeof CompassApplication;
  static on(
    event: 'check-for-updates',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: 'auto-updater:new-state',
    handler: (state: AutoUpdateManagerState) => void
  ): typeof CompassApplication;
  static on(
    event: 'menu-request-restart',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: string,
    handler: (...args: any[]) => void
  ): typeof CompassApplication {
    this.emitter.on(event, handler);
    return this;
  }

  static emit(event: 'show-connect-window'): boolean;
  static emit(event: 'show-log-file-dialog'): boolean;
  static emit(event: 'new-window', bw: BrowserWindow): boolean;
  static emit(event: 'check-for-updates'): boolean;
  static emit(
    event: 'auto-updater:new-state',
    state: AutoUpdateManagerState
  ): boolean;
  static emit(event: 'menu-request-restart'): boolean;
  static emit(event: string, ...args: unknown[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  static removeAllListeners(): typeof CompassApplication {
    this.emitter.removeAllListeners();
    return this;
  }

  private static async setupCORSBypass() {
    const allowedCloudEndpoints = {
      urls: [
        '*://cloud.mongodb.com/*',
        '*://cloud-dev.mongodb.com/*',
        '*://cloud-qa.mongodb.com/*',
        '*://compass.mongodb.com/*',
      ],
    };

    if (
      process.env.APP_ENV === 'webdriverio' ||
      process.env.NODE_ENV === 'development'
    ) {
      // In e2e tests and in dev mode we need to allow application to send
      // requests to localhost in some cases: test GenAI with MMS running locally.
      allowedCloudEndpoints.urls.push('*://localhost/*');
    }

    // List of request headers that will indicate to the server that it's a CORS
    // request and can trigger a CORS check that we are trying to bypass
    const REQUEST_CORS_HEADERS = [
      // Fetch metadata headers https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header
      'sec-fetch-site',
      'sec-fetch-mode',
      'sec-fetch-user',
      'sec-fetch-dest',
      'sec-purpose',
      'service-worker-navigation-preload',
      // CORS headers https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
      'origin',
      'access-control-request-headers',
      'access-control-request-method',
    ];

    const RESPONSE_CORS_HEADERS = [
      'access-control-allow-credentials',
      'access-control-allow-headers',
      'access-control-allow-methods',
      'access-control-allow-origin',
      'access-control-expose-headers',
      'access-control-max-age',
    ];

    // Accessing defaultSession is not allowed when app is not ready
    await app.whenReady();

    session.defaultSession.on(
      'will-download',
      function (event, item, webContents) {
        item.once('done', (event, state) => {
          if (state === 'completed') {
            webContents.send('download-finished', {
              path: item.getSavePath(),
            });
          } else if (state === 'interrupted') {
            webContents.send('download-failed', {
              filename: item.getFilename(),
            });
          }
        });
      }
    );

    session.defaultSession.webRequest.onBeforeSendHeaders(
      allowedCloudEndpoints,
      (details, callback) => {
        const filteredHeaders = Object.fromEntries(
          Object.entries(details.requestHeaders).filter(([name]) => {
            return !REQUEST_CORS_HEADERS.includes(name.toLowerCase());
          })
        );
        callback({ requestHeaders: filteredHeaders });
      }
    );

    session.defaultSession.webRequest.onHeadersReceived(
      allowedCloudEndpoints,
      (details, callback) => {
        const filteredHeaders = Object.fromEntries(
          Object.entries(
            // Types are not matching documentation
            (details.responseHeaders as
              | Record<string, string | string[]>
              | undefined) ?? {}
          ).filter(([name]) => {
            return !RESPONSE_CORS_HEADERS.includes(name.toLowerCase());
          })
        );
        callback({
          responseHeaders: {
            ...filteredHeaders,
            'Access-Control-Allow-Origin': ['*'],
            'Access-Control-Allow-Headers': ['*'],
            'Access-Control-Allow-Methods': ['*'],
            'Access-Control-Allow-Credentials': ['true'],
          },
          statusLine: details.method === 'OPTIONS' ? '200' : details.statusLine,
        });
      }
    );
  }
}

export { CompassApplication };
