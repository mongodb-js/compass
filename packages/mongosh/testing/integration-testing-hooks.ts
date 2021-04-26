import child_process from 'child_process';
import crypto from 'crypto';
import { once } from 'events';
import { promises as fs } from 'fs';
import { MongoClient, MongoClientOptions } from 'mongodb';
import path from 'path';
import rimraf from 'rimraf';
import semver from 'semver';
import { URL } from 'url';
import { promisify } from 'util';
import which from 'which';
import { downloadMongoDb } from '../packages/build/src/download-mongodb';

const execFile = promisify(child_process.execFile);

const isCI = !!process.env.IS_CI;
function ciLog(...args: any[]) {
  if (isCI) {
    console.error(...args);
  }
}

// Return the stat results or, if the file does not exist, `undefined`.
async function statIfExists(path: string): Promise<ReturnType<typeof fs.stat> | undefined> {
  try {
    return await fs.stat(path);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return undefined;
    }
    throw err;
  }
}

// Return the path to the temporary directory and ensure that it exists.
async function getTmpdir(): Promise<string> {
  const tmpdir = path.resolve(__dirname, '..', 'tmp');
  await fs.mkdir(tmpdir, { recursive: true });
  return tmpdir;
}

async function tryExtensions(base: string): Promise<[ string, Error ]> {
  let lastErr = new Error('unreachable');
  for (const ext of ['', '.exe', '.bat']) {
    try {
      await fs.stat(base + ext);
      return [ base + ext, lastErr ];
    } catch (err) {
      lastErr = err;
      ciLog('File does not exist or is inaccessible', base + ext);
    }
  }
  return [ '', lastErr ];
}

// Get the path we use to spawn mlaunch, and potential environment variables
// necessary to run it successfully. This tries to install it locally if it
// cannot find an existing installation.
let mlaunchPath: { exec: string, env: Record<string,string> } | undefined;
export async function getMlaunchPath(): Promise<{ exec: string, env: Record<string,string> }> {
  const tmpdir = await getTmpdir();
  if (mlaunchPath !== undefined) {
    return mlaunchPath;
  }

  try {
    // If `mlaunch` is already in the PATH: Great, we're done.
    return mlaunchPath = { exec: await which('mlaunch'), env: {} };
  } catch {
    ciLog('Did not find mlaunch in PATH');
  }

  // Figure out where python3 might live (python3, python, $PYTHON).
  let python = '';
  try {
    await which('python3');
    python = 'python3';
  } catch {
    ciLog('Did not find python3 in PATH');
    try {
      // Fun fact on the side: Python 2.x writes the version to stderr,
      // Python 3.x writes to stdout.
      const { stdout } = await execFile('python', ['-V']);
      if (stdout.includes('Python 3')) {
        python = 'python';
      } else {
        throw new Error('python is not Python 3.x');
      }
    } catch {
      ciLog('Did not find python as Python 3.x in PATH');
      const pythonEnv = process.env.PYTHON;
      if (pythonEnv) {
        const { stdout } = await execFile(pythonEnv as string, ['-V']);
        if (stdout.includes('Python 3')) {
          python = pythonEnv as string;
        }
      }
    }
  }
  if (!python) {
    throw new Error('Could not find Python 3.x installation, install mlaunch manually');
  }

  // Install mlaunch, preferably locally and otherwise attempt to do so globally.
  try {
    const mlaunchPy = path.join(tmpdir, 'bin', 'mlaunch');
    let [ exec ] = await tryExtensions(mlaunchPy);
    if (exec) {
      return mlaunchPath = { exec, env: { PYTHONPATH: tmpdir } };
    }
    ciLog('Trying to install mlaunch in ', tmpdir);
    await execFile('pip3', ['install', '--target', tmpdir, 'mtools[mlaunch]']);
    ciLog('Installation complete');
    [ exec ] = await tryExtensions(mlaunchPy);
    if (exec) {
      return mlaunchPath = { exec, env: { PYTHONPATH: tmpdir } };
    }
  } catch {}

  // Figure out the most likely target path for pip3 --user and use mlaunch
  // from there.
  const pythonBase = (await execFile(python, ['-m', 'site', '--user-base'])).stdout.trim();
  const pythonPath = (await execFile(python, ['-m', 'site', '--user-site'])).stdout.trim();
  const mlaunchExec = path.join(pythonBase, 'bin', 'mlaunch');
  {
    const [ exec ] = await tryExtensions(mlaunchExec);
    if (exec) {
      return { exec, env: { PYTHONPATH: pythonPath } };
    }
  }
  ciLog('Trying to install mlaunch in ', { pythonBase, pythonPath });
  await execFile('pip3', ['install', '--user', 'mtools[mlaunch]']);
  ciLog('Installation complete');
  const [ exec, lastErr ] = await tryExtensions(mlaunchExec);
  if (exec) {
    return { exec, env: { PYTHONPATH: pythonPath } };
  }
  throw lastErr;
}

