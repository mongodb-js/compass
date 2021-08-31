import createTestEnvs from '@mongodb-js/devtools-docker-test-envs';
import assert from 'assert';
import util from 'util';
import connect from '../src/connect';
import { ConnectionOptions } from '../src/connection-options';
import DataService from '../src/data-service';

const envs = createTestEnvs(['community']);

async function connectAndGetConnectionStatus(
  connectionOptions: ConnectionOptions
) {
  let dataService: DataService | undefined;

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

describe('connectivity integration tests', function () {
  let environmentsStarted = false;

  before(async function () {
    if (
      (process.platform !== 'linux' &&
        !process.env.COMPASS_RUN_CONNECTIVITY_TESTS) ||
      process.env.EVERGREEN_BUILD_VARIANT === 'rhel'
    ) {
      return this.skip();
    }

    console.log('setting up testing environments ...');
    await envs.setup();
    environmentsStarted = true;
    console.log('done.');
  });

  after(async function () {
    if (!environmentsStarted) {
      return;
    }

    console.log('tearing down testing environments ...');
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
