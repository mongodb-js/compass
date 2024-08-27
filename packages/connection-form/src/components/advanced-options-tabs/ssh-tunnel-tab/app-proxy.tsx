import { Body, Link } from '@mongodb-js/compass-components';
import React, { useCallback } from 'react';

export function AppProxy({
  openSettingsModal,
}: {
  openSettingsModal?: (tab?: string) => void;
}): React.ReactElement {
  const openProxySettings = useCallback(() => {
    openSettingsModal?.('proxy');
  }, [openSettingsModal]);

  if (!openSettingsModal) return <></>;

  return (
    <Body>
      Use the{' '}
      <Link onClick={openProxySettings}>application-level proxy settings</Link>{' '}
      for communicating with the cluster.
    </Body>
  );
}
