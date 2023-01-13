import React from 'react';
import { css, cx, spacing, KeylineCard } from '@mongodb-js/compass-components';
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

const withStatsGrid = css({
  gridTemplateAreas: `
      'stats'
      'card'
    `,
});

const withoutStatsGrid = css({
  gridTemplateAreas: `
      'card'
    `,
});

const statsStyles = css({
  gridArea: 'stats',
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
  return (
    <div
      className={cx(stats ? withStatsGrid : withoutStatsGrid, containerStyles)}
      data-testid="pipeline-explain-results"
    >
      {stats && (
        <div className={statsStyles}>
          <ExplainQueryPerformance
            nReturned={stats.nReturned}
            executionTimeMillis={stats.executionTimeMillis}
            indexes={stats.indexes}
          />
        </div>
      )}
      <KeylineCard className={cardStyles} data-testid="pipeline-explain-results-json">
        <Document
          doc={plan}
          editable={false}
          copyToClipboard={() => {
            void navigator.clipboard.writeText(
              new HadronDocument(plan).toEJSON()
            );
          }}
        />
      </KeylineCard>
    </div>
  );
};
