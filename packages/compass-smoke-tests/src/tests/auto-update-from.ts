import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDebug from 'debug';
import { type SmokeTestsContext } from '../context';
import { getInstaller } from '../installers';
import { createSandbox } from '../directories';
import { getTestSubject } from '../test-subject';
import { executeAsync } from '../execute';
import { startAutoUpdateServer } from './update-server';

const debug = createDebug('compass:smoketests:auto-update-from');

export async function testAutoUpdateFrom(context: SmokeTestsContext) {
  const sandboxPath = createSandbox();
  const { kind, appName, filepath, autoUpdatable } = await getTestSubject({
    ...context,
    sandboxPath,
  });

  try {
    const install = getInstaller(kind);

    const { appPath, uninstall } = install({
      appName,
      filepath,
      destinationPath: sandboxPath,
    });

    try {
      process.env.PORT = '0'; // dynamic port
      process.env.UPDATE_CHECKER_ALLOW_DOWNGRADES = 'true';

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
              TEST_NAME: 'auto-update-from',
              COMPASS_APP_NAME: appName,
              COMPASS_APP_PATH: appPath,
            },
          }
        );
      } finally {
        debug('Stopping auto-update server');
        server.close();
        delete process.env.UPDATE_CHECKER_ALLOW_DOWNGRADES;
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
