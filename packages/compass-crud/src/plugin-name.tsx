import React, { useMemo } from 'react';
import numeral from 'numeral';
import { css, Tooltip, Badge, spacing } from '@mongodb-js/compass-components';
import type { CrudStore } from './stores/crud-store';

const tooltipDocumentsListStyles = css({
  listStyleType: 'none',
  padding: 0,
  margin: 0,
});

const tabTitleWithStatsStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const INVALID = 'N/A';

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

type CollectionTabStatsProps = {
  text: string;
  details: string[];
};
const CollectionTabStats: React.FunctionComponent<CollectionTabStatsProps> = ({
  text,
  details,
}) => {
  return (
    <div data-testid="collection-stats">
      <Tooltip
        data-testid="collection-stats-tooltip"
        align="bottom"
        justify="middle"
        trigger={
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <span
            onClick={() => {
              // We use these stats in the Collection Tab, and LG does not
              // bubble up the click event to the parent component, so we
              // add noop onClick and let it bubble up.
            }}
          >
            <Badge>{text}</Badge>
          </span>
        }
      >
        <ol className={tooltipDocumentsListStyles}>
          {details.map((detail, i) => (
            <li data-testid={`tooltip-detail-${i}`} key={`tooltip-detail-${i}`}>
              {detail}
            </li>
          ))}
        </ol>
      </Tooltip>
    </div>
  );
};

export const CrudPluginName = ({
  store: {
    state: { collectionStats },
  },
}: {
  store: CrudStore;
}) => {
  const { documentCount, storageSize, avgDocumentSize } = useMemo(() => {
    const {
      document_count = NaN,
      storage_size = NaN,
      free_storage_size = NaN,
      avg_document_size = NaN,
    } = collectionStats ?? {};
    return {
      documentCount: format(document_count),
      storageSize: format(storage_size - free_storage_size, 'b'),
      avgDocumentSize: format(avg_document_size, 'b'),
    };
  }, [collectionStats]);
  const details = [
    `Documents: ${documentCount}`,
    `Storage Size: ${storageSize}`,
    `Avg. Size: ${avgDocumentSize}`,
  ];

  return (
    <div
      data-testid="documents-tab-with-stats"
      className={tabTitleWithStatsStyles}
    >
      Documents
      <CollectionTabStats text={documentCount} details={details} />
    </div>
  );
};
