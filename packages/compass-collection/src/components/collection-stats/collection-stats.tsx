import React from 'react';
import { css, Tooltip, spacing } from '@mongodb-js/compass-components';

import DocumentStatsItem from '../document-stats-item';
import IndexStatsItem from '../index-stats-item';

const collectionStatsStyles = css({
  textAlign: 'right',
  paddingRight: 0,
  display: 'flex',
  float: 'right',
});

const collectionStatsBodyStyles = css({
  display: 'flex',
  flexDirection: 'row',
  marginRight: spacing[3],
});

const tooltipDocumentsListStyles = css({
  listStyleType: 'none',
  padding: 0,
  margin: 0,
});

const tooltipIndexeListStyles = css({
  listStyleType: 'none',
  padding: 0,
  margin: 0,
  marginTop: spacing[3],
});

type CollectionStatsProps = {
  documentCount: string;
  storageSize: string;
  avgDocumentSize: string;
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
  isTimeSeries?: boolean;
};

const CollectionStats: React.FunctionComponent<CollectionStatsProps> = ({
  isTimeSeries,
  documentCount,
  storageSize,
  avgDocumentSize,
  indexCount,
  totalIndexSize,
  avgIndexSize,
}: CollectionStatsProps) => {
  return (
    <div data-testid="collection-stats" className={collectionStatsStyles}>
      <Tooltip
        data-testid="collection-stats-tooltip"
        align="left"
        justify="middle"
        delay={500}
        trigger={({ children, ...props }) => (
          <span {...props}>
            <div className={collectionStatsBodyStyles}>
              {!isTimeSeries && (
                <DocumentStatsItem documentCount={documentCount} />
              )}
              {!isTimeSeries && <IndexStatsItem indexCount={indexCount} />}
            </div>
            {children}
          </span>
        )}
      >
        <div>
          <ol className={tooltipDocumentsListStyles}>
            <li
              data-testid="tooltip-documents-count"
              key="tooltip-documents-count"
            >
              Documents: {documentCount}
            </li>
            <li
              data-testid="tooltip-documents-storage-size"
              key="tooltip-documents-storage-size"
            >
              Storage Size: {storageSize}
            </li>
            <li
              data-testid="tooltip-documents-avg-size"
              key="tooltip-documents-avg-size"
            >
              Avg. Size: {avgDocumentSize}
            </li>
          </ol>
          <ol className={tooltipIndexeListStyles}>
            <li data-testid="tooltip-indexes-count" key="tooltip-indexes-count">
              Indexes: {indexCount}
            </li>
            <li
              data-testid="tooltip-indexes-total-size"
              key="tooltip-indexes-total-size"
            >
              Total Size: {totalIndexSize}
            </li>
            <li
              data-testid="tooltip-indexes-avg-size"
              key="tooltip-indexes-avg-size"
            >
              Avg. Size: {avgIndexSize}
            </li>
          </ol>
        </div>
      </Tooltip>
    </div>
  );
};

export default CollectionStats;
