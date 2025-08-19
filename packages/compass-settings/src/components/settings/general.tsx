import React from 'react';
import SettingsList from './settings-list';

const generalFields = [
  'readOnly',
  'enableShell',
  'protectConnectionStrings',
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
] as const;

export const GeneralSettings: React.FunctionComponent = () => {
  return (
    <div data-testid="general-settings">
      <div>
        To enhance the user experience, Compass can enable or disable particular
        features. Please choose from the settings below:
      </div>
      <SettingsList fields={generalFields} />
    </div>
  );
};

export default GeneralSettings;
