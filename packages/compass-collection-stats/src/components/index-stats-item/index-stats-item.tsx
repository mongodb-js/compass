import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import CollectionStatsItem from '../collection-stats-item';

const indexStatsItemStyles = css({
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

type IndexStatsItemProps = {
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
};

/**
 * The index stats item component.
 */
const IndexStatsItem: React.FunctionComponent<any> = ({
  indexCount
}: IndexStatsItemProps) => {
  return (
    <div data-testid="index-stats-item" className={indexStatsItemStyles}>
      <CollectionStatsItem
        dataTestId="index-count"
        label="Indexes"
        value={indexCount}
      />
    </div>
  );
};

export default IndexStatsItem;
