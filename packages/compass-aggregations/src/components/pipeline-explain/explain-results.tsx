import React from 'react';
import { css, cx, spacing, Card } from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

import type { ExplainData } from '../../modules/explain';
import { ExplainQueryPerformance } from './explain-query-performance';

type ExplainResultsProps = {
  plan: ExplainData['plan'];
  stats?: ExplainData['stats'];
};

const containerStyles = css({
  gap: spacing[4],
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  height: '100%',
});

const summaryStyles = css({
  gridArea: 'summary',
});

const cardStyles = css({
  gridArea: 'card',
  maxHeight: '50vh',
  overflowY: 'scroll',
});

export const ExplainResults: React.FunctionComponent<ExplainResultsProps> = ({
  plan,
  stats,
}) => {
  const gridAreaStyles = css({
    gridTemplateAreas: `
      ${stats ? '"summary"' : ''}
      'card'
    `,
  });
  return (
    <div
      className={cx(gridAreaStyles, containerStyles)}
      data-testid="pipeline-explain-results"
    >
      {stats && (
        <div className={summaryStyles}>
          <ExplainQueryPerformance
            nReturned={stats.nReturned}
            executionTimeMillis={stats.executionTimeMillis}
            usedIndexes={stats.usedIndexes}
          />
        </div>
      )}
      <Card className={cardStyles} data-testid="pipeline-explain-results-json">
        <Document
          doc={plan}
          editable={false}
          copyToClipboard={() => {
            void navigator.clipboard.writeText(
              new HadronDocument(plan).toEJSON()
            );
          }}
        />
      </Card>
    </div>
  );
};
