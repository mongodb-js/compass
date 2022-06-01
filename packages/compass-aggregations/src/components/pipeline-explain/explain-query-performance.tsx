import React from 'react';
import { Body, Subtitle, css, spacing } from '@mongodb-js/compass-components';
import type { ExplainIndex } from '../../modules/explain';
import { ExplainIndexes } from './explain-indexes';

type ExplainQueryPerformanceProps = {
  executionTimeMillis: number;
  nReturned: number;
  indexes: ExplainIndex[];
};

const containerStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const statsStyles = css({
  gap: spacing[1],
  display: 'flex',
  flexDirection: 'column',
});

const statItemStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'baseline',
});

const statTitleStyles = css({
  whiteSpace: 'nowrap',
});

export const ExplainQueryPerformance: React.FunctionComponent<ExplainQueryPerformanceProps> =
  ({ nReturned, executionTimeMillis, indexes }) => {
    return (
      <div
        className={containerStyles}
        data-testid="pipeline-explain-results-summary"
      >
        <Subtitle>Query Performance Summary</Subtitle>
        <div className={statsStyles}>
          {typeof nReturned === 'number' && (
            <div className={statItemStyles}>
              <Body>Documents returned:</Body>
              <Body weight="medium">{nReturned}</Body>
            </div>
          )}
          {executionTimeMillis > 0 && (
            <div className={statItemStyles}>
              <Body>Actual query execution time (ms):</Body>
              <Body weight="medium">{executionTimeMillis}</Body>
            </div>
          )}
          <div className={statItemStyles}>
            <Body className={statTitleStyles}>
              Query used the following indexes:
            </Body>
            <Body weight="medium">
              {indexes.length === 0
                ? 'No index available for this query.'
                : indexes.length}
            </Body>
          </div>
          <ExplainIndexes indexes={indexes} />
        </div>
      </div>
    );
  };
