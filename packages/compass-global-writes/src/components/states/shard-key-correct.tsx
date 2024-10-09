import React, { useMemo } from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  css,
  Link,
  spacing,
  Code,
  Subtitle,
  Label,
  Button,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import {
  ShardingStatuses,
  unmanageNamespace,
  type RootState,
  type ShardKey,
  type ShardZoneData,
} from '../../store/reducer';
import toNS from 'mongodb-ns';
import { ShardZonesTable } from '../shard-zones-table';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

const nbsp = '\u00a0';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  marginBottom: spacing[400],
});

const codeBlockContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  maxWidth: '700px',
});

const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export type ShardKeyCorrectProps = {
  namespace: string;
  shardKey?: ShardKey;
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
  if (!shardKey) {
    throw new Error('Shard key not found in ShardKeyCorrect');
  }

  const customShardKeyField = useMemo(() => {
    return shardKey.fields[1].name;
  }, [shardKey]);

  const { atlasMetadata } = useConnectionInfo();

  const sampleCodes = useMemo(() => {
    const { collection, database } = toNS(namespace);
    return {
      findingDocuments: `use ${database}\ndb[${JSON.stringify(
        collection
      )}].find({"location": "US-NY", "${customShardKeyField}": "<id_value>"})`,
      insertingDocuments: `use ${database}\ndb[${JSON.stringify(
        collection
      )}].insertOne({"location": "US-NY", "${customShardKeyField}": "<id_value>",...<other fields>})`,
    };
  }, [namespace, customShardKeyField]);

  return (
    <div className={containerStyles}>
      <Banner variant={BannerVariant.Info}>
        <strong>
          All documents in your collection should contain both the ‘location’
          field (with a ISO country or subdivision code) and your{' '}
          {customShardKeyField} field at insert time.
        </strong>
        {nbsp}We have included a table for reference below.
      </Banner>

      <div className={codeBlockContainerStyles}>
        <Body data-testid="shardkey-description-title">
          <strong>{namespace}</strong> is configured with the following shard
          key:
        </Body>
        <Code language="js" data-testid="shardkey-description-content">
          {shardKey.fields.map((field) => `"${field.name}"`).join(', ')}
        </Code>
      </div>

      <Subtitle>Example commands</Subtitle>
      <div className={paragraphStyles}>
        <Body>
          Start querying your database with some of the most{' '}
          <Link
            href="https://www.mongodb.com/docs/atlas/global-clusters"
            hideExternalIcon
          >
            common commands
          </Link>{' '}
          for Global Writes.
        </Body>
        <Body>
          Replace the text to perform operations on different documents. US-NY
          is an ISO 3166 location code referring to New York, United States. You
          can look up other ISO 3166 location codes below.
        </Body>
      </div>

      <div className={codeBlockContainerStyles}>
        <Label htmlFor="finding-documents">Finding documents</Label>
        <Code
          language="js"
          data-testid="sample-finding-documents"
          id="finding-documents"
        >
          {sampleCodes.findingDocuments}
        </Code>
      </div>

      <div className={codeBlockContainerStyles}>
        <Label htmlFor="inserting-documents">Inserting documents</Label>
        <Code
          language="js"
          data-testid="sample-inserting-documents"
          id="inserting-documents"
        >
          {sampleCodes.insertingDocuments}
        </Code>
      </div>

      <Subtitle>Location Codes</Subtitle>
      <div className={paragraphStyles}>
        <Body>
          Each document’s first field should include an ISO 3166-1 Alpha-2 code
          for the location it belongs to.
        </Body>
        <Body>
          We also support ISO 3166-2 subdivision codes for countries containing
          a cloud provider data center (both ISO 3166-1 and ISO 3166-2 codes may
          be used for these countries). All valid country codes and the zones to
          which they map are listed in the table below. Additionally, you can
          view a list of all location codes{' '}
          <Link href="/static/atlas/country_iso_codes.txt">here</Link>.
        </Body>
        <Body>
          {atlasMetadata?.projectId && atlasMetadata?.clusterName && (
            <>
              Locations’ zone mapping can be changed by navigating to this
              clusters{' '}
              <Link
                href={`/v2/${atlasMetadata?.projectId}#/clusters/edit/${atlasMetadata?.clusterName}`}
              >
                Edit Configuration
              </Link>{' '}
              page and clicking the Configure Location Mappings’ link above the
              map.
            </>
          )}
        </Body>
      </div>

      <ShardZonesTable shardZones={shardZones} />

      <Subtitle>Unmanage this collection</Subtitle>
      <Body>
        Documents belonging to this collection will no longer be distributed
        across the shards of your global clusters.
      </Body>
      <div>
        <Button
          data-testid="shard-collection-button"
          onClick={onUnmanageNamespace}
          variant="primary"
          isLoading={isUnmanagingNamespace}
        >
          Unmanage collection
        </Button>
      </div>
    </div>
  );
}

export default connect(
  (state: RootState) => ({
    namespace: state.namespace,
    shardKey: state.shardKey,
    shardZones: state.shardZones,
    isUnmanagingNamespace:
      state.status === ShardingStatuses.UNMANAGING_NAMESPACE,
  }),
  {
    onUnmanageNamespace: unmanageNamespace,
  }
)(ShardKeyCorrect);
