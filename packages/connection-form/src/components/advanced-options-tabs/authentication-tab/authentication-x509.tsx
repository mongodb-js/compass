import { Banner, BannerVariant } from '@mongodb-js/compass-components';
import React from 'react';

function AuthenticationX509(): React.ReactElement {
  return (
    <>
      <Banner variant={BannerVariant.Info}>
        X.509 Authentication type requires a <strong>Client Certificate</strong>{' '}
        to work. Make sure to enable TLS and add one in the{' '}
        <strong>TLS/SSL</strong> tab.
      </Banner>
    </>
  );
}

export default AuthenticationX509;
