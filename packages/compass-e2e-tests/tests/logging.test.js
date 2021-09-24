// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests } = require('../helpers/compass');

function cleanLog(log) {
  log = JSON.parse(
    JSON.stringify(log).replace(
      /(MongoDB( |\+|%20)Compass)(( |\+|%20)\w+)+/g,
      '$1'
    )
  );
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    expect(entry.t.$date).to.be.a('string');
    delete entry.t; // Timestamps vary between each execution

    if (entry.id === 1_001_000_001) {
      expect(entry.attr.version).to.be.a('string');
      expect(entry.attr.platform).to.equal(process.platform);
      expect(entry.attr.arch).to.equal(process.arch);
      delete entry.attr;
    }
    if (entry.id === 1_001_000_002) {
      entry.attr.stack = entry.attr.stack
        .replace(/file:\/\/\/.+:\d+:\d+/g, '<filename>')
        .split('\n')
        .slice(0, 2)
        .join('\n');
    }
    // Remove server heartbeat logs as they can happen a varying amount of
    // times depending on how long tests are taking.
    if (entry.id === 1_001_000_022 || entry.id === 1_001_000_023) {
      log.splice(i--, 1);
      continue;
    }
    // Remove most mongosh entries as they are quite noisy
    if (
      entry.c.startsWith('MONGOSH') &&
      (entry.id !== 1_000_000_007 || entry.attr.input.includes('typeof prompt'))
    ) {
      log.splice(i--, 1);
      continue;
    }
    // Remove command monitoring entries as they are also quite noisy
    if (entry.id === 1_001_000_029 || entry.id === 1_001_000_030) {
      log.splice(i--, 1);
      continue;
    }
  }
  return log;
}

describe('Logging integration', function () {
  this.timeout(1000 * 60 * 1);

  let compass;

  it('provides some basic logging information', async function () {
    compass = await beforeTests();

    await compass.client.connectWithConnectionString(
      'mongodb://localhost:27018/test'
    );

    await compass.client.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );

    await afterTests(compass);

    const cleanedLog = cleanLog(compass.compassLog);
    const driverVersion = cleanedLog.find((e) => e.id === 1_001_000_012).attr
      .driver.version;
    const { serverVersion, featureCompatibilityVersion } = cleanedLog.find(
      (e) => e.id === 1_001_000_024
    ).attr;

    expect(cleanedLog).to.deep.equal([
      {
        s: 'I',
        c: 'COMPASS-MAIN',
        id: 1_001_000_001,
        ctx: 'logging',
        msg: 'Starting logging',
      },
      {
        s: 'I',
        c: 'COMPASS-APP',
        ctx: 'Main Window',
        id: 1_001_000_092,
        msg: 'Rendering app container',
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT-UI',
        id: 1_001_000_004,
        ctx: 'Connection UI',
        msg: 'Initiating connection attempt',
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_014,
        ctx: 'Connection 0',
        msg: 'Connecting',
        attr: {
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1_001_000_009,
        ctx: 'Connect',
        msg: 'Initiating connection',
        attr: {
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
          options: { readPreference: 'primary', monitorCommands: true },
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1_001_000_010,
        ctx: 'Connect',
        msg: 'Resolved SRV record',
        attr: {
          from: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
          to: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_021,
        ctx: 'Connection 0',
        msg: 'Topology description changed',
        attr: {
          isMongos: false,
          isWritable: false,
          newType: 'Single',
          previousType: 'Unknown',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_019,
        ctx: 'Connection 0',
        msg: 'Server opening',
        attr: {
          address: 'localhost:27018',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_018,
        ctx: 'Connection 0',
        msg: 'Server description changed',
        attr: {
          address: 'localhost:27018',
          error: null,
          newType: 'Standalone',
          previousType: 'Unknown',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        ctx: 'Connection 0',
        id: 1_001_000_021,
        msg: 'Topology description changed',
        attr: {
          isMongos: false,
          isWritable: true,
          newType: 'Single',
          previousType: 'Single',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1_001_000_012,
        ctx: 'Connect',
        msg: 'Connection established',
        attr: {
          driver: { name: 'nodejs', version: driverVersion },
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_015,
        ctx: 'Connection 0',
        msg: 'Connected',
        attr: {
          isMongos: false,
          isWritable: true,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1_001_000_024,
        ctx: 'Connection 0',
        msg: 'Fetched instance information',
        attr: {
          dataLake: { isDataLake: false, version: null },
          featureCompatibilityVersion,
          genuineMongoDB: { dbType: 'mongodb', isGenuine: true },
          serverVersion,
        },
      },
      {
        s: 'I',
        c: 'MONGOSH',
        id: 1000000007,
        ctx: 'repl',
        msg: 'Evaluating input',
        attr: {
          input: 'JSON.stringify(db.runCommand({ connectionStatus: 1 }))',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-MAIN',
        id: 1_001_000_003,
        ctx: 'app',
        msg: 'Closing application',
      },
    ]);
  });

  it('provides logging information for uncaught exceptions', async function () {
    try {
      process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION = '1';
      compass = await beforeTests();
    } finally {
      delete process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION;
    }

    await afterTests(compass);

    const uncaughtEntry = cleanLog(compass.compassLog).find(
      (entry) => entry.id === 1_001_000_002
    );
    expect(uncaughtEntry).to.deep.equal({
      s: 'F',
      c: 'COMPASS-MAIN',
      id: 1_001_000_002,
      ctx: 'app',
      msg: 'Uncaught exception: fake exception',
      attr: {
        message: 'fake exception',
        stack: 'Error: fake exception\n' + '    at <filename>',
      },
    });
  });
});
