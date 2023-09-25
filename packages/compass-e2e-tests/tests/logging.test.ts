import { expect } from 'chai';
import { beforeTests, afterTests } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry, LogEntry } from '../helpers/telemetry';

describe('Logging and Telemetry integration', function () {
  describe('after running an example path through Compass', function () {
    let logs: LogEntry[];
    let telemetry: Telemetry;

    before(async function () {
      telemetry = await startTelemetryServer();
      const compass = await beforeTests({ firstRun: true });
      const { browser } = compass;

      try {
        await browser.connectWithConnectionString();
        await browser.shellEval('use test');
        await browser.shellEval('db.runCommand({ connectionStatus: 1 })');
      } finally {
        await afterTests(compass);
        await telemetry.stop();
      }

      logs = compass.logs;
      expect(logs).not.to.be.undefined;
    });

    it('logs have a timestamp on all entries', function () {
      expect(logs).not.to.be.undefined;

      for (const entry of logs) {
        expect(entry.t).to.be.a('date');
      }
    });

    describe('telemetry events for the critical path', function () {
      it('uses the proper API key', function () {
        expect(telemetry.requests[0].req.headers.authorization).to.include(
          Buffer.from(`${telemetry.key}:`).toString('base64')
        );
      });

      it('tracks an event for identify call', function () {
        const identify = telemetry
          .events()
          .find((entry) => entry.type === 'identify');
        expect(identify.traits.platform).to.equal(process.platform);
        expect(identify.traits.arch).to.match(/^(x64|arm64)$/);
      });

      it('tracks an event for shell use', function () {
        const shellUse = telemetry
          .events()
          .find((entry) => entry.event === 'Shell Use');
        expect(shellUse.properties.compass_version).to.be.a('string');
      });

      it('tracks an event for shell connection', function () {
        const shellNewConnection = telemetry
          .events()
          .find((entry) => entry.event === 'Shell New Connection');
        expect(shellNewConnection.properties.is_localhost).to.equal(true);
      });

      it('tracks an event for an attempt to establish a new connection', function () {
        const connectionAttempt = telemetry
          .events()
          .find((entry) => entry.event === 'Connection Attempt');
        expect(connectionAttempt.properties.is_favorite).to.equal(false);
        expect(connectionAttempt.properties.is_recent).to.equal(false);
        expect(connectionAttempt.properties.is_new).to.equal(true);
      });

      it('tracks an event when a connection is established', function () {
        const connectionAttempt = telemetry
          .events()
          .find((entry) => entry.event === 'New Connection');
        expect(connectionAttempt.properties.is_localhost).to.equal(true);
        expect(connectionAttempt.properties.is_atlas_url).to.equal(false);
        expect(connectionAttempt.properties.is_dataLake).to.equal(false);
        expect(connectionAttempt.properties.is_enterprise).to.be.a('boolean');
        expect(connectionAttempt.properties.is_public_cloud).to.equal(false);
        expect(connectionAttempt.properties.is_do_url).to.equal(false);

        expect(connectionAttempt.properties.public_cloud_name).to.be.undefined;
        expect(connectionAttempt.properties.is_atlas).to.be.a('boolean');
        expect(connectionAttempt.properties.is_genuine).to.be.a('boolean');
        expect(connectionAttempt.properties.non_genuine_server_name).to.be.a(
          'string'
        );
        expect(connectionAttempt.properties.server_version).to.be.a('string');
        expect(connectionAttempt.properties.server_arch).to.be.a('string');
        expect(connectionAttempt.properties.server_os_family).to.be.a('string');
        expect(connectionAttempt.properties.auth_type).to.be.a('string');

        expect(connectionAttempt.properties.is_csfle).to.equal(false);
        expect(connectionAttempt.properties.has_csfle_schema).to.equal(false);
        expect(connectionAttempt.properties.has_kms_local).to.equal(false);
        expect(connectionAttempt.properties.has_kms_azure).to.equal(false);
        expect(connectionAttempt.properties.has_kms_kmip).to.equal(false);
        expect(connectionAttempt.properties.has_kms_gcp).to.equal(false);
        expect(connectionAttempt.properties.has_kms_aws).to.equal(false);
      });

      it('tracks an event for screens that were accessed', function () {
        expect(telemetry.screens()).to.include('my_queries');
      });
    });

    describe('log events for the critical path', function () {
      const criticalPathExpectedLogs = [
        {
          s: 'I',
          c: 'COMPASS-MAIN',
          id: 1_001_000_001,
          ctx: 'logging',
          msg: 'Starting logging',
          attr: (actual: any) => {
            expect(actual.version).to.be.a('string');
            expect(actual.platform).to.equal(process.platform);
            expect(actual.arch).to.match(/^(x64|arm64)$/);
          },
        },
        {
          s: 'I',
          c: 'COMPASS-MAIN',
          id: 1_001_000_125,
          ctx: 'AutoEncryption',
          msg: 'Found MongoDB Crypt library',
          attr: (actual: any) => {
            expect(actual.cryptSharedLibPath).to.be.a('string');
            expect(actual.cryptSharedLibPath).to.include('mongo_crypt_v1');
          },
        },
        {
          s: 'I',
          c: 'COMPASS-APP',
          ctx: 'Main Window',
          id: 1_001_000_092,
          msg: 'Rendering app container',
          attr: {
            autoConnectEnabled: false,
          },
        },
        {
          s: 'I',
          c: 'COMPASS-TELEMETRY',
          id: 1_001_000_094,
          ctx: 'Telemetry',
          msg: 'Enabling Telemetry reporting',
        },
        {
          s: 'I',
          c: 'COMPASS-TELEMETRY',
          id: 1_001_000_093,
          ctx: 'Telemetry',
          msg: 'Loading telemetry config',
          attr: (actual: any) => {
            expect(actual.telemetryCapableEnvironment).to.equal(true);
            expect(actual.hasAnalytics).to.equal(true);
            expect(actual.currentUserId).to.not.exist;
            expect(actual.telemetryAnonymousId).to.be.a('string');
            expect(actual.state).to.equal('enabled');
          },
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
          attr: (actual: any) => {
            expect(actual.url).to.match(/^mongodb:\/\/localhost:27091/);
            expect(actual.csfle).to.equal(null);
          },
        },
        {
          s: 'I',
          c: 'DEVTOOLS-CONNECT',
          id: 1_000_000_042,
          ctx: 'compass-connect',
          msg: 'Initiating connection attempt',
          attr: (actual: any) => {
            expect(actual.uri).to.match(/^mongodb:\/\/localhost:27091/);
            expect(actual.driver.name).to.equal('nodejs');
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
            newType: 'Unknown',
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
            address: 'localhost:27091',
          },
        },
        {
          s: 'I',
          c: 'COMPASS-DATA-SERVICE',
          id: 1_001_000_018,
          ctx: 'Connection 0',
          msg: 'Server description changed',
          attr: {
            address: '127.0.0.1:27091',
            error: null,
            newType: 'RSPrimary',
            previousType: 'Unknown',
          },
        },
        {
          s: 'I',
          c: 'COMPASS-DATA-SERVICE',
          id: 1_001_000_021,
          ctx: 'Connection 0',
          msg: 'Topology description changed',
          attr: (actual: any) => {
            expect(actual.isMongos).to.be.a('boolean');
            expect(actual.isWritable).to.be.a('boolean');
            expect(actual.newType).to.be.a('string');
            expect(actual.previousType).to.equal('Unknown');
          },
        },
        {
          s: 'I',
          c: 'DEVTOOLS-CONNECT',
          id: 1_000_000_037,
          ctx: 'compass-connect',
          msg: 'Connection attempt finished',
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
          msg: 'Running instance',
          attr: (actual: any) => {
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
            input: 'db.runCommand({ connectionStatus: 1 })',
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

      let criticalPathActualLogs: LogEntry[];
      const testedIndexes = new Set();

      // eslint-disable-next-line mocha/no-hooks-for-single-case
      before(function () {
        criticalPathActualLogs = logs.filter((entry) => {
          // Remove most mongosh entries as they are quite noisy
          if (
            entry.c.startsWith('MONGOSH') &&
            entry.attr &&
            entry.attr.input &&
            entry.attr.input.includes('typeof prompt')
          ) {
            return false;
          }

          return true;
        });
      });

      // eslint-disable-next-line mocha/no-setup-in-describe
      criticalPathExpectedLogs.forEach((expected, i) => {
        // Adding a number because some of the expected messages are duplicates,
        // resulting in duplicate test names.
        it(`logs "${expected.msg}" (${i})`, function () {
          const actualLogIndex = criticalPathActualLogs.findIndex(
            ({ id }, index) => id === expected.id && !testedIndexes.has(index)
          );
          if (actualLogIndex < 0) {
            throw new Error(
              `No actual log found for expected ${JSON.stringify(expected)}`
            );
          }

          testedIndexes.add(actualLogIndex);
          const { attr: expectedAttr, ...expectedWithoutAttr } = expected;
          const { attr: actualAttr, ...actualWithoutAttr } =
            criticalPathActualLogs[actualLogIndex];

          // Timestamps vary between each execution
          delete actualWithoutAttr.t;

          expect(actualWithoutAttr).to.deep.equal(expectedWithoutAttr);

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
            expect(actualAttr).to.deep.equal(expectedAttr);
          }
        });
      });

      it('does not contain warnings about missing optional dependencies', function () {
        const ids = logs
          // TODO(MONGOSH-1594): Remove this filter after the next mongosh upgrade,
          // this error comes from the devtools-connect bundled in mongosh
          .filter(
            ({ ctx, attr }) =>
              !(ctx === 'mongosh-deps' && attr.name === 'saslprep')
          )
          .map(({ id }) => id);
        expect(ids).not.to.contain(
          1_000_000_041,
          `Expected log to not contain warnings about missing dependencies, but got ${JSON.stringify(
            logs.find((log) => log.id === 1_000_000_041)
          )}`
        );
      });
    });
  });

  describe('on subsequent run', function () {
    let compass: Compass;
    let telemetry: Telemetry;

    before(async function () {
      telemetry = await startTelemetryServer();
      compass = await beforeTests();
    });

    after(async function name() {
      await afterTests(compass);
      await telemetry.stop();
    });

    it('tracks an event for identify call', function () {
      const identify = telemetry
        .events()
        .find((entry) => entry.type === 'identify');
      expect(identify.traits.platform).to.equal(process.platform);
      expect(identify.traits.arch).to.match(/^(x64|arm64)$/);
    });
  });

  describe('Uncaught exceptions', function () {
    let compass: Compass;

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
      // clean up if it failed during the before hook
      await afterTests(compass, this.currentTest);
    });

    it('provides logging information for uncaught exceptions', function () {
      const uncaughtEntry = compass.logs.find(
        (entry) => entry.id === 1_001_000_002
      );

      expect(uncaughtEntry).to.exist;

      if (!uncaughtEntry) {
        // making ts happy
        return;
      }

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
