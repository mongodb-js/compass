import React from 'react';
import {
  Badge,
  BadgeVariant,
  Body,
  css,
  Icon,
  spacing,
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
    <>({direction.toString()})</>
  );
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const indexItemStyles = css({
  '*:not(:last-child)': {
    marginRight: spacing[1],
  },
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
        <Body key={arrIndex} className={indexItemStyles}>
          <span>{index.name}</span>
          {index.shard && <span>({index.shard})</span>}
          {Object.entries(index.key).map(([keyName, direction], listIndex) => (
            <Badge variant={BadgeVariant.LightGray} key={listIndex}>
              {keyName}
              &nbsp;
              <IndexDirectionIcon direction={direction} />
            </Badge>
          ))}
        </Body>
      ))}
    </div>
  );
};
