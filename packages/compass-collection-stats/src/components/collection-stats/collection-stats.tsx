import React from 'react';
import { css } from '@mongodb-js/compass-components';

import DocumentStatsItem from '../document-stats-item';
import IndexStatsItem from '../index-stats-item';

const collectionStatsStyles = css({
  textAlign: 'right',
  paddingRight: 0,
  justifyContent: 'flex-end',
  display: 'flex',
  float: 'right',
});

const collectionStatsEmptyStyles = css({
  display: 'none',
});

type CollectionStatsProps = {
  documentCount: string;
  storageSize: string;
  avgDocumentSize: string;
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
  isReadonly?: boolean;
  isTimeSeries?: boolean;
  isEditing?: boolean;
};

const CollectionStats: React.FunctionComponent<CollectionStatsProps> = ({
  isReadonly,
  isEditing,
  isTimeSeries,
  documentCount,
  storageSize,
  avgDocumentSize,
  indexCount,
  totalIndexSize,
  avgIndexSize,
}: CollectionStatsProps) => {
  if (isReadonly === true || isEditing === true) {
    return (
      <div
        data-testid="collection-stats-empty"
        className={collectionStatsEmptyStyles}
      />
    );
  }

  return (
    <div data-testid="collection-stats" className={collectionStatsStyles}>
      <DocumentStatsItem
        isTimeSeries={isTimeSeries}
        documentCount={documentCount}
        storageSize={storageSize}
        avgDocumentSize={avgDocumentSize}
      />
      {!isTimeSeries && (
        <IndexStatsItem
          indexCount={indexCount}
          totalIndexSize={totalIndexSize}
          avgIndexSize={avgIndexSize}
        />
      )}
    </div>
  );
};

export default CollectionStats;
