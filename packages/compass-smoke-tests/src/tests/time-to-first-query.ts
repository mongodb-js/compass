import createDebug from 'debug';
import { type SmokeTestsContext } from '../context';
import { execute } from '../execute';
import { getInstaller } from '../installers';
import { createSandbox } from '../directories';
import { getTestSubject } from '../test-subject';

const debug = createDebug('compass:smoketests:time-to-first-query');

export async function testTimeToFirstQuery(context: SmokeTestsContext) {
  const sandboxPath = createSandbox();
  const subject = await getTestSubject({
    ...context,
    sandboxPath,
  });
  const { kind } = subject;

  const install = getInstaller(kind);

  debug('Installing');
  const { appPath, appName, uninstall } = install({
    ...subject,
    sandboxPath,
  });

  try {
    debug('Executing');
    execute(
      'npm',
      [
        'run',
        '--unsafe-perm',
        'test-packaged',
        '--workspace',
        'compass-e2e-tests',
        '--',
        '--test-filter=time-to-first-query',
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
    debug('Uninstalling');
    await uninstall();
  }
}
