import {
  Banner,
  BannerVariant,
  Button,
  spacing,
  css,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import React from 'react';
import ShardKeyMarkup from '../shard-key-markup';
import {
  ShardingStatuses,
  unmanageNamespace,
  type RootState,
  type ShardKey,
} from '../../store/reducer';
import { connect } from 'react-redux';
import type { ManagedNamespace } from '../../services/atlas-global-writes-service';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  marginBottom: spacing[400],
});

const unmanageBtnStyles = css({
  marginTop: spacing[100],
});

const getRequestedShardKey = (
  managedNamespace: ManagedNamespace
): ShardKey => ({
  fields: [
    {
      name: 'location',
      type: 'RANGE',
    },
    {
      name: managedNamespace.customShardKey,
      type: managedNamespace.isCustomShardKeyHashed ? 'HASHED' : 'RANGE',
    },
  ],
  isUnique: managedNamespace.isShardKeyUnique,
});

export interface ShardKeyMismatchProps {
  shardKey: ShardKey;
  requestedShardKey?: ShardKey;
  namespace: string;
  isUnmanagingNamespace: boolean;
  onUnmanageNamespace: () => void;
}

export function ShardKeyMismatch({
  shardKey,
  requestedShardKey,
  namespace,
  onUnmanageNamespace,
  isUnmanagingNamespace,
}: ShardKeyMismatchProps) {
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Danger}>
        <strong>
          Your requested shard key cannot be configured because the collection
          has already been sharded with a different key.
        </strong>{' '}
        Please click the button below to unmanage this collection. If the
        existing shard key is valid, you can enable Global Writes for this
        collection on the next screen.
        <div>
          <Button
            data-testid="unmanage-collection-button"
            onClick={onUnmanageNamespace}
            variant={ButtonVariant.Default}
            isLoading={isUnmanagingNamespace}
            className={unmanageBtnStyles}
          >
            Unmanage collection
          </Button>
        </div>
      </Banner>
      <ShardKeyMarkup
        namespace={namespace}
        shardKey={shardKey}
        showMetaData={true}
      />
      {requestedShardKey && (
        <ShardKeyMarkup
          namespace={namespace}
          shardKey={requestedShardKey}
          showMetaData={true}
          type="requested"
        />
      )}
    </div>
  );
}

export default connect(
  (state: RootState) => {
    if (!state.shardKey) {
      throw new Error('Shard key not found in ShardKeyMismatch');
    }
    return {
      namespace: state.namespace,
      shardKey: state.shardKey,
      requestedShardKey:
        state.managedNamespace && getRequestedShardKey(state.managedNamespace),
      isUnmanagingNamespace:
        state.status === ShardingStatuses.UNMANAGING_NAMESPACE_MISMATCH,
    };
  },
  {
    onUnmanageNamespace: unmanageNamespace,
  }
)(ShardKeyMismatch);
