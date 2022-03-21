import React from 'react';
import { css } from '@mongodb-js/compass-components';
import { uiColors } from '@leafygreen-ui/palette';

import CollectionStatsItem from '../collection-stats-item';

const indexStatsItemStyles = css({
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

type IndexStatsItemProps = {
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
};

/**
 * The index stats item component.
 */
const IndexStatsItem: React.FunctionComponent<any> = ({
  indexCount,
  totalIndexSize,
  avgIndexSize,
}: IndexStatsItemProps) => {
  return (
    <div data-testid="index-stats-item" className={indexStatsItemStyles}>
      <CollectionStatsItem
        dataTestId="index-count"
        label="Indexes"
        value={indexCount}
        primary
      />
      <CollectionStatsItem
        dataTestId="total-index-size"
        label="total size"
        value={totalIndexSize}
      />
      <CollectionStatsItem
        dataTestId="avg-index-size"
        label="avg. size"
        value={avgIndexSize}
      />
    </div>
  );
};

export default IndexStatsItem;
