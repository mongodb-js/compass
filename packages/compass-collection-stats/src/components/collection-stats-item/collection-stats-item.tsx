import React from 'react';
import { css } from '@mongodb-js/compass-components';
import { uiColors } from '@leafygreen-ui/palette';

const collectionStatsItemStyles = css({
  marginRight: '12px',
});

const PrimaryLabelStyles = css({
  textTransform: 'uppercase',
  fontSize: '10px',
  fontWeight: 'bold',
  display: 'inline-block',
  marginRight: ' 5px',
  color: uiColors.gray.dark3,
});

const LabelStyles = css({
  textTransform: 'uppercase',
  fontSize: '10px',
  fontWeight: 'bold',
  color: uiColors.gray.base,
  lineHeight: '12px',
});

const PrimaryValueStyles = css({
  color: uiColors.gray.dark3,
  display: 'inline-block',
  fontSize: '24px',
  lineHeight: '24px',
});

const ValueStyles = css({
  color: uiColors.gray.base,
  fontSize: '14px',
});

type CollectionStatsItemProps = {
  label: string;
  value?: any;
  primary: boolean;
  dataTestId: string;
};

/**
 * Component for a single collection stats item.
 */
const CollectionStatsItem: React.FunctionComponent<any> = ({
  primary,
  dataTestId,
  label,
  value,
}: CollectionStatsItemProps) => {
  return (
    <div className={collectionStatsItemStyles} data-testid={dataTestId}>
      <div
        className={primary ? PrimaryLabelStyles : LabelStyles}
        data-testid={`${dataTestId}-label${primary ? '-primary' : ''}`}
      >
        {label}
      </div>
      <div
        className={primary ? PrimaryValueStyles : ValueStyles}
        data-testid={`${dataTestId}-value${primary ? '-primary' : ''}`}
      >
        {value}
      </div>
    </div>
  );
};

export default CollectionStatsItem;
