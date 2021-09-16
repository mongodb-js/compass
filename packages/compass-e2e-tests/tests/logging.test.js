// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests } = require('../helpers/compass');

function cleanLog(log) {
  log = JSON.parse(
    JSON.stringify(log).replace(/(MongoDB[ +]Compass)([+ ]\w+)+/g, '$1')
  );
  for (const entry of log) {
    expect(entry.t.$date).to.be.a('string');
    delete entry.t; // Timestamps vary between each execution

    if (entry.id === 1001000001) {
      expect(entry.attr.version).to.be.a('string');
      expect(entry.attr.platform).to.equal(process.platform);
      expect(entry.attr.arch).to.equal(process.arch);
      delete entry.attr;
    }
    if (entry.id === 1001000002) {
      entry.attr.stack = entry.attr.stack
        .replace(/file:\/\/\/.+:\d+:\d+/g, '<filename>')
        .split('\n')
        .slice(0, 2)
        .join('\n');
    }
    if (entry.id === 1001000022 || entry.id === 1001000023) {
      expect(entry.attr.duration).to.be.a('number');
      entry.attr.duration = 100;
    }
  }
  return log;
}

describe('Logging integration', function () {
  this.timeout(1000 * 60 * 1);

  let compass;

  it('provides some basic logging information', async function () {
    ({ compass } = await beforeTests(false));

    await compass.client.connectWithConnectionString(
      'mongodb://localhost:27018/test'
    );

    await compass.client.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );

    await afterTests({ compass });

    expect(cleanLog(compass.compassLog)).to.deep.equal([
      {
        s: 'I',
        c: 'COMPASS-MAIN',
        id: 1001000001,
        ctx: 'logging',
        msg: 'Starting logging',
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT-UI',
        id: 1001000004,
        ctx: 'Connection UI',
        msg: 'Initiating connection attempt',
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1001000014,
        ctx: 'Connection 0',
        msg: 'Connecting',
        attr: {
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1001000009,
        ctx: 'Connect',
        msg: 'Initiating connection',
        attr: {
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
          options: { readPreference: 'primary' },
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1001000010,
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
        id: 1001000021,
        ctx: 'Connection 0',
        msg: 'Topology description changed',
        attr: {
          isMongos: false,
          isWritable: false,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1001000019,
        ctx: 'Connection 0',
        msg: 'Server opening',
        attr: {
          address: 'localhost:27018',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1001000022,
        ctx: 'Connection 0',
        msg: 'Server heartbeat succeeded',
        attr: {
          connectionId: 'localhost:27018',
          duration: 100,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1001000018,
        ctx: 'Connection 0',
        msg: 'Server description changed',
        attr: {
          address: 'localhost:27018',
          error: null,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        ctx: 'Connection 0',
        id: 1001000021,
        msg: 'Topology description changed',
        attr: {
          isMongos: false,
          isWritable: true,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-CONNECT',
        id: 1001000012,
        ctx: 'Connect',
        msg: 'Connection established',
        attr: {
          url: 'mongodb://localhost:27018/test?readPreference=primary&appname=MongoDB+Compass&directConnection=true&ssl=false',
        },
      },
      {
        s: 'I',
        c: 'COMPASS-DATA-SERVICE',
        id: 1001000015,
        ctx: 'Connection 0',
        msg: 'Connected',
        attr: {
          isMongos: false,
          isWritable: true,
        },
      },
      {
        s: 'I',
        c: 'COMPASS-MAIN',
        id: 1001000003,
        ctx: 'app',
        msg: 'Closing application',
      },
    ]);
  });

  it('provides logging information for uncaught exceptions', async function () {
    try {
      process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION = '1';
      ({ compass } = await beforeTests(false));
    } finally {
      delete process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION;
    }

    await afterTests({ compass });

    const uncaughtEntry = cleanLog(compass.compassLog).find(
      (entry) => entry.id === 1001000002
    );
    expect(uncaughtEntry).to.deep.equal({
      s: 'F',
      c: 'COMPASS-MAIN',
      id: 1001000002,
      ctx: 'app',
      msg: 'Uncaught exception: fake exception',
      attr: {
        message: 'fake exception',
        stack: 'Error: fake exception\n' + '    at <filename>',
      },
    });
  });
});
