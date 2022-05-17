import React from 'react';
import { Badge, BadgeVariant, Body } from '@mongodb-js/compass-components';
import type { IndexInformation } from '@mongodb-js/explain-plan-helper';

type ExplainIndexesProps = {
  indexes: IndexInformation[];
};

export const ExplainIndexes: React.FunctionComponent<ExplainIndexesProps> = ({
  indexes,
}) => {
  if (indexes.filter(({ index }) => index).length === 0) {
    return <Body weight="medium">No index available for this query.</Body>;
  }

  return (
    <div>
      {indexes.map((info, idx) => (
        <Badge key={idx} variant={BadgeVariant.LightGray}>
          {info.index} {info.shard && <>({info.shard})</>}
        </Badge>
      ))}
    </div>
  );
};
