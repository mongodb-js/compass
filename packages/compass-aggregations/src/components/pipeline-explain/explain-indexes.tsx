import React from 'react';
import {
  css,
  spacing,
  uiColors,
  Accordion,
  IndexKeys,
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
              <Accordion
                text={title}
                data-testid={`explain-index-button-${name}-${shard ?? ''}`}
              >
                <div
                  data-testid={`explain-index-content-${name}-${shard ?? ''}`}
                >
                  <IndexKeys keys={indexKeys} />
                </div>
              </Accordion>
            </div>
          );
        }
      )}
    </div>
  );
};
