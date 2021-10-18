// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests } = require('../helpers/compass');

describe('Logging integration', function () {
  describe('basic logging information', function () {
    let compassLog;

    before(async function () {
      const compass = await beforeTests();
      try {
        await compass.client.connectWithConnectionString(
          'mongodb://localhost:27018/test'
        );

        await compass.client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
      } finally {
        await afterTests(compass);
      }

      compassLog = compass.compassLog;
      expect(compassLog).not.to.be.undefined;
    });

    it('has a timestamp on all entries', function () {
      expect(compassLog).not.to.be.undefined;

      for (const entry of compassLog) {
        expect(entry.t.$date).to.be.a('string');
      }
    });

    describe('critical path', function () {
      const criticalPathExpectedLogs = [
        {
          s: 'I',
          c: 'COMPASS-MAIN',
          id: 1_001_000_001,
          ctx: 'logging',
          msg: 'Starting logging',
          attr: (actual) => {
            expect(actual.version).to.be.a('string');
            expect(actual.platform).to.equal(process.platform);
            expect(actual.arch).to.equal(process.arch);
          },
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
          attr: (actual) => {
            expect(actual.url).to.match(/^mongodb:\/\/localhost:27018/);
          },
        },
        {
          s: 'I',
          c: 'COMPASS-CONNECT',
          id: 1_001_000_010,
          ctx: 'Connect',
          msg: 'Resolved SRV record',
          attr: (actual) => {
            expect(actual.from).to.match(/^mongodb:\/\/localhost:27018/);
            expect(actual.to).to.match(/^mongodb:\/\/localhost:27018/);
          },
        },
        {
          s: 'I',
          c: 'COMPASS-CONNECT',
          id: 1_001_000_009,
          ctx: 'Connect',
          msg: 'Initiating connection',
          attr: (actual) => {
            expect(actual.url).to.match(/^mongodb:\/\/localhost:27018/);
            expect(actual.options).to.have.property('monitorCommands', true);
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
          attr: (actual) => {
            expect(actual.driver).to.not.be.undefined;
            expect(actual.driver.version).to.not.be.undefined;
            expect(actual.driver.name).to.equal('nodejs');
            expect(actual.url).to.match(/^mongodb:\/\/localhost:27018/);
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
          attr: (actual) => {
            const { dataLake, genuineMongoDB } = actual;
            expect({ dataLake, genuineMongoDB }).to.deep.equal({
              dataLake: { isDataLake: false, version: null },
              genuineMongoDB: { dbType: 'mongodb', isGenuine: true },
            });

            expect(actual.featureCompatibilityVersion).to.be.a('string');
            expect(actual.serverVersion).to.be.a('string');
          },
        },
        {
          s: 'I',
          c: 'MONGOSH',
          id: 1_000_000_007,
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
      ];

      let criticalPathActualLogs;

      // eslint-disable-next-line mocha/no-hooks-for-single-case
      before(function () {
        const criticalPathIds = new Set(
          criticalPathExpectedLogs.map((entry) => entry.id)
        );
        criticalPathActualLogs = compassLog.filter((entry) => {
          // Remove most mongosh entries as they are quite noisy
          if (
            entry.c.startsWith('MONGOSH') &&
            entry.attr &&
            entry.attr.input &&
            entry.attr.input.includes('typeof prompt')
          ) {
            return false;
          }

          return criticalPathIds.has(entry.id);
        });
      });

      // eslint-disable-next-line mocha/no-setup-in-describe
      criticalPathExpectedLogs.forEach((expected, i) => {
        it(`logs "${expected.msg}"`, function () {
          if (!criticalPathActualLogs[i]) {
            throw new Error(
              `No criticalPathActualLog for index ${i} expected ${JSON.stringify(
                expected
              )} was empty`
            );
          }

          const { attr: expectedAttr, ...expectedWithoutAttr } = expected;
          const { attr: actualAttr, ...actualWihoutAttr } =
            criticalPathActualLogs[i];

          // Timestamps vary between each execution
          delete actualWihoutAttr.t;

          expect(expectedWithoutAttr).to.deep.equal(actualWihoutAttr);

          // we already know this would fail the expectation
          if (
            actualAttr &&
            typeof expectedAttr !== 'object' &&
            typeof expectedAttr !== 'function'
          ) {
            expect(expectedAttr).to.be.an('object');
          }

          // allow to define expectations for the attribute as function
          // this way is possible to do partial assertions
          if (typeof expectedAttr === 'function') {
            expectedAttr.call(null, actualAttr);
          } else {
            expect(expectedAttr).to.deep.equal(actualAttr);
          }
        });
      });
    });
  });

  describe('Uncaught exceptions', function () {
    let compass;

    before(async function () {
      try {
        process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION = '1';
        compass = await beforeTests();
      } finally {
        delete process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION;
      }

      await afterTests(compass);
    });

    after(async function () {
      if (compass) {
        // cleanup outside of the test so that the time it takes to run does not
        // get added to the time it took to run the first query
        await afterTests(compass);
      }
    });

    it('provides logging information for uncaught exceptions', async function () {
      const uncaughtEntry = compass.compassLog.find(
        (entry) => entry.id === 1_001_000_002
      );

      uncaughtEntry.attr.stack = uncaughtEntry.attr.stack
        .replace(/file:\/\/\/.+:\d+:\d+/g, '<filename>')
        .split('\n')
        .slice(0, 2)
        .join('\n');

      delete uncaughtEntry.t;

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
});
