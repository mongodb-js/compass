import React, { useMemo } from 'react';
import numeral from 'numeral';
import { css, Tooltip, spacing } from '@mongodb-js/compass-components';
import type { CollectionState } from '../../modules/collection-tab';
import CollectionStatsItem from '../collection-stats-item';

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
  stats: CollectionState['stats'];
  isTimeSeries?: boolean;
};

const INVALID = 'N/A';

const avg = (size: number, count: number) => {
  if (count <= 0) {
    return 0;
  }
  return size / count;
};

const isNumber = (val: any): val is number => {
  return typeof val === 'number' && !isNaN(val);
};

const format = (value: any, format = 'a') => {
  if (!isNumber(value)) {
    return INVALID;
  }
  const precision = value <= 1000 ? '0' : '0.0';
  return numeral(value).format(precision + format);
};

const CollectionStats: React.FunctionComponent<CollectionStatsProps> = ({
  isTimeSeries,
  stats,
}: CollectionStatsProps) => {
  const {
    documentCount,
    storageSize,
    avgDocumentSize,
    indexCount,
    totalIndexSize,
    avgIndexSize,
  } = useMemo(() => {
    const {
      document_count = NaN,
      storage_size = NaN,
      free_storage_size = NaN,
      avg_document_size = NaN,
      index_count = NaN,
      index_size = NaN,
    } = stats ?? {};
    return {
      documentCount: format(document_count),
      storageSize: format(storage_size - free_storage_size, 'b'),
      avgDocumentSize: format(avg_document_size, 'b'),
      indexCount: format(index_count),
      totalIndexSize: format(index_size, 'b'),
      avgIndexSize: format(avg(index_size, index_count), 'b'),
    };
  }, [stats]);

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
                <CollectionStatsItem
                  data-testid="document"
                  label="Documents"
                  value={documentCount}
                />
              )}
              {!isTimeSeries && (
                <CollectionStatsItem
                  data-testid="index"
                  label="Indexes"
                  value={indexCount}
                />
              )}
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
