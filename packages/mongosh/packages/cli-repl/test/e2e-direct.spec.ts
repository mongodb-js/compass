import { startTestCluster } from '../../../testing/integration-testing-hooks';
import { eventually } from './helpers';
import { expect } from 'chai';
import { TestShell } from './test-shell';

describe('e2e direct connection', () => {
  afterEach(TestShell.cleanup);

  context('to a replica set', async() => {
    const replSetId = 'replset';
    const [rs0, rs1, rs2] = startTestCluster(
      ['--single', '--replSet', replSetId],
      ['--single', '--replSet', replSetId],
      ['--single', '--replSet', replSetId]
    );

    [
      { server: rs0, name: 'rs0' },
      { server: rs1, name: 'rs1' },
      { server: rs2, name: 'rs2' }
    ].forEach(({ server, name }) => {
      it(`works when connecting to node ${name} of uninitialized set`, async() => {
        const shell = TestShell.start({ args: [await server.connectionString()] });
        await shell.waitForPrompt();
        await shell.executeLine('db.isMaster()');
        shell.assertContainsOutput('ismaster: false');
        shell.assertNotContainsOutput(`setName: '${replSetId}'`);
      });
    });

    context('after rs.initiate()', () => {
      let dbname: string;

      before(async() => {
        const replSetConfig = {
          _id: replSetId,
          version: 1,
          members: [
            { _id: 0, host: await rs0.hostport(), priority: 1 },
            { _id: 1, host: await rs1.hostport(), priority: 0 },
            { _id: 2, host: await rs2.hostport(), priority: 0 },
          ]
        };

        const shell = TestShell.start({ args: [await rs0.connectionString()] });
        await shell.waitForPrompt();
        await shell.executeLine(`rs.initiate(${JSON.stringify(replSetConfig)})`);
        shell.assertContainsOutput('ok: 1');
        await eventually(async() => {
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: true');
          shell.assertContainsOutput(`me: '${await rs0.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });
        dbname = `test-${Date.now()}-${(Math.random() * 100000) | 0}`;
        await shell.executeLine(`use ${dbname}`);
        await shell.executeLine('db.testcollection.insertOne({})');
        shell.writeInputLine('exit');
      });
      after(async() => {
        const shell = TestShell.start({ args: [await rs0.connectionString()] });
        await shell.executeLine(`db.getSiblingDB("${dbname}").dropDatabase()`);
        shell.writeInputLine('exit');
      });

      context('connecting to secondary members directly', () => {
        it('works when specifying a connection string', async() => {
          const shell = TestShell.start({ args: [await rs1.connectionString()] });
          await shell.waitForPrompt();
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: false');
          shell.assertContainsOutput(`me: '${await rs1.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });

        it('works when specifying just host and port', async() => {
          const shell = TestShell.start({ args: [await rs1.hostport()] });
          await shell.waitForPrompt();
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: false');
          shell.assertContainsOutput(`me: '${await rs1.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });

        it('fails to list collections without explicit readPreference', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}`] });
          await shell.waitForPrompt();
          await shell.executeLine('use admin');
          await shell.executeLine('db.runCommand({ listCollections: 1 })');
          shell.assertContainsError('MongoError: not master');
        });

        it('lists collections when readPreference is in the connection string', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}?readPreference=secondaryPreferred`] });
          await shell.waitForPrompt();
          await shell.executeLine('use admin');
          await shell.executeLine('db.runCommand({ listCollections: 1 })');
          shell.assertContainsOutput("name: 'system.version'");
        });

        it('lists collections when readPreference is set via Mongo', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}`] });
          await shell.waitForPrompt();
          await shell.executeLine('use admin');
          await shell.executeLine('db.getMongo().setReadPref("secondaryPreferred")');
          await shell.executeLine('db.runCommand({ listCollections: 1 })');
          shell.assertContainsOutput("name: 'system.version'");
        });

        it('lists collections and dbs using show by default', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}`] });
          await shell.waitForPrompt();
          await shell.executeLine('use admin');
          expect(await shell.executeLine('show collections')).to.include('system.version');
          expect(await shell.executeLine('show dbs')).to.include('admin');
        });
        it('autocompletes collection names', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}/${dbname}`], forceTerminal: true });
          await shell.waitForPrompt();
          shell.writeInput('db.testc\u0009\u0009');
          await eventually(() => {
            shell.assertContainsOutput('db.testcollection');
          });
        });
      });

      context('connecting to primary', () => {
        it('when specifying replicaSet', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}?replicaSet=${replSetId}`] });
          await shell.waitForPrompt();
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: true');
          shell.assertContainsOutput(`me: '${await rs0.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });
        it('when setting directConnection to false', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}?directConnection=false`] });
          await shell.waitForPrompt();
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: true');
          shell.assertContainsOutput(`me: '${await rs0.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });
        it('when specifying multiple seeds', async() => {
          const connectionString = 'mongodb://' + await rs2.hostport() + ',' + await rs1.hostport() + ',' + await rs0.hostport();
          const shell = TestShell.start({ args: [connectionString] });
          await shell.waitForPrompt();
          await shell.executeLine('db.isMaster()');
          shell.assertContainsOutput('ismaster: true');
          shell.assertContainsOutput(`me: '${await rs0.hostport()}'`);
          shell.assertContainsOutput(`setName: '${replSetId}'`);
        });

        it('lists collections and dbs using show by default', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}`] });
          await shell.waitForPrompt();
          await shell.executeLine('use admin');
          expect(await shell.executeLine('show collections')).to.include('system.version');
          expect(await shell.executeLine('show dbs')).to.include('admin');
        });
        it('autocompletes collection names', async() => {
          const shell = TestShell.start({ args: [`${await rs1.connectionString()}/${dbname}`], forceTerminal: true });
          await shell.waitForPrompt();
          shell.writeInput('db.testc\u0009\u0009');
          await eventually(() => {
            shell.assertContainsOutput('db.testcollection');
          });
        });
      });
    });
  });
});
