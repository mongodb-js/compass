import React from 'react';
import {
  Badge,
  BadgeVariant,
  Body,
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

  return Object.entries(indexKeys).map(([indexKey, indexDirection]) => (
    <>
      {indexKey}
      &nbsp;(
      <IndexDirectionIcon direction={indexDirection} />)
    </>
  ));
};

export const ExplainIndexes: React.FunctionComponent<ExplainIndexesProps> = ({
  indexes,
}) => {
  if (indexes.length === 0) {
    return <Body weight="medium">No index available for this query.</Body>;
  }

  return (
    <div>
      {indexes.map((info, idx) => (
        <Badge key={idx} variant={BadgeVariant.LightGray}>
          {info.name}
          <IndexType indexKeys={info.key} />
          {info.shard && <>({info.shard})</>}
        </Badge>
      ))}
    </div>
  );
};
