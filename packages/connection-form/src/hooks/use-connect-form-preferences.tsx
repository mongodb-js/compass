import { createContext, useContext } from 'react';

// Not all of these preference map to Compass preferences.
export type ConnectionFormPreferences = {
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

const defaultPreferences = {
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
  saveAndConnectLabel: 'Connect',
};

export const ConnectionFormPreferencesContext = createContext<
  Partial<ConnectionFormPreferences>
>({});

export const useConnectionFormPreference = <
  K extends keyof ConnectionFormPreferences
>(
  preferenceKey: K
): ConnectionFormPreferences[K] => {
  const preferences = useContext(ConnectionFormPreferencesContext);

  return preferences[preferenceKey] ?? defaultPreferences[preferenceKey];
};
