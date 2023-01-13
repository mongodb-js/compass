import React from 'react';
import {
  css,
  spacing,
  palette,
  Accordion,
  IndexIcon,
  Badge,
  BadgeVariant,
} from '@mongodb-js/compass-components';
import type { ExplainIndex } from '../../modules/explain';

type ExplainIndexesProps = {
  indexes: ExplainIndex[];
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

const shardStyles = css({
  color: palette.gray.dark1,
});

const indexKeyStyles = css({
  marginTop: spacing[1],
  display: 'flex',
  gap: spacing[1],
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
              <Accordion
                text={title}
                data-testid={`explain-index-button-${name}-${shard ?? ''}`}
              >
                <div
                  className={indexKeyStyles}
                  data-testid={`explain-index-content-${name}-${shard ?? ''}`}
                >
                  {Object.keys(indexKeys).map((field) => (
                    <Badge
                      data-testid={`${field}-key`}
                      variant={BadgeVariant.LightGray}
                      key={field}
                    >
                      {field}
                      &nbsp;
                      <IndexIcon direction={indexKeys[field]} />
                    </Badge>
                  ))}
                </div>
              </Accordion>
            </div>
          );
        }
      )}
    </div>
  );
};
