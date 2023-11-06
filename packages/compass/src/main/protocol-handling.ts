import preferencesAccess from 'compass-preferences-model';
import { promisify } from 'util';
import { app as electronApp } from 'electron';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { mongoLogId } from 'mongodb-log-writer';
import type { RegistryItem } from 'winreg-ts';
import { Registry } from 'winreg-ts';
const { log } = createLoggerAndTelemetry('COMPASS-MAIN');

type ProtocolsList = { name: string; schemes: string[] }[];
async function appProtocolsConfig(): Promise<ProtocolsList> {
  return (await import('../../package.json')).config.hadron.protocols;
}

const commandArgv = process.defaultApp
  ? [process.execPath, path.resolve(process.argv[1]), '--']
  : [process.execPath, '--'];

export async function setupProtocolHandlers(
  action: 'install' | 'uninstall',
  preferences = preferencesAccess,
  protocols?: ProtocolsList
): Promise<void> {
  if (action === 'install') {
    const { installURLHandlers } = await preferences.refreshPreferences();
    if (!installURLHandlers) return;
  }

  await modifyProtocolHandlers(action, protocols);

  preferences.onPreferenceValueChanged(
    'installURLHandlers',
    function (newValue) {
      void modifyProtocolHandlers(
        newValue ? 'install' : 'uninstall',
        protocols
      );
    }
  );
}

async function modifyProtocolHandlers(
  action: 'install' | 'uninstall',
  protocols?: ProtocolsList
): Promise<void> {
  log.info(
    mongoLogId(1_001_000_169),
    'Protocol handling',
    'Modifying protocol handlers',
    {
      action,
      protocols,
    }
  );

  protocols ??= await appProtocolsConfig();
  await setupWin32ProtocolHandlers(action, protocols);

  const method =
    action === 'install'
      ? 'setAsDefaultProtocolClient'
      : 'removeAsDefaultProtocolClient';
  for (const scheme of protocols.flatMap((p) => p.schemes)) {
    electronApp[method](scheme, commandArgv[0], commandArgv.slice(1));
  }
}

async function setupWin32ProtocolHandlers(
  action: 'install' | 'uninstall',
  protocols: ProtocolsList
): Promise<void> {
  if (process.platform !== 'win32') return;

  const commandString = commandArgv.map((arg) => `"${arg}"`).join(' ');

  for (const { name, scheme } of protocols.flatMap(({ name, schemes }) =>
    schemes.map((scheme) => ({ name, scheme }))
  )) {
    // Helper for handling promisified access to 'Registry'
    const R = <K extends 'set' | 'get' | 'valueExists' | 'destroy'>(
      key: string,
      method: K
    ) => {
      const registry = new Registry({ ...baseOptions, key });
      return promisify(registry[method].bind(registry));
    };

    const baseOptions = { hive: Registry.HKCU };
    const schemeKey = `\\Software\\Classes\\${scheme}`;
    const iconKey = `${schemeKey}\\DefaultIcon`;
    const openCommandKey = `${schemeKey}\\shell\\open\\command`;
    try {
      if (action === 'install') {
        await R(schemeKey, 'set')('', Registry.REG_SZ, `URL:${name}`);
        await R(schemeKey, 'set')('URL Protocol', Registry.REG_SZ, '');
        await R(iconKey, 'set')('', Registry.REG_SZ, process.execPath);
        await R(openCommandKey, 'set')(
          '',
          Registry.REG_SZ,
          `${commandString} "%1"`
        );
      } else if (action === 'uninstall') {
        let currentCommand: RegistryItem | undefined;
        try {
          currentCommand = await R(openCommandKey, 'get')('');
        } catch {
          /* no value currently set */
        }
        if (currentCommand?.value?.includes(commandString)) {
          await R(schemeKey, 'destroy')();
        }
      }
    } catch (err: any) {
      log.error(
        mongoLogId(1_001_000_168),
        'Protocol handling',
        'Could not modify win32 registry for protocol scheme',
        {
          name,
          scheme,
          error: err?.messsage,
        }
      );
    }
  }
}
