import './disable-node-deprecations'; // Separate module so it runs first
import path from 'path';
import { EventEmitter } from 'events';
import type { BrowserWindow, Event } from 'electron';
import { app, safeStorage, session } from 'electron';
import { ipcMain } from 'hadron-ipc';
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
import { setupPreferencesAndUser } from 'compass-preferences-model';
import { CompassAuthService } from '@mongodb-js/atlas-service/main';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { setupTheme } from './theme';
import { setupProtocolHandlers } from './protocol-handling';
import { ConnectionStorage } from '@mongodb-js/connection-storage/main';

const { debug, log, track, mongoLogId } =
  createLoggerAndTelemetry('COMPASS-MAIN');

type ExitHandler = () => Promise<unknown>;
type CompassApplicationMode = 'CLI' | 'GUI';

const getContext = () => {
  return process.stdin.isTTY || process.stdout.isTTY || process.stderr.isTTY
    ? 'terminal'
    : 'desktop_app';
};

const getLaunchConnectionSource = (
  file?: string,
  positionalArguments?: string[]
) => {
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

class CompassApplication {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static emitter: EventEmitter = new EventEmitter();
  private static exitHandlers: ExitHandler[] = [];
  private static initPromise: Promise<void> | null = null;
  private static mode: CompassApplicationMode | null = null;
  public static preferences: PreferencesAccess;

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

    const { preferences } = await setupPreferencesAndUser(globalPreferences);
    this.preferences = preferences;
    await this.setupLogging();
    // need to happen after setupPreferencesAndUser
    await this.setupTelemetry();
    await setupProtocolHandlers(
      process.argv.includes('--squirrel-uninstall') ? 'uninstall' : 'install',
      this.preferences
    );

    // needs to happen after setupProtocolHandlers
    if ((await import('electron-squirrel-startup')).default) {
      debug('electron-squirrel-startup event handled sucessfully\n');
      return;
    }

    // ConnectionStorage offers import/export which is used via CLI as well.
    ConnectionStorage.init();

    try {
      await ConnectionStorage.migrateToSafeStorage();
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_275),
        'SafeStorage Migration',
        'Failed to migrate connections',
        { message: (e as Error).message }
      );
    }

    if (process.env.MONGODB_COMPASS_TEST_USE_PLAIN_SAFE_STORAGE === 'true') {
      // When testing we want to use plain text encryption to avoid having to
      // deal with keychain popups or setting up keychain for test on CI (Linux env).
      // This method is only available on Linux and is no-op on other platforms.
      safeStorage.setUsePlainTextEncryption(true);
    }

    if (mode === 'CLI') {
      return;
    }

    this.setupCORSBypass();
    void this.setupCompassAuthService();
    this.setupAutoUpdate();
    await setupCSFLELibrary();
    setupTheme(this);
    this.setupJavaScriptArguments();
    this.setupLifecycleListeners();
    this.setupApplicationMenu();
    this.setupWindowManager();
    this.trackApplicationLaunched(globalPreferences);
  }

  static init(
    mode: CompassApplicationMode,
    globalPreferences: ParsedGlobalPreferencesResult
  ): Promise<void> {
    return (this.initPromise ??= this._init(mode, globalPreferences));
  }

  private static async setupCompassAuthService() {
    await CompassAuthService.init(this.preferences);
    this.addExitHandler(() => {
      return CompassAuthService.onExit();
    });
  }

  private static setupJavaScriptArguments(): void {
    // For Linux users with drivers that are avoided by Chromium we disable the
    // GPU check to attempt to bypass the disabled WebGL settings.
    app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
  }

  private static setupAutoUpdate(): void {
    CompassAutoUpdateManager.init(this);
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
          (await ConnectionStorage.getLegacyConnections()).length > 0;
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
  // @ts-expect-error typescript is not happy with this overload even though it
  //                  worked when it wasn't static and the implementation does
  //                  match the overload declaration
  static on(
    event: 'new-window',
    handler: (bw: BrowserWindow) => void
  ): typeof CompassApplication;
  static on(
    event: 'check-for-updates',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: string,
    handler: (...args: unknown[]) => void
  ): typeof CompassApplication {
    this.emitter.on(event, handler);
    return this;
  }

  static emit(event: 'show-connect-window'): boolean;
  static emit(event: 'show-log-file-dialog'): boolean;
  static emit(event: 'new-window', bw: BrowserWindow): boolean;
  static emit(event: 'check-for-updates'): boolean;
  static emit(event: string, ...args: unknown[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  static removeAllListeners(): typeof CompassApplication {
    this.emitter.removeAllListeners();
    return this;
  }

  private static setupCORSBypass() {
    const CLOUD_URLS_FILTER = {
      urls: [
        '*://cloud.mongodb.com/*',
        '*://cloud-dev.mongodb.com/*',
        '*://compass.mongodb.com/*',
      ],
    };

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

    session.defaultSession.webRequest.onBeforeSendHeaders(
      CLOUD_URLS_FILTER,
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
      CLOUD_URLS_FILTER,
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
