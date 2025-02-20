import React from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  Button,
  Link,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { cancelSharding, type RootState } from '../../store/reducer';
import {
  containerStyles,
  bannerStyles,
  bannerBtnStyles,
} from '../common-styles';

const nbsp = '\u00a0';

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
      <Banner variant={BannerVariant.Info} className={bannerStyles}>
        <strong>Sharding your collection …</strong>
        {nbsp}this should not take too long.
        <Button
          className={bannerBtnStyles}
          data-testid="cancel-sharding-btn"
          onClick={onCancelSharding}
          isLoading={isCancellingSharding}
          loadingIndicator={<SpinLoader />}
        >
          Cancel Request
        </Button>
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

export default connect(
  (state: RootState) => ({
    isCancellingSharding: state.userActionInProgress === 'cancelSharding',
  }),
  {
    onCancelSharding: cancelSharding,
  }
)(ShardingState);
