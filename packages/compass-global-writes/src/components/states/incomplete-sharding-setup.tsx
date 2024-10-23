import {
  Banner,
  BannerVariant,
  Button,
  spacing,
  css,
  ButtonVariant,
  Link,
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

export interface IncompleteShardingSetupProps {
  shardKey: ShardKey;
  namespace: string;
  isSubmittingForSharding: boolean;
  onUnmanageNamespace: () => void;
}

export function IncompleteShardingSetup({
  shardKey,
  namespace,
  onUnmanageNamespace,
  isSubmittingForSharding,
}: IncompleteShardingSetupProps) {
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Warning}>
        <strong>
          It looks like you&#39;ve chosen a Global Writes shard key for this
          collection, but your configuration is incomplete.
        </strong>{' '}
        Please enable Global Writes for this collection to ensure that documents
        are associated with the appropriate zone.&nbsp;
        <Link href={/** TODO */} target="_blank" rel="noreferrer">
          Read more about Global Writes
        </Link>
        <div>
          <Button
            data-testid="unmanage-collection-button"
            onClick={/** TODO */}
            variant={ButtonVariant.Default}
            isLoading={isSubmittingForSharding}
            className={unmanageBtnStyles}
          >
            Shard Collection
          </Button>
        </div>
      </Banner>
      <ShardKeyMarkup
        namespace={namespace}
        shardKey={shardKey}
        showMetaData={true}
      />
    </div>
  );
}

export default connect(
  (state: RootState) => {
    if (!state.shardKey) {
      throw new Error('Shard key not found in IncompleteShardingSetup');
    }
    return {
      namespace: state.namespace,
      shardKey: state.shardKey,
      isSubmittingForSharding:
        state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING_INCOMPLETE,
    };
  },
  {
    onUnmanageNamespace: unmanageNamespace,
  }
)(IncompleteShardingSetup);
