import React from 'react';
import {
  Badge,
  BadgeVariant,
  Body,
  css,
  Icon,
} from '@mongodb-js/compass-components';
import type { ExplainIndex } from '../../modules/explain';
import type { IndexDirection } from 'mongodb';

type ExplainIndexesProps = {
  indexes: ExplainIndex[];
};

const IndexDirectionIcon = ({ direction }: { direction: IndexDirection }) => {
  return direction === 1 ? (
    <Icon glyph="ArrowUp" />
  ) : direction === -1 ? (
    <Icon glyph="ArrowDown" />
  ) : (
    <>{direction.toString()}</>
  );
};

const IndexType = ({ indexKeys }: { indexKeys: ExplainIndex['key'] }) => {
  const keyLength = Object.keys(indexKeys).length;
  if (keyLength === 0) {
    return null;
  }

  if (keyLength === 1) {
    return <IndexDirectionIcon direction={Object.values(indexKeys)[0]} />;
  }

  const content = Object.entries(indexKeys).map(
    ([indexKey, indexDirection]) => (
      <>
        {indexKey}
        &nbsp;(
        <IndexDirectionIcon direction={indexDirection} />)
      </>
    )
  );

  return <span>{content}</span>;
};

const containerStyles = css({
  flexShrink: 0,
  flexDirection: 'column',
  gap: '4px',
});

const indexStyles = css({
  display: 'flex',
});

export const ExplainIndexes: React.FunctionComponent<ExplainIndexesProps> = ({
  indexes,
}) => {
  if (indexes.length === 0) {
    return <Body weight="medium">No index available for this query.</Body>;
  }

  return (
    <div className={containerStyles}>
      {indexes.map((index, arrIndex) => (
        <Badge
          className={indexStyles}
          key={arrIndex}
          variant={BadgeVariant.LightGray}
        >
          <span>{index.name}</span>
          <IndexType indexKeys={index.key} />
          {index.shard && <span>({index.shard})</span>}
        </Badge>
      ))}
    </div>
  );
};
