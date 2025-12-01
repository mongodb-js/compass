import React, { useMemo } from 'react';
import {
  css,
  Tooltip,
  Badge,
  spacing,
  compactBytes,
  compactNumber,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import type { RootCrudState } from './stores/reducer';

const tooltipContentStyles = css({
  listStyleType: 'none',
  padding: 0,
  margin: 0,
  textAlign: 'left',
});

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const INVALID = 'N/A';

const isNumber = (val: any): val is number => {
  return typeof val === 'number' && !isNaN(val);
};

const format = (value: any, formatType: 'number' | 'bytes' = 'number') => {
  if (!isNumber(value)) {
    return INVALID;
  }
  const decimals = value <= 1000 ? 0 : 1;
  return formatType === 'bytes'
    ? compactBytes(value, true, decimals)
    : compactNumber(value);
};

type CollectionStatsProps = {
  text: string;
  details: string[];
};
const CollectionStats: React.FunctionComponent<CollectionStatsProps> = ({
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
        <ol className={tooltipContentStyles}>
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

type CrudTabTitleProps = {
  collectionStats: any;
};

const CrudTabTitleComponent: React.FC<CrudTabTitleProps> = ({
  collectionStats,
}) => {
  const { documentCount, storageSize, avgDocumentSize } = useMemo(() => {
    const {
      document_count = NaN,
      storage_size = NaN,
      free_storage_size = NaN,
      avg_document_size = NaN,
    } = collectionStats ?? {};
    return {
      documentCount: format(document_count, 'number'),
      storageSize: format(storage_size - free_storage_size, 'bytes'),
      avgDocumentSize: format(avg_document_size, 'bytes'),
    };
  }, [collectionStats]);
  const enableDbAndCollStats = usePreference('enableDbAndCollStats');

  const details = [
    `Documents: ${documentCount}`,
    `Storage Size: ${storageSize}`,
    `Avg. Size: ${avgDocumentSize}`,
  ];

  return (
    <div data-testid="documents-tab-title" className={containerStyles}>
      Documents
      {enableDbAndCollStats && (
        <CollectionStats text={documentCount} details={details} />
      )}
    </div>
  );
};

export const CrudTabTitle = connect((state: RootCrudState) => ({
  collectionStats: state.crud?.collectionStats,
}))(CrudTabTitleComponent);
