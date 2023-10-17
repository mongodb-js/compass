// THIS IMPORT SHOULD ALWAYS BE THE FIRST ONE FOR THE APPLICATION ENTRY POINT
import '../setup-hadron-distribution';

import { app, dialog, crashReporter } from 'electron';
import { handleUncaughtException } from './handle-uncaught-exception';
import { initialize as initializeElectronRemote } from '@electron/remote/main';
import {
  doImportConnections,
  doExportConnections,
} from './import-export-connections';
import {
  parseAndValidateGlobalPreferences,
  getHelpText,
  getExampleConfigFile,
} from 'compass-preferences-model';
import chalk from 'chalk';
import { installEarlyLoggingListener } from './logging';
import { installEarlyOpenUrlListener } from './window-manager';

crashReporter.start({ uploadToServer: false });

initializeElectronRemote();
installEarlyLoggingListener();
installEarlyOpenUrlListener();

process.title = `${app.getName()} ${app.getVersion()}`;

void main();

async function main(): Promise<void> {
  const globalPreferences = await parseAndValidateGlobalPreferences();

  // These are expected to go away at some point.
  for (const [envvar, preference, preferenceValue] of [
    ['HADRON_ISOLATED', 'networkTraffic', false],
    ['HADRON_READONLY', 'readOnly', true],
  ] as const) {
    if (process.env[envvar] === 'true') {
      globalPreferences.hardcoded = {
        ...globalPreferences.hardcoded,
        [preference]: preferenceValue,
      };
    }
  }

  const { preferenceParseErrors } = globalPreferences;
  const preferences = {
    ...globalPreferences.cli,
    ...globalPreferences.global,
    ...globalPreferences.hardcoded,
  };
  const preferenceParseErrorsString = preferenceParseErrors.join('\n');
  if (preferences.version) {
    process.stdout.write(`${app.getName()} ${app.getVersion()}\n`);
    return app.exit(0);
  }

  if (preferences.help) {
    process.stdout.write(getHelpText());
    return app.exit(0);
  }

  if (preferences.showExampleConfig) {
    process.stdout.write(getExampleConfigFile());
    return app.exit(0);
  }

  if (preferenceParseErrors.length > 0) {
    process.stderr.write(chalk.yellow(preferenceParseErrorsString) + '\n');
    process.stderr.write(
      'Use --ignore-additional-command-line-flags to allow passing additional options to Chromium/Electron\n'
    );
  }
  const errorOutDueToAdditionalCommandLineFlags =
    preferenceParseErrors.length > 0 &&
    !preferences.ignoreAdditionalCommandLineFlags;

  const importExportOptions = {
    exportConnections: preferences.exportConnections,
    importConnections: preferences.importConnections,
    passphrase: preferences.passphrase,
    removeSecrets: !!preferences.protectConnectionStrings,
    trackingProps: { context: 'CLI' },
  };

  const { CompassApplication } = await import('./application');

  const doImportExport =
    importExportOptions.exportConnections ||
    importExportOptions.importConnections;
  const mode = doImportExport ? 'CLI' : 'GUI';
  if (mode === 'GUI') {
    if (errorOutDueToAdditionalCommandLineFlags) {
      dialog.showErrorBox(
        'Errors while parsing Compass preferences',
        preferenceParseErrorsString
      );
      return app.exit(1);
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('uncaughtException', handleUncaughtException);
  } else {
    if (errorOutDueToAdditionalCommandLineFlags) {
      return app.exit(1);
    }
    process.on('uncaughtException', (err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      CompassApplication.runExitHandlers().finally(() => app.exit(1));
    });
  }

  try {
    await CompassApplication.init(mode, globalPreferences);
  } catch (e) {
    await handleUncaughtException(e as Error);
    await CompassApplication.runExitHandlers().finally(() => app.exit(1));
    return;
  }

  if (mode === 'CLI') {
    let exitCode = 0;
    try {
      if (
        importExportOptions.exportConnections &&
        importExportOptions.importConnections
      ) {
        throw new Error(
          'Cannot specify both --export-connections and --import-connections'
        );
      }
      if (
        !importExportOptions.exportConnections &&
        !importExportOptions.importConnections &&
        importExportOptions.passphrase
      ) {
        throw new Error(
          'Cannot specify --passphrase without --export-connections or --import-connections'
        );
      }

      if (importExportOptions.exportConnections) {
        await doExportConnections(
          importExportOptions.exportConnections,
          importExportOptions
        );
      }
      if (importExportOptions.importConnections) {
        await doImportConnections(
          importExportOptions.importConnections,
          importExportOptions
        );
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to perform operation', err?.messsage ?? err);
      exitCode = 1;
    } finally {
      await CompassApplication.runExitHandlers();
    }
    app.exit(exitCode);
  }
}
