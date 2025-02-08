import {
  init,
  cleanup,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * @securityTest Enhanced Network Isolation Tests
 *
 * Compass allows users to specify that the application should not perform any
 * network calls that are not necessary for interacting with MongoDB clusters,
 * partially because users may consider this deployment more more secure, even
 * if it comes with a reduced feature set.
 * We ensure that no such network calls happen when this setting is enabled.
 */
describe('networkTraffic: false / Isolated Edition', function () {
  let tmpdir: string;
  let i = 0;

  before(function () {
    console.log('an early before in our test of choice');
    skipForWeb(this, 'cli params not available in compass-web');

    if (process.platform !== 'linux') {
      // No strace on other platforms
      // return this.skip();
    }
  });

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      `compass-no-network-traffic-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await fs.rmdir(tmpdir, { recursive: true });
  });

  it('does not attempt to perform network I/O', async function () {
    // This is a bit of an oddball test. On Linux, we run Compass under strace(1),
    // tracing all connect(2) calls made by Compass and its child processes.
    // We expect a connection to the database, but otherwise no outgoing network I/O.

    const outfile = path.join(tmpdir, 'strace-out.log');
    async function wrapBinary(binary: string): Promise<string> {
      const wrapperFile = path.join(tmpdir, 'wrap.sh');
      let str;
      if (process.platform === 'linux') {
        str = `#!/bin/bash\nulimit -c 0; exec strace -f -e connect -qqq -o '${outfile}' '${binary}' "$@"\n`;
      } else {
        str = `#!/bin/bash\nulimit -c 0;  '${binary}' "$@"\n`;
      }
      console.log('contents of wrapped file will be ', str);
      await fs.writeFile(wrapperFile, str);
      await fs.chmod(wrapperFile, 0o755);
      return wrapperFile;
    }

    console.log('process pid inside no network test: ', process.pid);
    const compass = await init(this.test?.fullTitle(), {
      extraSpawnArgs: ['--no-network-traffic'],
      wrapBinary,
      // TODO(COMPASS-8166): firstRun: true seems to result in network traffic.
      // Probably the welcome modal.
      firstRun: true,
    });
    const browser = compass.browser;

    console.log('set up default connections...');
    await browser.setupDefaultConnections();

    {
      // TODO: Remove this once we are including https://github.com/mongodb-js/mongosh/pull/1349
      const exitOnDisconnectFile = path.join(tmpdir, 'exitOnDisconnect.js');
      await fs.writeFile(
        exitOnDisconnectFile,
        'process.once("disconnect", () => {})'
      );
      console.log('browser.execute...');
      await browser.execute((exitOnDisconnectFile) => {
        process.env.NODE_OPTIONS ??= '';
        process.env.NODE_OPTIONS += ` --require "${exitOnDisconnectFile}"`;
      }, exitOnDisconnectFile);
    }

    try {
      console.log('connect to defaults...');
      await browser.connectToDefaults();
    } finally {
      await cleanup(compass);
    }

    if (process.platform !== 'linux') {
      return;
    }

    const straceLog = await fs.readFile(outfile, 'utf8');
    const connectCalls = straceLog.matchAll(/\bconnect\s*\((?<args>.*)\) =/g);
    const connectTargets = new Set<string>();
    for (const { groups } of connectCalls) {
      const args = groups!.args;
      // Possible format for the address argument in 'args':
      // sa_family=AF_UNIX, sun_path="/var/run/nscd/socket"
      // sa_family=AF_INET, sin_port=htons(0), sin_addr=inet_addr("127.0.0.1")
      // sa_family=AF_INET6, sin6_port=htons(80), sin6_flowinfo=htonl(0), inet_pton(AF_INET6, "2606:2800:220:1:248:1893:25c8:1946", &sin6_addr), sin6_scope_id=0
      if (!args.includes('AF_INET')) continue;
      const match = args.match(
        /sa_family=AF_INET6?.*sin6?_port=htons\((?<port>\d+)\).*inet_(addr\("(?<ipv4>[^"]+)"\)|pton\(AF_INET6,\s*"(?<ipv6>[^"]+)")/
      )?.groups;
      if (!match) {
        throw new Error(`Unknown traced connect() target: ${args}`);
      }
      connectTargets.add(
        match.ipv4
          ? `${match.ipv4}:${match.port}`
          : `[${match.ipv6}]:${match.port}`
      );
    }

    const unexpectedHosts = [...connectTargets].filter(
      (target) => !/^127.0.0.1:|^\[::1\]:/.test(target)
    );
    if (unexpectedHosts.length > 0) {
      throw new Error(`Connected to unexpected host! ${[...unexpectedHosts]}`);
    }
    if (![...connectTargets].some((target) => /:27091$/.test(target))) {
      throw new Error(
        `Missed connection to database server in connect trace! ${[
          ...connectTargets,
        ]}`
      );
    }
  });
});
