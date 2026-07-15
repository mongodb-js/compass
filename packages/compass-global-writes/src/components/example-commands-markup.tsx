import {
  Body,
  Code,
  css,
  Label,
  Link,
  spacing,
  Subtitle,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import type { ShardKey } from '../store/reducer';
import toNS from 'mongodb-ns';

const codeBlockContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export interface ExampleCommandsMarkupProps {
  shardKey: ShardKey;
  namespace: string;
  showMetaData?: boolean;
  type?: 'requested' | 'existing';
}

const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export function ExampleCommandsMarkup({
  namespace,
  shardKey,
}: ExampleCommandsMarkupProps) {
  const sampleCodes = useMemo(() => {
    const { collection, database } = toNS(namespace);
    const db = JSON.stringify(database);
    const coll = JSON.stringify(collection);
    const customShardKeyField = JSON.stringify(shardKey.fields[1].name);
    return {
      findingDocuments: `use(${db})\ndb[${coll}].find({"location": "US-NY", ${customShardKeyField}: "<id_value>"})`,
      insertingDocuments: `use(${db})\ndb[${coll}].insertOne({"location": "US-NY", ${customShardKeyField}: "<id_value>",...<other fields>})`,
    };
  }, [namespace, shardKey]);

  return (
    <>
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
    </>
  );
}

export default ExampleCommandsMarkup;
