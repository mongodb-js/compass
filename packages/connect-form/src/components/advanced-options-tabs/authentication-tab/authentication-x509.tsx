import { Banner, BannerVariant } from '@mongodb-js/compass-components';
import React from 'react';

function AuthenticationX509(): React.ReactElement {
  return (
    <>
      <Banner variant={BannerVariant.Info}>
        X.509 Authentication type requires a Client Certificate to work.
      </Banner>
    </>
  );
}

export default AuthenticationX509;
