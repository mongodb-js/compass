'use strict';
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');
const util = require('util');
const { debounce } = require('lodash');

if (!process.env.MMS_HOME) {
  throw new Error(
    'Missing required environment variable $MMS_HOME. Make sure you finished the "Cloud Developer Setup" process'
  );
}

const srcDir = path.resolve(__dirname, '..', 'dist');

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

const copyDist = debounce(
  function () {
    fs.cpSync(srcDir, destDir, { recursive: true });
  },
  1_000,
  {
    leading: true,
    trailing: true,
  }
);

// The existing approach of using `npm / pnpm link` commands doesn't play well
// with webpack that will start to resolve other modules relative to the imports
// from compass-web inevitably causing some modules to resolve from the compass
// monorepo instead of mms one. To work around that we are just watching for any
// file changes in the dist folder and copying them as-is to whatever place
// compass-web was installed in mms node_modules
const distWatcher = fs.watch(srcDir, function () {
  copyDist();
});

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
    .append(() => fs.cpSync(tmpDir, destDir, { recursive: true }))
    .append(() => fs.rmSync(tmpDir, { recursive: true, force: true }))
    .run();
  fs.writeSync(process.stdout.fd, 'Exit compass-web sync...\n');
  process.exit(errorCount);
}

for (const evt of ['SIGINT', 'SIGTERM']) {
  process.on(evt, cleanup);
}
