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
