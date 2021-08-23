import createTestEnvs from '@mongodb-js/devtools-docker-test-envs';
import util from 'util';
import assert from 'assert';

import connect from '../src/connect';
import DataService from '../src/data-service';
import { ConnectionOptions } from '../src/connection-options';

const envs = createTestEnvs(['community']);

async function connectAndGetConnectionStatus(
  connectionOptions: ConnectionOptions
) {
  let dataService: DataService;

  try {
    dataService = await connect(connectionOptions);
    const command = util.promisify(dataService.command.bind(dataService));
    const connectionStatus = await command('admin', { connectionStatus: 1 });
    return connectionStatus;
  } finally {
    if (dataService) {
      await util.promisify(dataService.disconnect.bind(dataService))();
    }
  }
}

describe.only('connectivity integration tests', function () {
  before(async function () {
    console.log('setting up testing environments ...');
    await envs.setup();
    console.log('done.');
  });

  after(async function () {
    console.log('tearing down up testing environments ...');
    await envs.teardown();
    console.log('done.');
  });

  it('connects to a community server', async function () {
    const connectionOptions = envs.getConnectionOptions('community');
    const connectionStatus = await connectAndGetConnectionStatus(
      connectionOptions
    );
    assert.deepStrictEqual(connectionStatus, {
      authInfo: {
        authenticatedUserRoles: [],
        authenticatedUsers: [],
      },
      ok: 1,
    });
  });
});
