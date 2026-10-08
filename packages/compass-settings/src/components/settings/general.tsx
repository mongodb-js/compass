import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';

export const generalFields = [
  'readOnly',
  'enableShell',
  'protectConnectionStrings',
  'timezone',
  'defaultSortOrder',
  'showKerberosPasswordField',
  'maxTimeMS',
  'enableDevTools',
  ...(['darwin', 'win32'].includes(process.platform)
    ? (['installURLHandlers'] as const)
    : []),
  'enableShowDialogOnQuit',
  'enableDbAndCollStats',
  'inferNamespacesFromPrivileges',
  'legacyUUIDDisplayEncoding',
  'language',
] as const;

export const GeneralSettings: React.FunctionComponent = () => {
  const t = useTranslation();
  return (
    <div data-testid="general-settings">
      <div>
        {t(
          'settings.general.intro',
          'To enhance the user experience, Compass can enable or disable particular features. Please choose from the settings below:'
        )}
      </div>
      <SettingsList fields={generalFields} />
    </div>
  );
};

export default GeneralSettings;
