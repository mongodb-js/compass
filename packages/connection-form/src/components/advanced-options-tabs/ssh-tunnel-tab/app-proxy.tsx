import { Body, Link } from '@mongodb-js/compass-components';
import { useGlobalAppRegistry } from 'hadron-app-registry';
import React, { useCallback } from 'react';

export function AppProxy(): React.ReactElement {
  const globalAppRegistry = useGlobalAppRegistry();
  const openProxySettings = useCallback(() => {
    globalAppRegistry.emit('open-compass-settings', 'proxy');
  }, [globalAppRegistry]);

  return (
    <Body>
      Use the{' '}
      <Link onClick={openProxySettings}>application-level proxy settings</Link>{' '}
      for communicating with the cluster.
    </Body>
  );
}
