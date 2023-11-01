import os from 'os';
import { once } from 'events';
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import stream from 'stream';
import { promisify } from 'util';
import path from 'path';
import createDebug from 'debug';
import zlib from 'zlib';
import { app, shell, dialog, clipboard } from 'electron';
import { ipcMain } from 'hadron-ipc';
import type { MongoLogWriter } from 'mongodb-log-writer';
import { mongoLogId, MongoLogManager } from 'mongodb-log-writer';
import COMPASS_ICON from './icon';
import type { CompassApplication } from './application';
import type { EventEmitter } from 'events';

const debug = createDebug('mongodb-compass:main:logging');

// Queue up events that happen before logging is initialized.
const earlyLogEvents: unknown[] = [];
const earlyLoggingListener = (ev: unknown) => earlyLogEvents.push(ev);
function installEarlyLoggingListener() {
  process.on('compass:log', earlyLoggingListener);
}

async function setupLogging(compassApp: typeof CompassApplication) {
  try {
    const directory = app.getPath('logs');

    const manager = new MongoLogManager({
      directory,
      gzip: true,
      retentionDays: 30,
      maxLogFileCount: 100,
      onerror: (err, filepath) => debug('Failed to access path', filepath, err),
      onwarn: (err, filepath) => debug('Failed to access path', filepath, err),
    });

    const [writer, osReleaseInfo] = await Promise.all([
      (async () => {
        await fs.mkdir(directory, { recursive: true });
        const writer = await manager.createLogWriter();
        writer.on('error', (err) => {
          // Multiple async sources can be trying to write logs in compass
          // application across multiple threads, which makes guaranteeing that
          // nothing will write logs after we closed the log stream tricky. To
          // handle that we will ignore `ERR_STREAM_WRITE_AFTER_END` types of
          // errors
          if (
            (err as { code?: string }).code === 'ERR_STREAM_WRITE_AFTER_END'
          ) {
            return;
          }
          throw err;
        });
        return writer;
      })(),
      (async () => {
        let osRelease = '';
        try {
          osRelease = await fs.readFile('/etc/os-release', 'utf8');
        } catch {
          /* ignore */
        }
        const nameMatch = /^ID="?(?<name>.+?)"?$/m.exec(osRelease);
        const versionMatch = /^VERSION_ID="?(?<version>.+?)"?$/m.exec(
          osRelease
        );
        return {
          osReleaseName: nameMatch?.groups?.name,
          osReleaseVersion: versionMatch?.groups?.version,
        };
      })(),
    ]);

    // Note: The e2e tests rely on this particular line for figuring
    // out where the log output is written.
    debug('Writing log output to', writer.logFilePath);

    writer.info(
      'COMPASS-MAIN',
      mongoLogId(1_001_000_001),
      'logging',
      'Starting logging',
      {
        version: app.getVersion(),
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        platform: os.platform(),
        arch: os.arch(),
        ...osReleaseInfo,
        pendingEarlyLogEventCount: earlyLogEvents.length,
      }
    );

    ipcMain?.on('compass:error:fatal', (evt, meta) => {
      writer.fatal(
        'COMPASS-MAIN',
        mongoLogId(1_001_000_002),
        'app',
        `Uncaught exception: ${meta.message as string}`,
        meta
      );
    });

    process.prependListener('uncaughtException', (exception) => {
      writer.fatal(
        'COMPASS-MAIN',
        mongoLogId(1_001_000_002), // !dupedLogId
        'app',
        `Uncaught exception: ${String(exception)}`,
        {
          message: exception && exception.message,
          stack: exception && exception.stack,
        }
      );
    });

    app.on('window-all-closed', function () {
      void writer.flush();
    });

    compassApp.addExitHandler(async function () {
      writer.info(
        'COMPASS-MAIN',
        mongoLogId(1_001_000_003),
        'app',
        'Closing application'
      );
      writer.end();
      await once(writer, 'log-finish');
    });

    // Install new log listener, then emit all previously queued-up events
    process.on('compass:log', (meta) => {
      writer.target.write(meta.line);
    });
    process.off('compass:log', earlyLoggingListener);
    for (const ev of earlyLogEvents) {
      process.emit('compass:log' as any, ev as any);
    }

    ipcMain?.respondTo('compass:log', (evt, meta) => {
      (process as EventEmitter).emit('compass:log', meta);
    });

    ipcMain?.handle('compass:logPath', () => {
      return app.getPath('logs');
    });

    ipcMain?.handle('compass:userDataPath', () => {
      return app.getPath('userData');
    });

    await manager.cleanupOldLogfiles();

    return writer;
  } catch (err) {
    debug('Failure setting up logging!', err);
  }
}

export async function extractPartialLogFile(
  logFilePath: string,
  tmpdir = app.getPath('temp')
): Promise<string> {
  const logFilename = path.basename(logFilePath, '.gz');
  const tempFilePath = path.join(
    tmpdir,
    'compass_logs',
    `compass_${logFilename}.txt`
  );
  debug('Extracting partial logfile', { logFilePath, tempFilePath });
  try {
    await fs.mkdir(path.dirname(tempFilePath), {
      recursive: true,
      mode: 0o700,
    });
    await fs.unlink(tempFilePath);
  } catch {
    // If there was an error from mkdir/unlink, we ignore it, if it
    // fails for any reason other than the file not existing
    // (which is the common case)  we'll end up running into
    // trouble during  createWriteStream() anyway.
  }

  try {
    await promisify(stream.pipeline)(
      createReadStream(logFilePath),
      // Z_SYNC_FLUSH because Compass is still running, i.e. the log
      // file is incomplete.
      zlib.createGunzip({ finishFlush: zlib.constants.Z_SYNC_FLUSH }),
      createWriteStream(tempFilePath, { flags: 'wx', mode: 0o600 })
    );
  } catch (err) {
    debug('Failed to extract file', err);
    throw err;
  }

  return tempFilePath;
}

async function showLogFileDialog(logFilePath: string) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Log file for this session',
    icon: COMPASS_ICON,
    message: `The log file for this session can be found at ${logFilePath}`,
    detail:
      'Some tools may not be able to read the log file until Compass has exited.',
    buttons: [
      'OK',
      'Copy to clipboard',
      'Open Folder',
      'Extract and open as .txt',
    ],
  });

  switch (response) {
    case 1:
      clipboard.writeText(logFilePath);
      break;
    case 2:
      shell.showItemInFolder(logFilePath);
      break;
    case 3: {
      try {
        const tempFilePath = await extractPartialLogFile(logFilePath);
        await shell.openPath(tempFilePath);
      } catch (err) {
        dialog.showErrorBox('Error extracting log file', String(err));
      }
      break;
    }
    default:
      break;
  }
}

class CompassLogging {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static initPromise: Promise<void> | null = null;

  private static writer: MongoLogWriter | undefined;

  private static async _init(compassApp: typeof CompassApplication) {
    this.writer = await setupLogging(compassApp);

    if (this.writer?.logFilePath) {
      const { logFilePath } = this.writer;
      compassApp.on('show-log-file-dialog', () => {
        void showLogFileDialog(logFilePath);
      });
    }
  }

  static init(compassApp: typeof CompassApplication): Promise<void> {
    return (this.initPromise ??= this._init(compassApp));
  }
}

export { CompassLogging, installEarlyLoggingListener };
