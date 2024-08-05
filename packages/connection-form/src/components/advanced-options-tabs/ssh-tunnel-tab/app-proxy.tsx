import React, { useCallback } from 'react';
import { Link } from '@mongodb-js/compass-components';
import { useGlobalAppRegistry } from 'hadron-app-registry';

export function AppLevelProxy(): React.ReactElement {
  const appRegistry = useGlobalAppRegistry();
  const openCompassSettings = useCallback(() => {
    appRegistry.emit('open-compass-settings', 'proxy');
  }, [appRegistry]);

  return (
    <>
      Use the application-level proxy configured in the
      <Link onClick={() => openCompassSettings()}>Compass settings</Link>.
    </>
  );
}
