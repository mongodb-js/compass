import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDebug from 'debug';
import { type SmokeTestsContext } from '../context';
import { getInstaller } from '../installers';
import { createSandbox } from '../directories';
import { getTestSubjectDetails } from '../test-subject';
import { executeAsync } from '../execute';
import { getLatestRelease, getLatestReleaseKindByKind } from '../releases';
import { startAutoUpdateServer } from './update-server';

const debug = createDebug('compass:smoketests:auto-update-to');

export async function testAutoUpdateTo(context: SmokeTestsContext) {
  assert(
    context.bucketKeyPrefix !== undefined,
    'Bucket key prefix is needed to download'
  );

  const sandboxPath = createSandbox();
  const subject = getTestSubjectDetails({ ...context, sandboxPath });
  const {
    kind,
    autoUpdatable,
    buildInfo: { channel, version },
  } = subject;

  try {
    const install = getInstaller(getLatestReleaseKindByKind(kind));
    const filepath = await getLatestRelease(
      channel,
      context.arch,
      kind,
      context.forceDownload
    );

    const { appPath, appName, uninstall } = install({
      ...subject,
      filepath,
      sandboxPath,
    });

    try {
      process.env.PORT = '0'; // dynamic port

      if (channel === 'dev') {
        process.env.DEV_RELEASE = JSON.stringify({
          version: version,
          bucket_key_prefix: context.bucketKeyPrefix,
        });
      } else {
        process.env.PUBLISHED_RELEASES = JSON.stringify({
          name: version,
          body: version,
          bucket_key_prefix: context.bucketKeyPrefix,
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
              EXPECTED_UPDATE_VERSION: version,
              COMPASS_APP_NAME: appName,
              COMPASS_APP_PATH: appPath,
            },
          }
        );
      } finally {
        debug('Stopping auto-update server');
        server.close();
        delete process.env.DEV_RELEASE;
        delete process.env.PUBLISHED_RELEASES;
      }
    } finally {
      await uninstall();
    }
  } finally {
    if (context.skipCleanup) {
      debug(`Skipped cleaning up sandbox: ${sandboxPath}`);
    } else {
      debug(`Cleaning up sandbox: ${sandboxPath}`);
      fs.rmSync(sandboxPath, { recursive: true });
    }
  }
}
