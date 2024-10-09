import React from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  Button,
  css,
  Link,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import {
  cancelSharding,
  type RootState,
  ShardingStatuses,
} from '../../store/reducer';

const nbsp = '\u00a0';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

interface ShardingStateProps {
  isCancellingSharding: boolean;
  onCancelSharding: () => void;
}

export function ShardingState({
  isCancellingSharding,
  onCancelSharding,
}: ShardingStateProps) {
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
        <Button
          data-testid="cancel-sharding-btn"
          onClick={onCancelSharding}
          isLoading={isCancellingSharding}
        >
          Cancel Request
        </Button>
      </Link>
    </div>
  );
}

export default connect(
  (state: RootState) => ({
    isCancellingSharding: state.status === ShardingStatuses.CANCELLING_SHARDING,
  }),
  {
    onCancelSharding: cancelSharding,
  }
)(ShardingState);
