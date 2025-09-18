import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import os from 'node:os';
import util from 'node:util';
import net from 'node:net';
import timers from 'node:timers/promises';

if (!process.env.MMS_HOME) {
  throw new Error(
    'Missing required environment variable $MMS_HOME. Make sure you finished the "Cloud Developer Setup" process'
  );
}

function isDevServerRunning(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

let devServer;
if (!(await isDevServerRunning(8081))) {
  console.log('mms dev server is not running... launching!');
  child_process.execFileSync('pnpm', ['install'], {
    cwd: process.env.MMS_HOME,
    stdio: 'inherit',
  });
  child_process.execFileSync('pnpm', ['run', 'init'], {
    cwd: process.env.MMS_HOME,
    stdio: 'inherit',
  });
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

  devServer = child_process.spawn('pnpm', ['run', 'start'], {
    cwd: process.env.MMS_HOME,
    env: {
      ...process.env,
      NODE_OPTIONS: mergedNodeOptions,
    },
    stdio: 'inherit',
  });

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
}

const srcDir = path.resolve(import.meta.dirname, '..', 'dist');

const destDir = path.dirname(
  child_process.execFileSync(
    'node',
    ['-e', "console.log(require.resolve('@mongodb-js/compass-web'))"],
    { cwd: process.env.MMS_HOME, encoding: 'utf-8' }
  )
);

const tmpDir = path.join(
  os.tmpdir(),
  `mongodb-js--compass-web-${Date.now().toString(36)}`
);

fs.mkdirSync(srcDir, { recursive: true });

// Create a copy of current dist that will be overriden by link, we'll restore
// it when we are done
fs.mkdirSync(tmpDir, { recursive: true });
fs.cpSync(destDir, tmpDir, { recursive: true });

let oneSec = null;
async function copyDist() {
  // If a copy is already in progress, return early (debounce)
  if (oneSec) return;
  fs.cpSync(srcDir, destDir, { recursive: true });
  oneSec = timers.setTimeout(1000);
  await oneSec;
  oneSec = null;
}

// The existing approach of using `npm / pnpm link` commands doesn't play well
// with webpack that will start to resolve other modules relative to the imports
// from compass-web inevitably causing some modules to resolve from the compass
// monorepo instead of mms one. To work around that we are just watching for any
// file changes in the dist folder and copying them as-is to whatever place
// compass-web was installed in mms node_modules
const distWatcher = fs.watch(srcDir, () => void copyDist());

const webpackWatchProcess = child_process.spawn('npm', ['run', 'watch'], {
  stdio: 'inherit',
});

const failProofRunner = () =>
  new (class FailProofRunner extends Array {
    append(...fns) {
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

function cleanup(signalName) {
  const errorCount = failProofRunner()
    .append(() => distWatcher.close())
    .append(() => webpackWatchProcess.kill(signalName))
    .append(() => devServer?.kill(signalName))
    .append(() => fs.cpSync(tmpDir, destDir, { recursive: true }))
    .append(() => fs.rmSync(tmpDir, { recursive: true, force: true }))
    .run();
  fs.writeSync(process.stdout.fd, 'Exit compass-web sync...\n');
  process.exit(errorCount);
}

process.on('SIGINT', cleanup).on('SIGTERM', cleanup);
