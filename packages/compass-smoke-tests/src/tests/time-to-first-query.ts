import { execute } from '../execute';

type RunE2ETestOptions = {
  appName: string;
  appPath: string;
};

export function testTimeToFirstQuery({ appName, appPath }: RunE2ETestOptions) {
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
}
