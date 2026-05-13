import React from 'react';
import { useTranslation } from 'react-i18next';
import SettingsList from './settings-list';

const generalFields = [
  'language',
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
  'legacyUUIDDisplayEncoding',
] as const;

export const GeneralSettings: React.FunctionComponent = () => {
  const { t } = useTranslation('compassSettings');
  return (
    <div data-testid="general-settings">
      <div>{t('generalIntro')}</div>
      <SettingsList fields={generalFields} />
    </div>
  );
};

export default GeneralSettings;
