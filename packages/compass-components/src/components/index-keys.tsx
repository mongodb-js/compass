import React from 'react';
import {
  Badge,
  BadgeVariant,
  css,
  Icon,
  spacing,
} from '@mongodb-js/compass-components';
import type { IndexDirection } from 'mongodb';

type IndexKeysProps = {
  keys: Record<string, IndexDirection>;
};

const containerStyles = css({
  marginTop: spacing[1],
  '*:not(:last-child)': {
    marginRight: spacing[1],
  },
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
      {Object.entries(keys).map(([keyName, direction], listIndex) => (
        <Badge variant={BadgeVariant.LightGray} key={listIndex}>
          {keyName}
          &nbsp;
          <IndexDirectionIcon direction={direction} />
        </Badge>
      ))}
    </div>
  );
};

export default IndexKeys;
