import React from 'react';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';
import CreateShardKeyForm from '../create-shard-key-form';
import { containerStyles, bannerStyles } from '../common-styles';

const nbsp = '\u00a0';

export function UnshardedState() {
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Warning} className={bannerStyles}>
        <strong>
          To use Global Writes, this collection must be configured with a
          compound shard key made up of both a ‘location’ field and an
          identifier field that you should provide.
        </strong>
        {nbsp}See the instructions below for details.
      </Banner>
      <CreateShardKeyForm />
    </div>
  );
}

export default UnshardedState;
