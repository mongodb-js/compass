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
  /**
   * Show the per-connection "AI access" tab — only relevant in hosts that
   * embed the MCP server (desktop Compass). Off by default so compass-web
   * and other consumers of connection-form get no behavior change.
   */
  showAiAccess: boolean;
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
  showAiAccess: false,
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
