const path = require('path');
const { tmpdir } = require('os');
const { promises: fs } = require('fs');
const { promisify } = require('util');
const { once } = require('events');
const { PassThrough } = require('stream');
const { CliRepl } = require('@mongosh/cli-repl');

// MongoshNodeRepl performs no I/O, so it's safe to assume that all operations
// finish within a single nextTick/microtask cycle. We can use `setImmediate()`
// to wait for these to finish.
const tick = promisify(setImmediate);

async function waitBus(bus, event) {
  return await once(bus, event);
}

async function waitEval(bus) {
  // Wait for the (possibly I/O-performing) evaluation to complete and then
  // wait another tick for the result to be flushed to the output stream.
  await waitBus(bus, 'mongosh:eval-complete');
  await tick();
}

let i = 0;

async function getTmpDir() {
  const dir = path.resolve(
    tmpdir(),
    `bson-transpilers-test-repl-tmp-${Date.now()}-${++i}`
  );
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function createRepl({
  nodeReplOptions,
  shellCliOptions,
  shellHomePaths,
  ...options
} = {}) {
  // cli-repl only works with node 14, we are on 12 because Compass so have to
  // explicitly disable this check
  process.env.MONGOSH_SKIP_NODE_VERSION_CHECK = true;

  const inputStream = new PassThrough();
  const outputStream = new PassThrough();
  const tmpDir = await getTmpDir();

  let output = '';
  let exitCode = null;

  outputStream.setEncoding('utf8').on('data', (chunk) => {
    output += chunk;
  });

  const cliReplOptions = {
    input: inputStream,
    output: outputStream,
    nodeReplOptions: {
      terminal: false,
      prompt: '',
      ...nodeReplOptions
    },
    shellCliOptions: { nodb: true, quiet: true, ...shellCliOptions },
    shellHomePaths: {
      shellRoamingDataPath: tmpDir,
      shellLocalDataPath: tmpDir,
      shellRcPath: tmpDir,
      ...shellHomePaths
    },
    onExit() {},
    ...options
  };

  const repl = new CliRepl(cliReplOptions);

  return {
    repl,
    async start(driverUrl = '', driverOptions = {}) {
      return repl.start(driverUrl, driverOptions);
    },
    async eval(code) {
      const previousOutput = output;
      inputStream.write(`${code}\n`);
      await waitEval(repl.bus);
      return output.replace(previousOutput, '').replace(/\n> $/, '');
    },
    async exit() {
      await repl.close();
    },
    get output() {
      return output;
    },
    get exitCode() {
      return exitCode;
    }
  };
}

module.exports = {
  createRepl,
  async eval(code) {
    const repl = await createRepl({ shellCliOptions: { eval: code } });
    try {
      await repl.start();
    } catch (e) {
      // We will always end up there because cli-repl always throws if onExit
      // doesn't actually exit
      if (e && e.message && /onExit\(\) unexpectedly returned/.test(e)) {
        return repl.output.replace(/\n$/, '');
      }
      throw e;
    }
  }
};
