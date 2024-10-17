import React, { useMemo } from 'react';
import {
  Banner,
  BannerVariant,
  Button,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import {
  cancelSharding,
  createShardKey,
  type RootState,
  ShardingStatuses,
} from '../../store/reducer';
import CreateShardKeyForm, {
  type CreateShardKeyFormProps,
} from '../create-shard-key-form';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const btnStyles = css({
  float: 'right',
  height: spacing[600],
});

const errorStyles = css({
  marginTop: spacing[200],
});

interface ShardingErrorProps extends CreateShardKeyFormProps {
  shardingError: string;
  isCancellingSharding: boolean;
  onCancelSharding: () => void;
}

export function ShardingError({
  namespace,
  shardingError,
  isCancellingSharding,
  isSubmittingForSharding,
  onCancelSharding,
  onCreateShardKey,
}: ShardingErrorProps) {
  const createShardKeyFormProps = useMemo<CreateShardKeyFormProps>(
    () => ({
      namespace,
      isSubmittingForSharding,
      onCreateShardKey,
    }),
    [namespace, isSubmittingForSharding, onCreateShardKey]
  );
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Warning}>
        <div>
          There was an error sharding your collection. Please cancel the
          request, make any necessary changes to your collection, and try again.
          <div className={errorStyles}>{shardingError}</div>
        </div>
        <Button
          className={btnStyles}
          data-testid="cancel-sharding-btn"
          disabled={isCancellingSharding || isSubmittingForSharding}
          isLoading={isCancellingSharding}
          onClick={onCancelSharding}
        >
          Cancel Request
        </Button>
      </Banner>
      <CreateShardKeyForm {...createShardKeyFormProps} />
    </div>
  );
}

export default connect(
  (state: RootState) => {
    if (!state.shardingError) {
      throw new Error('No shardingError found in ShardingError component');
    }
    return {
      namespace: state.namespace,
      shardingError: state.shardingError,
      isCancellingSharding:
        state.status === ShardingStatuses.CANCELLING_SHARDING_ERROR,
      isSubmittingForSharding:
        state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING_ERROR,
    };
  },
  {
    onCancelSharding: cancelSharding,
    onCreateShardKey: createShardKey,
  }
)(ShardingError);
