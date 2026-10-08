import {
  Banner,
  BannerVariant,
  useTranslation,
} from '@mongodb-js/compass-components';
import React from 'react';

function AuthenticationX509(): React.ReactElement {
  const t = useTranslation();
  return (
    <>
      <Banner variant={BannerVariant.Info}>
        {t(
          'connections.form.auth.x509Prefix',
          'X.509 Authentication type requires a'
        )}{' '}
        <strong>
          {t(
            'connections.form.auth.x509ClientCertificate',
            'Client Certificate'
          )}
        </strong>{' '}
        {t(
          'connections.form.auth.x509Middle',
          'to work. Make sure to enable TLS and add one in the'
        )}{' '}
        <strong>{t('connections.form.tabs.tls', 'TLS/SSL')}</strong>
        {t('connections.form.auth.x509Suffix', ' tab.')}
      </Banner>
    </>
  );
}

export default AuthenticationX509;
