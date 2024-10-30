import {
  Banner,
  BannerVariant,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import React from 'react';
import ShardKeyMarkup from '../shard-key-markup';
import type { RootState, ShardKey } from '../../store/reducer';
import { connect } from 'react-redux';
import { containerStyles, bannerStyles } from '../common-styles';

const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export interface ShardKeyInvalidProps {
  shardKey: ShardKey;
  namespace: string;
}

export function ShardKeyInvalid({ shardKey, namespace }: ShardKeyInvalidProps) {
  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Danger} className={bannerStyles}>
        <strong>
          To configure Global Writes, the first shard key of this collection
          must be &quot;location&quot; with ranged sharding and you must also
          specify a second shard key.
        </strong>{' '}
        Please migrate the data in this collection to a new collection and
        reshard it using a valid compound shard key.
      </Banner>
      <ShardKeyMarkup
        namespace={namespace}
        shardKey={shardKey}
        showMetaData={true}
      />
      <div className={paragraphStyles}>
        Documents in this collection will be distributed across your shards
        without being mapped to specific zones.
      </div>
    </div>
  );
}

export default connect((state: RootState) => {
  if (!state.shardKey) {
    throw new Error('Shard key not found in ShardKeyInvalid');
  }
  return {
    namespace: state.namespace,
    shardKey: state.shardKey,
  };
})(ShardKeyInvalid);
