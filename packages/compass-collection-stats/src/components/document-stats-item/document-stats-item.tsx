import React from 'react';
import { css, uiColors } from '@mongodb-js/compass-components';

import CollectionStatsItem from '../collection-stats-item';

const documentStatsItemStyles = css({
  paddingLeft: '15px',
  paddingRight: '3px',
  borderRight: `1px solid ${uiColors.gray.light2}`,
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'flex-end',
  marginBottom: 0,
  '&:last-child': {
    borderRight: 'none',
  },
});

type DocumentStatsItemProps = {
  documentCount: string;
  isTimeSeries?: boolean;
  storageSize: string;
  avgDocumentSize: string;
};

/**
 * The document stats item component.
 */
const DocumentStatsItem: React.FunctionComponent<DocumentStatsItemProps> = ({
  documentCount,
  isTimeSeries,
  storageSize,
  avgDocumentSize,
}: DocumentStatsItemProps) => {
  return (
    <div data-testid="document-stats-item" className={documentStatsItemStyles}>
      {!isTimeSeries && (
        <CollectionStatsItem
          dataTestId="document-count"
          label="Documents"
          value={documentCount}
          primary
        />
      )}
      <CollectionStatsItem
        dataTestId="storage-size"
        label="storage size"
        value={storageSize}
      />
      {!isTimeSeries && (
        <CollectionStatsItem
          dataTestId="avg-document-size"
          label="avg. size"
          value={avgDocumentSize}
        />
      )}
    </div>
  );
};

export default DocumentStatsItem;
