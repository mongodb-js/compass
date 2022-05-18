import React from 'react';
import { css, spacing, Card } from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

import type { ExplainData } from '../../modules/explain';
import { ExplainQueryPerformance } from './explain-query-performance';

type ExplainResultsProps = {
  plan: ExplainData['plan'];
  stats?: ExplainData['stats'];
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
});

const cardStyles = css({
  height: '350px',
  overflowY: 'scroll',
});

export const ExplainResults: React.FunctionComponent<ExplainResultsProps> = ({
  plan,
  stats,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-explain-results">
      {stats && (
        <ExplainQueryPerformance
          nReturned={stats.nReturned}
          executionTimeMillis={stats.executionTimeMillis}
          usedIndexes={stats.usedIndexes}
        />
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
