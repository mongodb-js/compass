import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  WorkspaceContainer,
  SpinLoaderWithLabel,
  ConfirmationModalArea,
} from '@mongodb-js/compass-components';
import type { RootState, ShardingStatus } from '../store/reducer';
import { ShardingStatuses } from '../store/reducer';
import UnshardedState from './states/unsharded';
import ShardingState from './states/sharding';
import ShardKeyCorrect from './states/shard-key-correct';
import ShardKeyInvalid from './states/shard-key-invalid';
import ShardKeyMismatch from './states/shard-key-mismatch';
import ShardingError from './states/sharding-error';
import IncompleteShardingSetup from './states/incomplete-sharding-setup';

const containerStyles = css({
  display: 'flex',
  width: '100%',
  paddingTop: spacing[400],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  maxWidth: '700px',
});

const loaderStyles = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: '100%',
  marginTop: spacing[1800] * 2,
});

type GlobalWritesProps = {
  shardingStatus: ShardingStatus;
};

function ShardingStateView({
  shardingStatus,
}: {
  shardingStatus: Exclude<ShardingStatus, 'NOT_READY'>;
}) {
  if (
    shardingStatus === ShardingStatuses.UNSHARDED ||
    shardingStatus === ShardingStatuses.SUBMITTING_FOR_SHARDING
  ) {
    return <UnshardedState />;
  }

  if (
    shardingStatus === ShardingStatuses.SHARDING ||
    shardingStatus === ShardingStatuses.CANCELLING_SHARDING
  ) {
    return <ShardingState />;
  }

  if (
    shardingStatus === ShardingStatuses.SHARDING_ERROR ||
    shardingStatus === ShardingStatuses.CANCELLING_SHARDING_ERROR ||
    shardingStatus === ShardingStatuses.SUBMITTING_FOR_SHARDING_ERROR
  ) {
    return <ShardingError />;
  }

  if (
    shardingStatus === ShardingStatuses.SHARD_KEY_CORRECT ||
    shardingStatus === ShardingStatuses.UNMANAGING_NAMESPACE
  ) {
    return <ShardKeyCorrect />;
  }

  if (shardingStatus === ShardingStatuses.SHARD_KEY_INVALID) {
    return <ShardKeyInvalid />;
  }

  if (
    shardingStatus === ShardingStatuses.SHARD_KEY_MISMATCH ||
    shardingStatus === ShardingStatuses.UNMANAGING_NAMESPACE_MISMATCH
  ) {
    return <ShardKeyMismatch />;
  }

  if (
    shardingStatus === ShardingStatuses.INCOMPLETE_SHARDING_SETUP ||
    shardingStatus === ShardingStatuses.SUBMITTING_FOR_SHARDING_INCOMPLETE
  ) {
    return <IncompleteShardingSetup />;
  }

  return null;
}

export function GlobalWrites({ shardingStatus }: GlobalWritesProps) {
  if (shardingStatus === ShardingStatuses.NOT_READY) {
    return (
      <div className={loaderStyles}>
        <SpinLoaderWithLabel progressText="Loading …" />
      </div>
    );
  }

  return (
    <WorkspaceContainer>
      <ConfirmationModalArea>
        <div className={containerStyles}>
          <ShardingStateView shardingStatus={shardingStatus} />
        </div>
      </ConfirmationModalArea>
    </WorkspaceContainer>
  );
}
export default connect((state: RootState) => ({
  shardingStatus: state.status,
}))(GlobalWrites);
