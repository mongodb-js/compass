import React from 'react';
import {
  Banner,
  BannerVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

const nbsp = '\u00a0';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

export function ShardingState() {
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Info}>
        <strong>Sharding your collection ...</strong>
        {nbsp}this should not take too long.
      </Banner>
    </div>
  );
}

export default connect()(ShardingState);
