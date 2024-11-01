import { Body, Code, css, spacing } from '@mongodb-js/compass-components';
import React from 'react';
import type { ShardKey } from '../store/reducer';

const codeBlockContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

interface ShardKeyMarkupProps {
  shardKey: ShardKey;
  namespace: string;
  showMetaData?: boolean;
  type?: 'requested' | 'existing';
}

export function ShardKeyMarkup({
  namespace,
  shardKey,
  showMetaData,
  type = 'existing',
}: ShardKeyMarkupProps) {
  let markup = shardKey.fields
    .map(
      (field) =>
        `"${field.name}"` +
        (showMetaData ? ` (${field.type.toLowerCase()})` : '')
    )
    .join(', ');
  if (showMetaData) {
    markup += ` - unique: ${String(shardKey.isUnique)}`;
  }
  return (
    <div className={codeBlockContainerStyles}>
      <Body data-testid={`${type}-shardkey-description-title`}>
        {type === 'existing' ? (
          <>
            <strong>{namespace}</strong> is configured with the following shard
            key:
          </>
        ) : (
          <>You requested to use the shard key:</>
        )}
      </Body>
      <Code language="js" data-testid={`${type}-shardkey-description-content`}>
        {markup}
      </Code>
    </div>
  );
}

export default ShardKeyMarkup;
