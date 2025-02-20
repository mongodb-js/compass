import {
  Banner,
  BannerVariant,
  Button,
  spacing,
  css,
  ButtonVariant,
  Link,
  SpinLoader,
} from '@mongodb-js/compass-components';
import React from 'react';
import ShardKeyMarkup from '../shard-key-markup';
import {
  resumeManagedNamespace,
  type ShardZoneData,
  type RootState,
  type ShardKey,
} from '../../store/reducer';
import { connect } from 'react-redux';
import ExampleCommandsMarkup from '../example-commands-markup';
import { ShardZonesTable } from '../shard-zones-table';
import { bannerBtnStyles } from '../common-styles';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  marginBottom: spacing[400],
});

export interface IncompleteShardingSetupProps {
  shardKey: ShardKey;
  shardZones: ShardZoneData[];
  namespace: string;
  isSubmittingForSharding: boolean;
  onResume: () => void;
}

export function IncompleteShardingSetup({
  shardKey,
  shardZones,
  namespace,
  onResume,
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
        <Link
          href="https://www.mongodb.com/docs/atlas/global-clusters/"
          target="_blank"
          rel="noreferrer"
        >
          Read more about Global Writes
        </Link>
        <div>
          <Button
            data-testid="manage-collection-button"
            onClick={onResume}
            variant={ButtonVariant.Default}
            isLoading={isSubmittingForSharding}
            loadingIndicator={<SpinLoader />}
            className={bannerBtnStyles}
          >
            Enable Global Writes
          </Button>
        </div>
      </Banner>
      <ShardKeyMarkup namespace={namespace} shardKey={shardKey} />
      <ExampleCommandsMarkup namespace={namespace} shardKey={shardKey} />
      <ShardZonesTable shardZones={shardZones} />
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
      shardZones: state.shardZones,
      isSubmittingForSharding:
        state.userActionInProgress === 'submitForSharding',
    };
  },
  {
    onResume: resumeManagedNamespace,
  }
)(IncompleteShardingSetup);
