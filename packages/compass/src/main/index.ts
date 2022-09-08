import '../setup-hadron-distribution';
import { app } from 'electron';
import { handleUncaughtException } from './handle-uncaught-exception';
import { initialize } from '@electron/remote/main';
import { doImportConnections, doExportConnections } from './import-export-connections';

initialize();

// Name and version are setup outside of Application and before anything else so
// that if uncaught exception happens we already show correct name and version
app.setName(process.env.HADRON_PRODUCT_NAME);
// For webdriverio env we are changing appName so that keychain records do not
// overlap with anything else. Only appName should be changed for the webdriverio
// environment that is running tests, all relevant paths are configured from the
// test runner.
if (process.env.APP_ENV === 'webdriverio') {
  app.setName(`${app.getName()} Webdriverio`);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error setVersion is not a public method
app.setVersion(process.env.HADRON_APP_VERSION);

const importExportOptions = {
  // TODO(COMPASS-6070): Proper command line parsing
  exportConnections: process.argv.find(s => s.startsWith('--export-connections='))?.slice(21),
  importConnections: process.argv.find(s => s.startsWith('--import-connections='))?.slice(21),
  passphrase: process.argv.find(s => s.startsWith('--passphrase='))?.slice(13),
  // TODO(COMPASS-6066): Set removeSecrets: true if protectConnectionStrings is set.
  removeSecrets: false,
  trackingProps: { context: 'CLI' },
};

void main();

async function main(): Promise<void> {
  const { CompassApplication } = await import('./application');

  const doImportExport = importExportOptions.exportConnections || importExportOptions.importConnections;
  const mode = doImportExport ? 'CLI' : 'GUI';
  if (mode === 'GUI') {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('uncaughtException', handleUncaughtException);
  } else {
    process.on('uncaughtException', (err) => {
      console.error(err);
      CompassApplication.runExitHandlers().finally(() => app.exit(1));
    });
  }

  await CompassApplication.init(mode);

  if (mode === 'CLI') {
    let exitCode = 0;
    try {
      if (importExportOptions.exportConnections && importExportOptions.importConnections) {
        throw new Error('Cannot specify both --export-connections and --import-connections');
      }
      if (!importExportOptions.exportConnections && !importExportOptions.importConnections && importExportOptions.passphrase) {
        throw new Error('Cannot specify --passphrase without --export-connections or --import-connections');
      }

      if (importExportOptions.exportConnections) {
        await doExportConnections(importExportOptions.exportConnections, importExportOptions);
      }
      if (importExportOptions.importConnections) {
        await doImportConnections(importExportOptions.importConnections, importExportOptions);
      }
    } catch (err: any) {
      console.error('Failed to perform operation', err?.messsage ?? err);
      exitCode = 1;
    } finally {
      await CompassApplication.runExitHandlers();
    }
    app.exit(exitCode);
  }
}