type MlaunchCommand = 'init' | 'start' | 'stop' | 'list' | 'kill';
// Run a specific mlaunch command, trying to ensure that `mlaunch` is accessible
// and installing it if necessary.
async function execMlaunch(command: MlaunchCommand, ...args: string[]): Promise<void> {
  const mlaunchPath = await getMlaunchPath();

  // command could be part of args, but the extra typechecking here has helped
  // me at least once.
  const fullCmd = [mlaunchPath.exec, command, ...args];
  // console.info('Running command', fullCmd.join(' '));
  const proc = child_process.spawn(fullCmd[0], fullCmd.slice(1), {
    env: { ...process.env, ...mlaunchPath.env },
    stdio: 'inherit'
  });
  await once(proc, 'exit');
  // console.info('Successfully ran command', fullCmd.join(' '));
}

// Remove all potential leftover mlaunch instances.
export async function clearMlaunch({ killAllMongod = false } = {}) {
  if (killAllMongod) {
    for (const proc of ['mongod', 'mongos']) {
      try {
        if (process.platform === 'win32') {
          await execFile('taskkill', ['/IM', `${proc}.exe`, '/F']);
        } else {
          await execFile('killall', [proc]);
        }
      } catch (err) {
        console.warn(`Cleaning up ${proc} instances failed:`, err);
      }
    }
  }
  const tmpdir = await getTmpdir();
  for await (const { name } of await fs.opendir(tmpdir)) {
    if (name.startsWith('mlaunch-')) {
      const fullPath = path.join(tmpdir, name);
      try {
        await execMlaunch('kill', '--dir', fullPath);
      } catch (err) {
        console.warn(`mlaunch kill in ${fullPath} failed:`, err);
      }
      try {
        await promisify(rimraf)(fullPath);
      } catch (err) {
        console.warn(`Removing ${fullPath} failed:`, err);
      }
    }
  }
  await promisify(rimraf)(path.join(tmpdir, '.current-port'));
}

// Represents one running test server instance.
export class MongodSetup {
  _connectionString: Promise<string>;
  _setConnectionString: (connectionString: string) => void;
  _serverVersion: string | null = null;
  _isCommunityServer: boolean | null = null;
  _bindir = '';

  constructor(connectionString?: string) {
    this._setConnectionString = (connectionString: string) => {};  // Make TypeScript happy.
    this._connectionString = new Promise(resolve => {
      this._setConnectionString = resolve;
    });

    if (connectionString) {
      this._setConnectionString(connectionString);
    }
  }

  async start(): Promise<void> {
    throw new Error('Server not managed');
  }

  async stop(): Promise<void> {
    throw new Error('Server not managed');
  }

  async connectionString(): Promise<string> {
    return this._connectionString;
  }

  async host(): Promise<string> {
    return new URL(await this.connectionString()).hostname;
  }

  async port(): Promise<string> {
    // 27017 is the default port for mongodb:// URLs.
    return new URL(await this.connectionString()).port ?? '27017';
  }

  async hostport(): Promise<string> {
    return `${await this.host()}:${await this.port()}`;
  }

  async serverVersion(): Promise<string> {
    if (this._serverVersion !== null) {
      return this._serverVersion;
    }

    const { version } = await this.withClient(async client => {
      return await client.db('db1').admin().serverStatus();
    });
    this._serverVersion = version;
    return version;
  }

  async isCommunityServer(): Promise<boolean> {
    if (this._isCommunityServer !== null) {
      return this._isCommunityServer;
    }

    const { modules } = await this.withClient(async client => {
      return await client.db('db1').admin().command({ buildInfo: 1 });
    });
    const isCommunityServer = !modules.includes('enterprise');
    this._isCommunityServer = isCommunityServer;
    return isCommunityServer;
  }

