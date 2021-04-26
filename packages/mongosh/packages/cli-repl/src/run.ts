import { CliRepl, parseCliArgs, mapCliToDriver, getStoragePaths, getMongocryptdPaths, runSmokeTests, USAGE } from './index';
import { generateUri } from '@mongosh/service-provider-server';

(async() => {
  let repl;
  try {
    const options = parseCliArgs(process.argv);
    const { version } = require('../package.json');

    if (options.help) {
      // eslint-disable-next-line no-console
      console.log(USAGE);
    } else if (options.version) {
      // eslint-disable-next-line no-console
      console.log(version);
    } else if (options.smokeTests) {
      const smokeTestServer = process.env.MONGOSH_SMOKE_TEST_SERVER;
      if (process.execPath === process.argv[1]) {
        // This is the compiled binary. Use only the path to it.
        await runSmokeTests(smokeTestServer, process.execPath);
      } else {
        // This is not the compiled binary. Use node + this script.
        await runSmokeTests(smokeTestServer, process.execPath, process.argv[1]);
      }
    } else {
      let mongocryptdSpawnPaths = [['mongocryptd']];
      if (process.execPath === process.argv[1]) {
        // Remove the built-in Node.js listener that prints e.g. deprecation
        // warnings in single-binary release mode.
        process.removeAllListeners('warning');
        // Look for mongocryptd in the locations where our packaging would
        // have put it.
        mongocryptdSpawnPaths = await getMongocryptdPaths();
      }

      // This is for testing under coverage, see the the comment in the tests
      if (process.env.CLEAR_SIGINT_LISTENERS) {
        process.removeAllListeners('SIGINT');
      }

      process.title = 'mongosh';
      const driverOptions = await mapCliToDriver(options);
      const driverUri = generateUri(options);
      const appName = `${process.title} ${version}`;
      const shellHomePaths = getStoragePaths();
      repl = new CliRepl({
        shellCliOptions: {
          ...options,
        },
        mongocryptdSpawnPaths,
        input: process.stdin,
        output: process.stdout,
        onExit: process.exit,
        shellHomePaths: shellHomePaths
      });
      await repl.start(driverUri, { appName, ...driverOptions });
    }
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
    if (repl !== undefined) {
      repl.bus.emit('mongosh:error', e);
    }
    process.exit(1);
  }
})();
