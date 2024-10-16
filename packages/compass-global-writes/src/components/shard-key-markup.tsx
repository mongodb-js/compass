import { Body, Code, css, spacing } from '@mongodb-js/compass-components';
import React from 'react';
import type { ShardKey } from '../store/reducer';

const codeBlockContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  maxWidth: '700px',
});

interface ShardKeyMarkupProps {
  shardKey: ShardKey;
  namespace: string;
  showMetaData?: boolean;
}

export function ShardKeyMarkup({
  namespace,
  shardKey,
  showMetaData,
}: ShardKeyMarkupProps) {
  let markup = shardKey.fields
    .map(
      (field) => `"${field.name}"` + (showMetaData ? ` (${field.type}) ` : '')
    )
    .join(', ');
  if (showMetaData) {
    markup += ` - unique: ${String(shardKey.isUnique)}`;
  }
  return (
    <div className={codeBlockContainerStyles}>
      <Body data-testid="shardkey-description-title">
        <strong>{namespace}</strong> is configured with the following shard key:
      </Body>
      <Code language="js" data-testid="shardkey-description-content">
        {markup}
      </Code>
    </div>
  );
}

export default ShardKeyMarkup;
