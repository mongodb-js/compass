import { beforeTests, afterTests } from '../helpers/compass';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('networkTraffic: false / Isolated Edition', function () {
  let tmpdir: string;
  let i = 0;

  before(function () {
    if (process.platform !== 'linux') {
      // No strace on other platforms
      return this.skip();
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
    await fs.rmdir(tmpdir, { recursive: true });
  });

  it('does not attempt to perform network I/O', async function () {
    // This is a bit of an oddball test. On Linux, we run Compass under strace(1),
    // tracing all connect(2) calls made by Compass and its child processes.
    // We expect a connection to the database, but otherwise no outgoing network I/O.

    const outfile = path.join(tmpdir, 'strace-out.log');
    async function wrapBinary(binary: string): Promise<string> {
      const wrapperFile = path.join(tmpdir, 'wrap.sh');
      await fs.writeFile(
        wrapperFile,
        `#!/bin/bash\nulimit -c 0; exec strace -f -e connect -qqq -o '${outfile}' '${binary}' "$@"\n`
      );
      await fs.chmod(wrapperFile, 0o755);
      return wrapperFile;
    }

    const compass = await beforeTests({
      extraSpawnArgs: ['--no-network-traffic'],
      wrapBinary,
    });
    const browser = compass.browser;

    {
      // TODO: Remove this once we are including https://github.com/mongodb-js/mongosh/pull/1349
      const exitOnDisconnectFile = path.join(tmpdir, 'exitOnDisconnect.js');
      await fs.writeFile(
        exitOnDisconnectFile,
        'process.once("disconnect", () => process.exit())'
      );
      await browser.execute((exitOnDisconnectFile) => {
        process.env.NODE_OPTIONS ??= '';
        process.env.NODE_OPTIONS += ` --require "${exitOnDisconnectFile}"`;
      }, exitOnDisconnectFile);
    }

    try {
      await browser.connectWithConnectionString();
    } finally {
      await afterTests(compass, this.currentTest);
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

    if (
      [...connectTargets].some(
        (target) => !/^127.0.0.1:|^\[::1\]:/.test(target)
      )
    ) {
      throw new Error(`Connected to unexpected host! ${[...connectTargets]}`);
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
