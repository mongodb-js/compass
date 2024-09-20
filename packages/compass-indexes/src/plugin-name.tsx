import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { RootState } from './modules';
import { Badge, css, spacing, Tooltip } from '@mongodb-js/compass-components';
import numeral from 'numeral';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const tooltipContentStyles = css({
  listStyleType: 'none',
  padding: 0,
  margin: 0,
});

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

const PluginName = ({
  collectionStats,
}: {
  collectionStats: RootState['collectionStats'];
}) => {
  const { indexCount, totalIndexSize, avgIndexSize } = useMemo(() => {
    const { index_count = NaN, index_size = NaN } = collectionStats ?? {};
    return {
      indexCount: format(index_count),
      totalIndexSize: format(index_size, 'b'),
      avgIndexSize: format(avg(index_size, index_count), 'b'),
    };
  }, [collectionStats]);

  const details = [
    `Indexes: ${indexCount}`,
    `Total Size: ${totalIndexSize}`,
    `Avg. Size: ${avgIndexSize}`,
  ];

  return (
    <div className={containerStyles}>
      Indexes
      <CollectionStats text={indexCount} details={details} />
    </div>
  );
};

export const IndexesPluginName = connect(({ collectionStats }: RootState) => ({
  collectionStats,
}))(PluginName);
