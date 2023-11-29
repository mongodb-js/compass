import './disable-node-deprecations'; // Separate module so it runs first
import path from 'path';
import { EventEmitter } from 'events';
import type { BrowserWindow, Event } from 'electron';
import { app } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { CompassAutoUpdateManager } from './auto-update-manager';
import { CompassLogging } from './logging';
import { CompassTelemetry } from './telemetry';
import { CompassWindowManager } from './window-manager';
import { CompassMenu } from './menu';
import { setupCSFLELibrary } from './setup-csfle-library';
import type { ParsedGlobalPreferencesResult } from 'compass-preferences-model';
import preferences, {
  setupPreferencesAndUser,
} from 'compass-preferences-model';
import { AtlasService } from '@mongodb-js/atlas-service/main';
import { defaultsDeep } from 'lodash';
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

    await setupPreferencesAndUser(globalPreferences);
    await this.setupLogging();
    // need to happen after setupPreferencesAndUser
    await this.setupTelemetry();
    await setupProtocolHandlers(
      process.argv.includes('--squirrel-uninstall') ? 'uninstall' : 'install'
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

    if (mode === 'CLI') {
      return;
    }

    void this.setupAtlasService();
    this.setupAutoUpdate();
    await setupCSFLELibrary();
    setupTheme();
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

  private static async setupAtlasService() {
    /**
     * Atlas service backend configurations.
     *  - compass-dev: locally running compass kanopy backend (localhost)
     *  - compass:    compass kanopy backend (compass.mongodb.com)
     *  - atlas-local: local mms backend (localhost)
     *  - atlas-dev:  dev mms backend (cloud-dev.mongodb.com)
     *  - atlas:      mms backend (cloud.mongodb.com)
     */
    const config = {
      'compass-dev': {
        atlasApiBaseUrl: 'http://localhost:8080',
        atlasApiUnauthBaseUrl: 'http://localhost:8080',
        atlasLogin: {
          clientId: '0oajzdcznmE8GEyio297',
          issuer: 'https://auth.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account.mongodb.com/account/login',
      },
      compass: {
        atlasApiBaseUrl: 'https://compass.mongodb.com',
        atlasApiUnauthBaseUrl: 'https://compass.mongodb.com',
        atlasLogin: {
          clientId: '0oajzdcznmE8GEyio297',
          issuer: 'https://auth.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account.mongodb.com/account/login',
      },
      'atlas-local': {
        atlasApiBaseUrl: 'http://localhost:8080/api/private',
        atlasApiUnauthBaseUrl: 'http://localhost:8080/api/private/unauth',
        atlasLogin: {
          clientId: '0oaq1le5jlzxCuTbu357',
          issuer: 'https://auth-qa.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account-dev.mongodb.com/account/login',
      },
      'atlas-dev': {
        atlasApiBaseUrl: 'https://cloud-dev.mongodb.com/api/private',
        atlasApiUnauthBaseUrl:
          'https://cloud-dev.mongodb.com/api/private/unauth',
        atlasLogin: {
          clientId: '0oaq1le5jlzxCuTbu357',
          issuer: 'https://auth-qa.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account-dev.mongodb.com/account/login',
      },
      atlas: {
        atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
        atlasApiUnauthBaseUrl: 'https://cloud.mongodb.com/api/private/unauth',
        atlasLogin: {
          clientId: '0oajzdcznmE8GEyio297',
          issuer: 'https://auth.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account.mongodb.com/account/login',
      },
    } as const;

    const { atlasServiceBackendPreset } = preferences.getPreferences();

    const atlasServiceConfig = defaultsDeep(
      {
        atlasApiBaseUrl: process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE,
        atlasApiUnauthBaseUrl:
          process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE,
        atlasLogin: {
          clientId: process.env.COMPASS_CLIENT_ID_OVERRIDE,
          issuer: process.env.COMPASS_OIDC_ISSUER_OVERRIDE,
        },
        authPortalUrl: process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE,
      },
      config[atlasServiceBackendPreset]
    );

    await AtlasService.init(atlasServiceConfig);

    this.addExitHandler(() => {
      return AtlasService.onExit();
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
    } = preferences.getPreferences();

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
}

export { CompassApplication };
