import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export type ShellHomePaths = {
  shellRoamingDataPath: string;
  shellLocalDataPath: string;
  shellRcPath: string;
};

export class ShellHomeDirectory {
  paths: ShellHomePaths;
  ensureExistsPromise: Promise<void> | null = null;

  constructor(paths: ShellHomePaths) {
    this.paths = paths;
  }

  async ensureExists(): Promise<void> {
    this.ensureExistsPromise ??= (async() => {
      await fs.mkdir(this.paths.shellRoamingDataPath, { recursive: true, mode: 0o700 });
      await fs.mkdir(this.paths.shellLocalDataPath, { recursive: true, mode: 0o700 });
    })();
    return this.ensureExistsPromise;
  }

  roamingPath(subpath: string): string {
    return path.join(this.paths.shellRoamingDataPath, subpath);
  }

  localPath(subpath: string): string {
    return path.join(this.paths.shellLocalDataPath, subpath);
  }

  rcPath(subpath: string): string {
    return path.join(this.paths.shellRcPath, subpath);
  }
}

export class ConfigManager<Config> extends EventEmitter {
  shellHomeDirectory: ShellHomeDirectory;
  config: Config | null;

  constructor(shellHomeDirectory: ShellHomeDirectory) {
    super();
    this.shellHomeDirectory = shellHomeDirectory;
    this.config = null;
  }

  path() {
    return this.shellHomeDirectory.roamingPath('config');
  }

  /**
   * Checks if config file exists.
   *
   * If exists: Read config from the file and return it.
   * If does not exist: Writes a new file with the passed-in config object.
   */
  async generateOrReadConfig(defaultConfig: Config): Promise<Config> {
    await this.shellHomeDirectory.ensureExists();
    let fd;

    try {
      try {
        fd = await fs.open(this.path(), 'r');
      } catch (err) {
        if (err.code !== 'ENOENT') {
          this.emit('error', err);
          throw err;
        }
      }

      if (fd !== undefined) {
        // Not the first access. Read the file and return it.
        try {
          const config: Config = JSON.parse(await fd.readFile({ encoding: 'utf8' }));
          this.emit('update-config', config);
          return { ...defaultConfig, ...config };
        } catch (err) {
          this.emit('error', err);
          return defaultConfig;
        }
      } else {
        // First access. Write the default config.
        await this.writeConfigFile(defaultConfig);
        this.emit('new-config', defaultConfig);
        return defaultConfig;
      }
    } finally {
      await fd?.close();
    }
  }

  /**
   * Write the specified config to the configuration file path.
   */
  async writeConfigFile(config: Config): Promise<void> {
    await this.shellHomeDirectory.ensureExists();
    try {
      await fs.writeFile(this.path(), JSON.stringify(config), { mode: 0o600 });
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
}

export function getStoragePaths(): ShellHomePaths {
  let shellLocalDataPath;
  let shellRoamingDataPath;
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA ?? process.env.APPDATA;
    if (localAppData && appData) {
      shellLocalDataPath = path.join(localAppData, 'mongodb', 'mongosh');
      shellRoamingDataPath = path.join(appData, 'mongodb', 'mongosh');
    }
  }
  const homedir = path.join(os.homedir(), '.mongodb', 'mongosh');
  shellLocalDataPath ??= homedir;
  shellRoamingDataPath ??= homedir;
  return {
    shellLocalDataPath,
    shellRoamingDataPath,
    shellRcPath: os.homedir()
  };
}
