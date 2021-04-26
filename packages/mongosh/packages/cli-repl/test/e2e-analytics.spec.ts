import { expect } from 'chai';
import { startTestCluster } from '../../../testing/integration-testing-hooks';
import { eventually } from './helpers';
import { TestShell } from './test-shell';

describe('e2e Analytics', () => {
  const replSetName = 'replicaSet';
  const [rs0, rs1, rs2, rs3] = startTestCluster(
    [ '--single', '--replSet', replSetName ],
    [ '--single', '--replSet', replSetName ],
    [ '--single', '--replSet', replSetName ],
    [ '--single', '--replSet', replSetName ]
  );

  after(TestShell.cleanup);

  before(async() => {
    const rsConfig = {
      _id: replSetName,
      members: [
        { _id: 0, host: `${await rs0.hostport()}`, priority: 2 },
        { _id: 1, host: `${await rs1.hostport()}`, priority: 1 },
        { _id: 2, host: `${await rs2.hostport()}`, priority: 1 },
        { _id: 3, host: `${await rs3.hostport()}`, priority: 0, votes: 0, tags: { nodeType: 'ANALYTICS' } }
      ]
    };

    const shell = TestShell.start({
      args: [await rs0.connectionString()]
    });
    await shell.waitForPrompt();
    await shell.executeLine(`rs.initiate(${JSON.stringify(rsConfig)})`);
    shell.assertContainsOutput('ok: 1');
    await eventually(async() => {
      const isMaster = await shell.executeLine('db.isMaster().ismaster');
      expect(isMaster).to.contain('true');
    });
  });

  context('without readPreference', () => {
    it('a direct connection ends up at primary', async() => {
      const shell = TestShell.start({
        args: [ await rs0.connectionString() ]
      });
      await shell.waitForPrompt();

      const isMaster = await shell.executeLine('db.isMaster()');
      expect(isMaster).to.contain('ismaster: true');

      await shell.executeLine('use admin');
      const explain = await shell.executeLine('db[\'system.users\'].find().explain()');
      expect(explain).to.contain(`port: ${await rs0.port()}`);
    });
  });

  context('specifying readPreference and tags', () => {
    it('ends up at the ANALYTICS node', async() => {
      const shell = TestShell.start({
        args: [ `${await rs0.connectionString()}?replicaSet=${replSetName}&readPreference=secondary&readPreferenceTags=nodeType:ANALYTICS` ]
      });
      await shell.waitForPrompt();
      await shell.executeLine('use admin');
      const explain = await shell.executeLine('db[\'system.users\'].find().explain()');
      expect(explain).to.contain(`port: ${await rs3.port()}`);
    });
  });
});
