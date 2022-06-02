import React from 'react';
import {
  Badge,
  BadgeVariant,
  css,
  Icon,
  spacing,
  uiColors,
  Accordion,
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
    <>({String(direction)})</>
  );
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const accordianContainerStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[1],
});

const accordianContentStyles = css({
  marginTop: spacing[1],
  '*:not(:last-child)': {
    marginRight: spacing[1],
  },
});

const shardStyles = css({
  color: uiColors.gray.dark1,
});

export const ExplainIndexes: React.FunctionComponent<ExplainIndexesProps> = ({
  indexes,
}) => {
  if (indexes.length === 0) {
    return null;
  }

  return (
    <div className={containerStyles}>
      {indexes.map(
        ({ name, shard, key: indexKeys }: ExplainIndex, arrIndex) => {
          const title = shard ? (
            <>
              {name}&nbsp;
              <span className={shardStyles}>({shard})</span>
            </>
          ) : (
            name
          );
          return (
            <div className={accordianContainerStyles} key={arrIndex}>
              <Accordion text={title}>
                <div className={accordianContentStyles}>
                  {Object.entries(indexKeys).map(
                    ([keyName, direction], listIndex) => (
                      <Badge variant={BadgeVariant.LightGray} key={listIndex}>
                        {keyName}
                        &nbsp;
                        <IndexDirectionIcon direction={direction} />
                      </Badge>
                    )
                  )}
                </div>
              </Accordion>
            </div>
          );
        }
      )}
    </div>
  );
};
