import { Body, Link, useTranslation } from '@mongodb-js/compass-components';
import React, { useCallback } from 'react';

export function AppProxy({
  openSettingsModal,
}: {
  openSettingsModal?: (tab?: string) => void;
}): React.ReactElement {
  const t = useTranslation();
  const openProxySettings = useCallback(() => {
    openSettingsModal?.('proxy');
  }, [openSettingsModal]);

  if (!openSettingsModal) return <></>;

  return (
    <Body>
      {t('connections.form.proxy.appProxyPrefix', 'Use the')}{' '}
      <Link onClick={openProxySettings}>
        {t(
          'connections.form.proxy.appProxyLink',
          'application-level proxy settings'
        )}
      </Link>{' '}
      {t(
        'connections.form.proxy.appProxySuffix',
        'for communicating with the cluster.'
      )}
    </Body>
  );
}
