import { createContext, useContext } from 'react';

export type ConnectionFormSettings = {
  showFavoriteActions: boolean;
  showHelpCardsInForm: boolean;
  showPersonalisationForm: boolean;
  protectConnectionStrings: boolean;
  forceConnectionOptions: [key: string, value: string][];
  showKerberosPasswordField: boolean;
  showOIDCDeviceAuthFlow: boolean;
  enableOidc: boolean;
  enableDebugUseCsfleSchemaMap: boolean;
  protectConnectionStringsForNewConnections: boolean;
  showOIDCAuth: boolean;
  showKerberosAuth: boolean;
  showCSFLE: boolean;
  showProxySettings: boolean;
  saveAndConnectLabel: string;
};

const defaultSettings = {
  showFavoriteActions: true,
  showPersonalisationForm: true,
  showHelpCardsInForm: true,
  protectConnectionStrings: false,
  forceConnectionOptions: [],
  showKerberosPasswordField: false,
  showOIDCDeviceAuthFlow: false,
  enableOidc: false,
  enableDebugUseCsfleSchemaMap: false,
  protectConnectionStringsForNewConnections: false,
  showOIDCAuth: true,
  showKerberosAuth: true,
  showCSFLE: true,
  showProxySettings: true,
  saveAndConnectLabel: 'Save & Connect',
};

export const ConnectionFormSettingsContext = createContext<
  Partial<ConnectionFormSettings>
>({});

export const useConnectionFormSetting = <
  K extends keyof ConnectionFormSettings
>(
  preferenceKey: K
): ConnectionFormSettings[K] => {
  const settings = useContext(ConnectionFormSettingsContext);

  return settings[preferenceKey] ?? defaultSettings[preferenceKey];
};
