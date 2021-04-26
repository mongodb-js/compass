import { ChildProcess, spawn } from 'child_process';
import { promises as fs, constants as fsConstants } from 'fs';
import { isIP } from 'net';
import path from 'path';
import readline from 'readline';
import { Readable, PassThrough } from 'stream';
import { MongoshInternalError } from '@mongosh/errors';
import { CliServiceProvider } from '@mongosh/service-provider-server';
import type { MongoshBus } from '@mongosh/types';
import { ShellHomeDirectory } from './config-directory';

export async function getMongocryptdPaths(): Promise<string[][]> {
  const bindir = path.dirname(process.execPath);
  const result = [];
  for await (const mongocryptdCandidate of [
    // Location of mongocryptd-mongosh in the deb and rpm packages
    path.resolve(bindir, '..', 'libexec', 'mongocryptd-mongosh'),
    // Location of mongocryptd-mongosh in the zip and tgz packages
    path.resolve(bindir, 'mongocryptd-mongosh'),
    path.resolve(bindir, 'mongocryptd-mongosh.exe')
  ]) {
    try {
      await fs.access(mongocryptdCandidate, fsConstants.X_OK);
      result.push([ mongocryptdCandidate ]);
    } catch { /* ignore error */ }
  }
  return [...result, ['mongocryptd']];
}

// The relevant information regarding the state of a mongocryptd process.
type MongocryptdState = {
  uri: string;
  proc: ChildProcess;
  interval: NodeJS.Timeout;
};
export class MongocryptdManager {
  spawnPaths: string[][];
  bus: MongoshBus;
  path: string;
  state: MongocryptdState | null;
  idleShutdownTimeoutSecs = 60;

  // spawnPaths: A list of executables to spawn
  // shellHomeDirectory: A place for storing mongosh-related files
  // bus: A message bus for sharing diagnostic events about mongocryptd lifetimes
  constructor(spawnPaths: string[][], shellHomeDirectory: ShellHomeDirectory, bus: MongoshBus) {
    this.spawnPaths = spawnPaths;
    this.path = shellHomeDirectory.localPath(`mongocryptd-${process.pid}-${(Math.random() * 100000) | 0}`);
    this.bus = bus;
    this.state = null;
  }

  // Start a mongocryptd process and return matching driver options for it.
  async start(): Promise<{ mongocryptdURI: string, mongocryptdBypassSpawn: true }> {
    if (!this.state) {
      [ this.state ] = await Promise.all([
        this._spawn(),
        this._cleanupOldMongocryptdDirectories()
      ]);
    }

    return {
      mongocryptdURI: this.state.uri,
      mongocryptdBypassSpawn: true
    };
  }

  // Stop the managed mongocryptd process, if any. This is kept synchronous
  // in order to be usable inside process.on('exit') listeners.
  close = (): this => {
    process.removeListener('exit', this.close);
    if (this.state) {
      this.state.proc.kill();
      clearInterval(this.state.interval);
      this.state = null;
    }
    return this;
  };

  // Create an async iterator over the individual lines in a mongo(crypt)d
  // process'es stdout, while also forwarding the log events to the bus.
  async* createLogEntryIterator(stdout: Readable, pid: number) {
    let isStructuredLog : boolean | undefined = undefined;
    for await (const line of readline.createInterface({ input: stdout })) {
      if (!line.trim()) {
        continue;
      }
      if (isStructuredLog === undefined) {
        // 4.4 and above use structured logging, where the first entry always
        // starts with '{'.
        isStructuredLog = line.startsWith('{');
      }
      try {
        const logEntry = isStructuredLog ? JSON.parse(line) : parseOldLogEntry(line);
        this.bus.emit('mongosh:mongocryptd-log', { pid, logEntry });
        yield { ...logEntry, isStructuredLog };
      } catch (error) {
        this.bus.emit('mongosh:mongocryptd-error', { cause: 'parse', error });
        break;
      }
    }
  }

