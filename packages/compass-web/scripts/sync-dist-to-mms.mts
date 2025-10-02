import process from 'node:process';
import fs, { promises as asyncFs } from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import os from 'node:os';
import util from 'node:util';
import timers from 'node:timers/promises';

if (!process.env.MMS_HOME) {
  throw new Error(
    'Missing required environment variable $MMS_HOME. Make sure you finished the "Cloud Developer Setup" process'
  );
}

// Set up early signal handling and cleanup
let devServer: child_process.ChildProcess | undefined;
let distWatcher: fs.FSWatcher | undefined;
let webpackWatchProcess: child_process.ChildProcess | undefined;

const tmpDir = path.join(
  os.tmpdir(),
  `mongodb-js--compass-web-${Date.now().toString(36)}`
);
const srcDir = path.resolve(import.meta.dirname, '..', 'dist');
const destDir = path.dirname(
  child_process.execFileSync(
    process.execPath,
    ['-e', "console.log(require.resolve('@mongodb-js/compass-web'))"],
    { cwd: process.env.MMS_HOME, encoding: 'utf-8' }
  )
);

fs.mkdirSync(srcDir, { recursive: true });
// Create a copy of current dist that will be overridden by link, we'll restore
// it when we are done
fs.mkdirSync(tmpDir, { recursive: true });
fs.cpSync(destDir, tmpDir, { recursive: true });

const failProofRunner = () =>
  new (class FailProofRunner extends Array {
    append(...fns: any[]) {
      this.push(...fns);
      return this;
    }

    run() {
      const errors = this.map((f) => {
        try {
          f();
        } catch (e) {
          return e;
        }
      }).filter((e) => e);

      if (errors.length) {
        fs.writeSync(
          process.stdout.fd,
          util.inspect(errors, { depth: 20 }) + '\n'
        );
      }

      return errors.length;
    }
  })();

function cleanup(signalName: NodeJS.Signals): void {
  console.log(`\nReceived ${signalName}, cleaning up...`);
  const errorCount = failProofRunner()
    .append(() => distWatcher?.close())
    .append(() => webpackWatchProcess?.kill(signalName))
    .append(() => devServer?.kill(signalName))
    .append(() => fs.cpSync(tmpDir, destDir, { recursive: true }))
    .append(() => fs.rmSync(tmpDir, { recursive: true, force: true }))
    .run();
  fs.writeSync(process.stdout.fd, 'Exit compass-web sync...\n');
  process.exit(errorCount);
}

// Set up signal handlers immediately
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

async function isDevServerRunning(
  port: number,
  host: string = '127.0.0.1'
): Promise<boolean> {
  try {
    return (
      await fetch(`http://${host}:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      })
    ).ok;
  } catch (error) {
    return false;
  }
}

if (!(await isDevServerRunning(8081))) {
  console.log('mms dev server is not running... launching!');

  const { engines } = JSON.parse(
    await asyncFs.readFile(
      path.join(process.env.MMS_HOME, 'package.json'),
      'utf8'
    )
  );
  const pnpmVersion = engines.pnpm ?? 'latest';

  const halfRamMb = Math.min(
    Math.floor(os.totalmem() / 2 / 1024 / 1024),
    16384
  );
  // Merge with existing NODE_OPTIONS if present
  const existingNodeOptions = process.env.NODE_OPTIONS ?? '';
  const mergedNodeOptions = [
    `--max_old_space_size=${halfRamMb}`,
    existingNodeOptions,
  ]
    .filter(Boolean)
    .join(' ');

  devServer = child_process.spawn(
    'npx',
    [`pnpm@${pnpmVersion}`, 'run', 'start'],
    {
      cwd: process.env.MMS_HOME,
      env: {
        ...process.env,
        NODE_OPTIONS: mergedNodeOptions,
        npm_config_engine_strict: `${false}`,
      },
      stdio: 'inherit',
    }
  );

  // Wait for dev server to be ready before proceeding
  console.log('Waiting for dev server to start...');
  let retries = 30; // 30 seconds max
  while (retries > 0 && !(await isDevServerRunning(8081))) {
    await timers.setTimeout(1000);
    retries--;
  }

  if (retries === 0) {
    console.warn('Dev server may not be fully ready, proceeding anyway...');
  } else {
    console.log('Dev server is ready!');
  }
} else {
  console.log('Skipping running MMS dev server...');
}

let oneSec: Promise<void> | null = null;
let pendingCopy = false;

async function copyDist(): Promise<void> {
  // If a copy is already in progress, mark that we need another copy
  if (oneSec) {
    pendingCopy = true;
    return;
  }
  // Keep copying until there are no more pending requests
  do {
    pendingCopy = false;
    fs.cpSync(srcDir, destDir, { recursive: true });
    oneSec = timers.setTimeout(1000);
    await oneSec;
  } while (pendingCopy);

  oneSec = null;
}

// The existing approach of using `npm / pnpm link` commands doesn't play well
// with webpack that will start to resolve other modules relative to the imports
// from compass-web inevitably causing some modules to resolve from the compass
// monorepo instead of mms one. To work around that we are just watching for any
// file changes in the dist folder and copying them as-is to whatever place
// compass-web was installed in mms node_modules
distWatcher = fs.watch(srcDir, () => void copyDist());

webpackWatchProcess = child_process.spawn('npm', ['run', 'watch'], {
  stdio: 'inherit',
});
