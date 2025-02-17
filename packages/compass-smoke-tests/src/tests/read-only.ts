import fs from 'node:fs';
import { type SmokeTestsContext } from '../context';
import { execute } from '../execute';
import { getInstaller } from '../installers';
import { createSandbox } from '../directories';
import { getTestSubject } from '../test-subject';

export async function testReadOnly(context: SmokeTestsContext) {
  const sandboxPath = createSandbox();
  const { kind, appName, filepath } = await getTestSubject({
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
      execute(
        'npm',
        [
          'run',
          '--unsafe-perm',
          'test-packaged',
          '--workspace',
          'compass-e2e-tests',
          '--',
          '--test-filter=read-only',
        ],
        {
          // We need to use a shell to get environment variables setup correctly
          shell: true,
          env: {
            ...process.env,
            COMPASS_APP_NAME: appName,
            COMPASS_APP_PATH: appPath,
          },
        }
      );
    } finally {
      await uninstall();
    }
  } finally {
    if (context.skipCleanup) {
      console.log(`Skipped cleaning up sandbox: ${sandboxPath}`);
    } else {
      console.log(`Cleaning up sandbox: ${sandboxPath}`);
      fs.rmSync(sandboxPath, { recursive: true });
    }
  }
}