  // Create a mongocryptd child process.
  _spawnMongocryptdProcess(spawnPath: string[]): ChildProcess {
    const [ executable, ...args ] = [
      ...spawnPath,
      '--idleShutdownTimeoutSecs', String(this.idleShutdownTimeoutSecs),
      '--pidfilepath', path.join(this.path, 'mongocryptd.pid'),
      '--port', '0',
      ...(process.platform !== 'win32' ? ['--unixSocketPrefix', this.path] : [])
    ];
    const proc = spawn(executable, args, {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    proc.on('exit', (code, signal) => {
      const logEntry = { exit: { code, signal } };
      this.bus.emit('mongosh:mongocryptd-log', { pid: proc.pid, logEntry });
    });
    return proc;
  }

  // Try the passed paths to executables for spawning, and parse the process'es
  // log to understand on what path/port it is listening on.
  async _spawn(): Promise<MongocryptdState> {
    if (this.spawnPaths.length === 0) {
      throw new MongoshInternalError('No mongocryptd spawn path given');
    }

    await fs.mkdir(this.path, { recursive: true, mode: 0o700 });
    process.on('exit', this.close);

    let proc: ChildProcess | undefined = undefined;
    let uri = '';
    let lastError: Error | undefined = undefined;
    for (const spawnPath of this.spawnPaths) {
      this.bus.emit('mongosh:mongocryptd-tryspawn', { spawnPath, path: this.path });
      try {
        proc = this._spawnMongocryptdProcess(spawnPath);
      } catch (error) {
        // Spawn can fail both synchronously and asynchronously.
        // We log the error either way and just try the next one.
        lastError = error;
        this.bus.emit('mongosh:mongocryptd-error', { cause: 'spawn', error });
        continue;
      }
      // eslint-disable-next-line no-loop-func
      proc.on('error', (error) => {
        lastError = error;
        this.bus.emit('mongosh:mongocryptd-error', { cause: 'spawn', error });
      });
      let stderr = '';
      // eslint-disable-next-line chai-friendly/no-unused-expressions
      proc.stderr?.setEncoding('utf8').on('data', chunk => { stderr += chunk; });

      const { pid } = proc;

      // Get an object-mode Readable stream of parsed log events.
      const logEntryStream = Readable.from(this.createLogEntryIterator(proc.stdout as Readable, pid));
      const { socket, port } = await filterLogStreamForSocketAndPort(logEntryStream);
      if (!socket && port === -1) {
        // This likely means that stdout ended before we could get a path/port
        // from it, most likely because spawning itself failed.
        proc.kill();
        this.bus.emit('mongosh:mongocryptd-error', { cause: 'nostdout', stderr });
        continue;
      }

      // Keep the stream going even when not being consumed in order to get
      // the log events on the bus.
      logEntryStream.resume();

      // No UNIX socket means we're on Windows, where we have to use networking.
      uri = !socket ? `mongodb://localhost:${port}` : `mongodb://${encodeURIComponent(socket)}`;
    }
    if (!proc || !uri) {
      throw lastError ?? new MongoshInternalError('Could not successfully spawn mongocryptd');
    }

    const interval = setInterval(async() => {
      // Use half the idle timeout of the process for regular keepalive pings.
      let sp;
      try {
        sp = await CliServiceProvider.connect(uri, {
          serverSelectionTimeoutMS: this.idleShutdownTimeoutSecs * 1000
        });
        await sp.runCommandWithCheck('admin', { isMaster: 1 });
      } catch (error) {
        this.bus.emit('mongosh:mongocryptd-error', { cause: 'ping', error });
      } finally {
        if (sp !== undefined) {
          await sp.close(true);
        }
      }
    }, this.idleShutdownTimeoutSecs * 1000 / 2);
    interval.unref();
    proc.unref();

    return { uri, proc, interval };
  }

  // Run when starting a new mongocryptd process. Clean up old, unused
  // directories that were created by previous operations like this.
  async _cleanupOldMongocryptdDirectories(): Promise<void> {
    try {
      const toBeRemoved = [];
      for await (const dirent of await fs.opendir(path.resolve(this.path, '..'))) {
        // A directory with an empty mongocryptd.pid indicates that the
        // mongocryptd process in question has terminated.
        if (dirent.name.startsWith('mongocryptd-') && dirent.isDirectory()) {
          let size = 0;
          try {
            size = (await fs.stat(path.join(dirent.name, 'mongocryptd.pid'))).size;
          } catch (err) {
            if (err.code !== 'ENOENT') {
              throw err;
            }
          }
          if (size === 0) {
            toBeRemoved.push(path.join(this.path, '..', dirent.name));
          }
        }
      }
      for (const dir of toBeRemoved) {
        if (path.resolve(dir) !== path.resolve(this.path)) {
          await fs.rmdir(dir, { recursive: true });
        }
      }
    } catch (error) {
      this.bus.emit('mongosh:mongocryptd-error', { cause: 'cleanup', error });
    }
  }
}

// Parse a log line from mongod < 4.4, i.e. before structured logging came into
// existence. You may have seen code like this before. :)
function parseOldLogEntry(line: string): any {
  const re = /^(?<timestamp>\S*) *(?<severity>\S*) *(?<component>\S*) *\[(?<thread>[^\]]+)\]\s*(?<message>.*)$/;
  const match = line.trim().match(re);
  if (!match) {
    throw new Error(`Could not parse line ${JSON.stringify(line)}`);
  }
  return match.groups;
}

function getSocketFromLogEntry(logEntry: any): string {
  let match;
  // Log message id 23015 has the format
  // { t: <timestamp>, s: 'I', c: 'NETWORK', id: 23016, ctx: 'listener', msg: '...', attr: { address: '/tmp/q/mongocryptd.sock' } }
  if (logEntry.id === 23015) {
    if (!isIP(logEntry.attr.address)) {
      return logEntry.attr.address;
    }
  }
  // Or, 4.2-style: <timestamp> I  NETWORK  [listener] Listening on /tmp/mongocryptd.sock
  if (logEntry.id === undefined && (match = logEntry.message.match(/^Listening on (?<addr>.+)$/i))) {
    if (!isIP(match.groups.addr)) {
      return match.groups.addr;
    }
  }
  return '';
}

function getPortFromLogEntry(logEntry: any): number {
  let match;
  // Log message id 23016 has the format
  // { t: <timestamp>, s: 'I', c: 'NETWORK', id: 23016, ctx: 'listener', msg: '...', attr: { port: 27020 } }
  if (logEntry.id === 23016) {
    return logEntry.attr.port;
  }
  // Or, 4.2-style: <timestamp> I  NETWORK  [listener] waiting for connections on port 27020
  if (logEntry.id === undefined && (match = logEntry.message.match(/^waiting for connections on port (?<port>\d+)$/i))) {
    return +match.groups.port;
  }
  return -1;
}

// Go through a stream of parsed log entry objects and return the port/path
// data once found.
async function filterLogStreamForSocketAndPort(input: Readable): Promise<{ port: number, socket: string }> {
  let port = -1;
  let socket = '';
  const inputDuplicate = input.pipe(new PassThrough({ objectMode: true }));

  for await (const logEntry of inputDuplicate) {
    if ((logEntry.c ?? logEntry.component) !== 'NETWORK' ||
        (logEntry.ctx ?? logEntry.thread) !== 'listener') {
      continue; // We are only interested in listening network events
    }
    socket ||= getSocketFromLogEntry(logEntry);
    port = getPortFromLogEntry(logEntry);
    if (port !== -1) {
      break;
    }
  }
  return { socket, port };
}
