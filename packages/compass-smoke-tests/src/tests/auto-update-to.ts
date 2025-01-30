import assert from 'node:assert/strict';
import { executeAsync } from '../execute';
import { startAutoUpdateServer } from './update-server';
import { type Channel } from '../build-info';

type RunUpdateToTestOptions = {
  appName: string;
  appPath: string;
  autoUpdatable?: boolean;
  bucketKeyPrefix: string;
  version: string;
  channel: Channel;
};

export async function testAutoUpdateTo({
  appName,
  appPath,
  autoUpdatable,
  channel,
  version,
  bucketKeyPrefix,
}: RunUpdateToTestOptions) {
  process.env.PORT = '0'; // dynamic port

  if (channel === 'dev') {
    process.env.DEV_RELEASE = JSON.stringify({
      version: version,
      bucket_key_prefix: bucketKeyPrefix,
    });
  } else {
    process.env.PUBLISHED_RELEASES = JSON.stringify({
      name: version,
      body: version,
      bucket_key_prefix: bucketKeyPrefix,
    });
  }

  const server = await startAutoUpdateServer();

  const address = server.address();
  assert(typeof address === 'object' && address !== null);
  const port = address.port;
  const HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE = `http://localhost:${port}`;

  try {
    // must be async because the update server is running in the same process
    await executeAsync(
      'npm',
      [
        'run',
        '--unsafe-perm',
        'test-packaged',
        '--workspace',
        'compass-e2e-tests',
        '--',
        '--test-filter=auto-update',
      ],
      {
        // We need to use a shell to get environment variables setup correctly
        shell: true,
        env: {
          ...process.env,
          HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE,
          AUTO_UPDATE_UPDATABLE: (!!autoUpdatable).toString(),
          TEST_NAME: 'auto-update-to',
          COMPASS_APP_NAME: appName,
          COMPASS_APP_PATH: appPath,
        },
      }
    );
  } finally {
    console.log('Stopping auto-update server');
    server.close();
    delete process.env.DEV_RELEASE;
    delete process.env.PUBLISHED_RELEASES;
  }
}
