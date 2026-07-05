import { usePreference } from 'compass-preferences-model/provider';
import { useMemo } from 'react';
import { UUID } from 'bson';
import { useConnectionGroups, useConnectionActions } from '../provider';

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
  const enableConnectionGroups = usePreference('enableConnectionGroups');
  const connectionGroups = useConnectionGroups();
  const { createGroup } = useConnectionActions();

  return useMemo(
    () => ({
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
      showConnectionGroups: enableConnectionGroups,
      connectionGroups,
      onCreateGroup: async (name: string, color?: string) => {
        const group = { id: new UUID().toString(), name, color };
        await createGroup(group);
        return group;
      },
    }),
    [
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
      enableConnectionGroups,
      connectionGroups,
      createGroup,
    ]
  );
}
