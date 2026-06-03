import { usePreference } from 'compass-preferences-model/provider';
import { useMemo } from 'react';

/**
 * The AI access tab in connection-form drives `ConnectionInfo.mcpAccess`,
 * which only has an effect when this host actually embeds the MCP server.
 * That's desktop Compass; compass-web does not run a local MCP server, so
 * the tab would be UI noise editing a passive field. Webpack inlines
 * `process.env.HADRON_DISTRIBUTION` at build time:
 *   - 'compass'    -> desktop, tab visible
 *   - 'compass-web' -> hosted, tab hidden
 */
const SHOW_AI_ACCESS_TAB = process.env.HADRON_DISTRIBUTION !== 'compass-web';

export function useConnectionFormPreferences() {
  const protectConnectionStrings = usePreference('protectConnectionStrings');
  const forceConnectionOptions = usePreference('forceConnectionOptions');
  const showKerberosPasswordField = usePreference('showKerberosPasswordField');
  const showOIDCDeviceAuthFlow = usePreference('showOIDCDeviceAuthFlow');
  const enableOidc = usePreference('enableOidc');
  const enableDebugUseCsfleSchemaMap = usePreference(
    'enableDebugUseCsfleSchemaMap'
  );
  const protectConnectionStringsForNewConnections = usePreference(
    'protectConnectionStringsForNewConnections'
  );

  return useMemo(
    () => ({
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
      showAiAccess: SHOW_AI_ACCESS_TAB,
    }),
    [
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
    ]
  );
}
