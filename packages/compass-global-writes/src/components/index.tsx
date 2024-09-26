import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  WorkspaceContainer,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';
import type { RootState, ShardingStatus } from '../store/reducer';
import { ShardingStatuses } from '../store/reducer';
import UnshardedState from './states/unsharded';
import ShardingState from './states/sharding';

const containerStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  display: 'flex',
  width: '100%',
  height: '100%',
});

const workspaceContentStyles = css({
  paddingTop: spacing[400],
});

const centeredContent = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

type GlobalWritesProps = {
  shardingStatus: ShardingStatus;
};

function getStateViewBasedOnShardingStatus(shardingStatus: ShardingStatus) {
  switch (shardingStatus) {
    case ShardingStatuses.NOT_READY:
      return (
        <div className={centeredContent}>
          <SpinLoaderWithLabel progressText="Loading …" />
        </div>
      );
    case ShardingStatuses.UNSHARDED:
      return <UnshardedState />;
    case ShardingStatuses.SHARDING:
      return <ShardingState />;
    default:
      return null;
  }
}

export function GlobalWrites({ shardingStatus }: GlobalWritesProps) {
  return (
    <div className={containerStyles}>
      <WorkspaceContainer className={workspaceContentStyles}>
        {getStateViewBasedOnShardingStatus(shardingStatus)}
      </WorkspaceContainer>
    </div>
  );
}
export default connect((state: RootState) => ({
  shardingStatus: state.status,
}))(GlobalWrites);