  async withClient<T>(fn: (client: MongoClient) => Promise<T>): Promise<T> {
    let client;
    try {
      client = await MongoClient.connect(await this.connectionString(), {});
      return await fn(client);
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  get bindir(): string {
    return this._bindir;
  }
}

// Spawn mlaunch with a specific set of arguments.
class MlaunchSetup extends MongodSetup {
  _args: string[];
  _mlaunchdir = '';

  constructor(args: string[] = []) {
    super();
    this._args = args;
  }

  async start(): Promise<void> {
    if (this._mlaunchdir) return;
    const random = (await promisify(crypto.randomBytes)(16)).toString('hex');
    const tag = `${process.pid}-${random}`;

    const tmpdir = await getTmpdir();
    this._mlaunchdir = path.join(tmpdir, `mlaunch-${tag}`);

    const args = this._args;
    if (!args.includes('--replicaset') && !args.includes('--single')) {
      args.push('--single');
    }

    let port: number;
    if (args.includes('--port')) {
      const index = args.indexOf('--port');
      port = +args.splice(index, 2)[1];
    } else {
      // If no port was specified, we pick one in the range [30000, 40000].
      // We pick by writing to a file, looking up the index at which we wrote,
      // and adding that to the base port, so that there is a low likelihood of
      // port collisions between different test runs even when two tests call
      // startMlaunch() at the same time.
      // Ideally, we would handle failures from port conflicts that occur when
      // mlaunch starts, but we don't currently have access to that information
      // until .start() is called.
      const portfile = path.join(tmpdir, '.current-port');
      await fs.appendFile(portfile, `${tag}\n`);
      const portfileContent = (await fs.readFile(portfile, 'utf8')).split('\n');
      const writeIndex = portfileContent.indexOf(tag);
      if (writeIndex === -1) {
        throw new Error(`Could not figure out port number, ${portfile} may be corrupt`);
      }
      port = 30000 + (writeIndex * 30) % 10000;
    }

    // Make sure mongod and mongos are accessible
    const binarypath = await ensureMongodAvailable();
    if (binarypath) {
      args.unshift('--binarypath', binarypath);
      this._bindir = binarypath;
    }

    if (await statIfExists(this._mlaunchdir)) {
      // There might be leftovers from previous runs. Remove them.
      await execMlaunch('kill', '--dir', this._mlaunchdir);
      await promisify(rimraf)(this._mlaunchdir);
    }
    await fs.mkdir(this._mlaunchdir, { recursive: true });
    await execMlaunch('init', '--dir', this._mlaunchdir, '--port', `${port}`, ...args);
    this._setConnectionString(`mongodb://localhost:${port}`);
  }

  async stop(): Promise<void> {
    if (!this._mlaunchdir) return;
    await execMlaunch('stop', '--dir', this._mlaunchdir);
    try {
      await promisify(rimraf)(this._mlaunchdir);
    } catch (err) {
      console.error(`Cannot remove directory ${this._mlaunchdir}`, err);
    }
  }
}

async function getInstalledMongodVersion(): Promise<string> {
  await Promise.all([which('mongod'), which('mongos')]);
  const { stdout } = await execFile('mongod', ['--version']);
  const { version } = stdout.match(/^db version (?<version>.+)$/m)!.groups as any;
  return version;
}

export async function ensureMongodAvailable(mongodVersion = process.env.MONGOSH_SERVER_TEST_VERSION): Promise<string | null> {
  try {
    if (/-community/.test(String(mongodVersion))) {
      console.info(`Explicitly requesting community server with ${mongodVersion}, downloading...`);
      throw new Error();
    }
    const version = await getInstalledMongodVersion();
    if (mongodVersion && !semver.satisfies(version, mongodVersion)) {
      console.info(`global mongod is ${version}, wanted ${mongodVersion}, downloading...`);
      throw new Error();
    }
    return null;
  } catch {
    return await downloadMongoDb(path.resolve(__dirname, '..', 'tmp'), mongodVersion);
  }
}

/**
 * Starts a local server unless the `MONGOSH_TEST_SERVER_URL`
 * environment variable is set.
 *
 * It returns an object with information that can be used to connect to the
 * server.
 *
 * If env.MONGOSH_TEST_SERVER_URL is set it assumes a server
 * is already running on that uri and returns an object whose
 * .connectionString() method points to the contents of that environment
 * variable.
 *
 * If `shareMode` is `shared`, then no arguments may be passed. In that case,
 * this may re-use an existing test server managed by this process.
 *
 * @export
 * @returns {MongodSetup} - Object with information about the started server.
 */
let sharedSetup : MongodSetup | null = null;
export function startTestServer(shareMode: 'shared' | 'not-shared', ...args: string[]): MongodSetup {
  if (shareMode === 'shared' && process.env.MONGOSH_TEST_SERVER_URL) {
    return new MongodSetup(process.env.MONGOSH_TEST_SERVER_URL);
  }

  let server : MongodSetup;
  if (shareMode === 'shared') {
    if (args.length > 0) {
      throw new Error('Cannot specify arguments for shared mongod');
    }
    server = sharedSetup ?? (sharedSetup = new MlaunchSetup());
  } else {
    server = new MlaunchSetup(args);
  }

  before(async function() {
    this.timeout(120_000);  // Include potential mongod download time.
    await server.start();
  });

  after(async function() {
    // Clean the shared server only up once we're done with everything.
    if (shareMode !== 'shared') {
      this.timeout(30_000);
      await server.stop();
    }
  });

  return server;
}

global.after?.(async function() {
  if (sharedSetup !== null) {
    this.timeout(30_000);
    await sharedSetup.stop();
  }
});

// The same as startTestServer(), except that this starts multiple servers
// in parallel in the same before() call.
export function startTestCluster(...argLists: string[][]): MongodSetup[] {
  const servers = argLists.map(args => new MlaunchSetup(args));

  before(async function() {
    this.timeout(90_000 + 30_000 * servers.length);
    await Promise.all(servers.map((server: MongodSetup) => server.start()));
  });

  after(async function() {
    this.timeout(30_000 * servers.length);
    await Promise.all(servers.map((server: MongodSetup) => server.stop()));
  });

  return servers;
}

function skipIfVersion(test: any, testServerVersion: string, semverCondition: string): void {
  // Strip -rc.0, -alpha, etc. from the server version because semver rejects those otherwise.
  testServerVersion = testServerVersion.replace(/-.*$/, '');
  if (semver.satisfies(testServerVersion, semverCondition)) {
    test.skip();
  }
}

/**
 * Skip tests in the suite if the test server version matches a specific semver
 * condition.
 *
 * describe('...', () => {
 *   e.g. skipIfServerVersion(testServer, '< 4.4')
 * });
 */
export function skipIfServerVersion(server: MongodSetup, semverCondition: string): void {
  before(async function() {
    skipIfVersion(this, await server.serverVersion(), semverCondition);
  });
}

/**
 * Skip tests in the suite if the test server is a community server.
 *
 * describe('...', () => {
 *   e.g. skipIfCommunityServer(testServer)
 * });
 */
export function skipIfCommunityServer(server: MongodSetup): void {
  before(async function() {
    if (await server.isCommunityServer()) {
      this.skip();
    }
  });
}

/**
 * Add the server tarball's bin/ directrory to the PATH for this section.
 * This enables using e.g. mongocryptd if available.
 *
 * describe('...', () => {
 *   useBinaryPath(testServer)
 * });
 */
export function useBinaryPath(server: MongodSetup): void {
  let pathBefore: string;
  before(async() => {
    await server.start();
    pathBefore = process.env.PATH ?? '';
    const extraPath = server.bindir;
    if (extraPath !== null) {
      process.env.PATH += path.delimiter + extraPath;
    }
  });
  after(() => {
    process.env.PATH = pathBefore;
  });
}

/**
 * Skip tests in the suite if the test server version
 * (configured as environment variable or the currently installed one)
 * matches a specific semver version.
 *
 * If this method cannot find an environment variable or already installed
 * mongod, it uses `9999.9999.9999` as version to compare against, since
 * `startTestServer` will use the latest available version.
 *
 * IMPORTANT: As the environment variable might be `4.0.x` it will be converted
 * to `4.0.0` to be able to do a semver comparison!
 *
 * @param semverCondition Semver condition
 */
export function skipIfEnvServerVersion(semverCondition: string): void {
  before(async function() {
    let testServerVersion = process.env.MONGOSH_SERVER_TEST_VERSION;
    if (!testServerVersion) {
      try {
        testServerVersion = await getInstalledMongodVersion();
      } catch(e) {
        // no explicitly specified version but also no local mongod installation
        testServerVersion = '9999.9999.9999';
      }
    } else {
      testServerVersion = testServerVersion.split('-')[0].split('.')
        .map(num => /[0-9]+/.test(num) ? num : '0')
        .join('.');
    }
    skipIfVersion(this, testServerVersion, semverCondition);
  });
}
