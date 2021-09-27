const os = require('os');
const { promises: fs, createReadStream, createWriteStream } = require('fs');
const stream = require('stream');
const { promisify } = require('util');
const path = require('path');
const zlib = require('zlib');
const { app } = require('electron');
const ipc = require('hadron-ipc');
const { mongoLogId, MongoLogManager } = require('mongodb-log-writer');
const { version } = require('../../package.json');
const debug = require('debug')('mongodb-compass:main:logging');

exports.setupLogging = async function setupLogging() {
  try {
    const directory = app.getPath('logs');

    const manager = new MongoLogManager({
      directory,
      gzip: true,
      retentionDays: 30,
      onerror: (err, filepath) => debug('Failed to access path', filepath, err),
      onwarn: (err, filepath) => debug('Failed to access path', filepath, err)
    });

    const [ writer, osReleaseInfo ] = await Promise.all([
      (async() => {
        await fs.mkdir(directory, { recursive: true });
        return await manager.createLogWriter();
      })(),
      (async() => {
        let osRelease = '';
        try {
          osRelease = await fs.readFile('/etc/os-release', 'utf8');
        } catch { /* ignore */ }
        const nameMatch = osRelease.match(/^ID="?(?<name>.+?)"?$/m);
        const versionMatch = osRelease.match(/^VERSION_ID="?(?<version>.+?)"?$/m);
        return {
          osReleaseName: nameMatch && nameMatch.groups.name,
          osReleaseVersion: versionMatch && versionMatch.groups.version
        };
      })()
    ]);

    // Note: The e2e tests rely on this particular line for figuring
    // out where the log output is written.
    debug('Writing log output to', writer.logFilePath);

    writer.info('COMPASS-MAIN', mongoLogId(1_001_000_001), 'logging', 'Starting logging', {
      version,
      platform: os.platform(),
      arch: os.arch(),
      ...osReleaseInfo
    });

    ipc.on('compass:error:fatal', (evt, meta) => {
      writer.fatal('COMPASS-MAIN', mongoLogId(1_001_000_002), 'app', 'Uncaught exception: ' + meta.message, meta);
    });

    process.prependListener('uncaughtException', (exception) => {
      writer.fatal('COMPASS-MAIN', mongoLogId(1_001_000_002), 'app', 'Uncaught exception: ' + String(exception), { // !dupedLogId
        message: exception && exception.message,
        stack: exception && exception.stack
      });
    });

    app.on('window-all-closed', function() {
      writer.flush();
    });

    app.on('before-quit', function() {
      writer.info('COMPASS-MAIN', mongoLogId(1_001_000_003), 'app', 'Closing application');
      writer.end();
    });

    process.on('compass:log', (meta) => {
      writer.target.write(meta.line);
    });

    ipc.respondTo('compass:log', (evt, meta) => {
      process.emit('compass:log', meta);
    });

    await manager.cleanupOldLogfiles();

    return writer.logFilePath;
  } catch (err) {
    debug('Failure setting up logging!', err);
  }
};

// Note: This is tested, but you need to run the tests manually
// via `mocha test/unit/logging.test.js` for now, see
// https://jira.mongodb.org/browse/COMPASS-5115.
exports.extractPartialLogFile = async function extractPartialLogFile({ app: electronApp, logFilePath }) {
  const logFilename = path.basename(logFilePath, '.gz');
  const tempFilePath = path.join(
    electronApp.getPath('temp'),
    'compass_logs',
    `compass_${logFilename}.txt`);
  debug('Extracting partial logfile', { logFilePath, tempFilePath });
  try {
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true, mode: 0o700 });
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
      createWriteStream(tempFilePath, { flags: 'wx', mode: 0o600 }));
  } catch (err) {
    debug('Failed to extract file', err);
    throw err;
  }

  return tempFilePath;
};
