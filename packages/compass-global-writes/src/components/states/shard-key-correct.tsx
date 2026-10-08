import React, { useMemo } from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  Subtitle,
  Button,
  ButtonVariant,
  SpinLoader,
  useTranslation,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import {
  unmanageNamespace,
  type RootState,
  type ShardKey,
  type ShardZoneData,
} from '../../store/reducer';
import { ShardZonesTable } from '../shard-zones-table';
import ShardKeyMarkup from '../shard-key-markup';
import { containerStyles, bannerStyles } from '../common-styles';
import ExampleCommandsMarkup from '../example-commands-markup';

const nbsp = '\u00a0';

export type ShardKeyCorrectProps = {
  namespace: string;
  shardKey: ShardKey;
  shardZones: ShardZoneData[];
  isUnmanagingNamespace: boolean;
  onUnmanageNamespace: () => void;
};

export function ShardKeyCorrect({
  namespace,
  shardKey,
  shardZones,
  isUnmanagingNamespace,
  onUnmanageNamespace,
}: ShardKeyCorrectProps) {
  const t = useTranslation();
  const customShardKeyField = useMemo(() => {
    return shardKey.fields[1].name;
  }, [shardKey]);

  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Info} className={bannerStyles}>
        <strong>
          {t(
            'globalWrites.shardKeyCorrect.documentsShouldContain',
            'All documents in your collection should contain both the ‘location’ field (with a ISO country or subdivision code) and your {field} field at insert time.',
            { field: customShardKeyField }
          )}
        </strong>
        {nbsp}
        {t(
          'globalWrites.shardKeyCorrect.tableIncluded',
          'We have included a table for reference below.'
        )}
      </Banner>
      <ShardKeyMarkup namespace={namespace} shardKey={shardKey} />
      <ExampleCommandsMarkup namespace={namespace} shardKey={shardKey} />

      <ShardZonesTable shardZones={shardZones} />

      <Subtitle>
        {t(
          'globalWrites.shardKeyCorrect.unmanageTitle',
          'Unmanage this collection'
        )}
      </Subtitle>
      <Body>
        {t(
          'globalWrites.shardKeyCorrect.unmanageDescription',
          'Documents belonging to this collection will no longer be distributed across the shards of your global clusters.'
        )}
      </Body>
      <div>
        <Button
          data-testid="unmanage-collection-button"
          onClick={onUnmanageNamespace}
          variant={ButtonVariant.Default}
          isLoading={isUnmanagingNamespace}
          loadingIndicator={<SpinLoader />}
        >
          {t(
            'globalWrites.shardKeyCorrect.unmanageButton',
            'Unmanage collection'
          )}
        </Button>
      </div>
    </div>
  );
}

export default connect(
  (state: RootState) => {
    if (!state.shardKey) {
      throw new Error('Shard key not found in ShardKeyCorrect');
    }
    return {
      namespace: state.namespace,
      shardKey: state.shardKey,
      shardZones: state.shardZones,
      isUnmanagingNamespace: state.userActionInProgress === 'unmanageNamespace',
    };
  },
  {
    onUnmanageNamespace: unmanageNamespace,
  }
)(ShardKeyCorrect);
