import React from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  css,
  Link,
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
        <strong>Sharding your collection …</strong>
        {nbsp}this should not take too long.
      </Banner>
      <Body>
        Once your collection is sharded, this tab will show instructions on
        document ‘location’ field formatting, and provide some common command
        examples.
      </Body>
      <Link
        href="https://www.mongodb.com/docs/atlas/global-clusters/"
        hideExternalIcon
      >
        You can read more about Global Writes in our documentation.
      </Link>
    </div>
  );
}

export default connect()(ShardingState);
