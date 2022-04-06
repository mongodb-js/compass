import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import CollectionStatsItem from '../collection-stats-item';

const documentStatsItemStyles = css({
  paddingLeft: spacing[1],
  paddingRight: spacing[1],
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
};

/**
 * The document stats item component.
 */
const DocumentStatsItem: React.FunctionComponent<DocumentStatsItemProps> = ({
  documentCount,
  isTimeSeries,
}: DocumentStatsItemProps) => {
  return (
    <div data-testid="document-stats-item" className={documentStatsItemStyles}>
      {!isTimeSeries && (
        <CollectionStatsItem
          dataTestId="document-count"
          label="Documents"
          value={documentCount}
        />
      )}
    </div>
  );
};

export default DocumentStatsItem;
