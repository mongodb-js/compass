import React from 'react';
import Badge, { Variant } from '@leafygreen-ui/badge';
import { css } from '@leafygreen-ui/emotion';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';

type IndexDirection =
  | -1
  | 1
  | '2d'
  | '2dsphere'
  | 'text'
  | 'geoHaystack'
  | number;

type IndexKeysProps = {
  keys: {
    field: string;
    value: IndexDirection;
  }[];
};

const containerStyles = css({
  display: 'flex',
  gap: spacing[1],
});

const IndexDirectionIcon = ({ direction }: { direction: IndexDirection }) => {
  return direction === 1 ? (
    <Icon glyph="ArrowUp" />
  ) : direction === -1 ? (
    <Icon glyph="ArrowDown" />
  ) : (
    <>({String(direction)})</>
  );
};

const IndexKeys: React.FunctionComponent<IndexKeysProps> = ({ keys }) => {
  return (
    <div className={containerStyles}>
      {keys.map(({ field, value }) => (
        <Badge
          data-testid={`${field}-key`}
          variant={Variant.LightGray}
          key={field}
        >
          {field}
          &nbsp;
          <IndexDirectionIcon direction={value} />
        </Badge>
      ))}
    </div>
  );
};

export default IndexKeys;
