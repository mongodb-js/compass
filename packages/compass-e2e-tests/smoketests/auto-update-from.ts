import { execute } from '../installers/helpers';
import type { Package } from '../installers/types';

// TODO: move this since we'll use the same for testing TO
function testInstalledApp(
  pkg: Package,
  appPath: string,
  env: Record<string, string>
): Promise<void> {
  return execute(
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
      env: {
        ...process.env,
        HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE: 'http://localhost:8080',
        AUTO_UPDATE_UPDATABLE: pkg.updatable.toString(),
        COMPASS_APP_NAME: pkg.appName,
        COMPASS_APP_PATH: appPath,
        ...env,
      },
    }
  );
}

export async function testAutoUpdateFrom(pkg: Package) {
  // install the app
  console.log(`installing ${pkg.packageFilepath}`);
  const { appPath, uninstall } = await pkg.installer({
    appName: pkg.appName,
    filepath: pkg.packageFilepath,
  });

  console.log(appPath);

  try {
    await testInstalledApp(pkg, appPath, {
      AUTO_UPDATE_FROM: 'true',
    });
  } finally {
    // remove the app
    await uninstall();
  }
}
