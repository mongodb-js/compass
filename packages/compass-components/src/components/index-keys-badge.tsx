import { Badge } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';
import IndexIcon from './index-icon';
import { Variant as BadgeVariant } from '@leafygreen-ui/badge';

const keyListStyles = css({
  display: 'inline-flex',
  gap: spacing[1],
});

const badgeStyles = css({
  // Override LeafyGreen's uppercase styles as we want to keep the case sensitivity of the key.
  textTransform: 'none',
  gap: spacing[1],
});

type KeyListProps = {
  keys: { field: string; value: any }[];
  'data-testid'?: string;
};

const IndexBadge: React.FunctionComponent<{
  field: string;
  value: unknown;
}> = ({ field, value }) => {
  return (
    <Badge
      data-testid={`${field}-key`}
      variant={BadgeVariant.LightGray}
      className={badgeStyles}
      role="listitem"
    >
      {field}
      <IndexIcon direction={value} />
    </Badge>
  );
};

const IndexKeysBadge: React.FunctionComponent<KeyListProps> = ({
  keys,
  'data-testid': testId,
}) => {
  return (
    <div className={keyListStyles} role="list" data-testid={testId}>
      {keys.map(({ field, value }) => (
        <Badge
          key={field}
          data-testid={`${field}-key`}
          variant={BadgeVariant.LightGray}
          className={badgeStyles}
          role="listitem"
        >
          {field}
          <IndexIcon direction={value} />
        </Badge>
      ))}
    </div>
  );
};

export { IndexKeysBadge, IndexBadge };
