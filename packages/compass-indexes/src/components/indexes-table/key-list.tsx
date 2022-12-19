import React from 'react';
import {
  spacing,
  css,
  Badge,
  BadgeVariant,
  IndexIcon,
} from '@mongodb-js/compass-components';

import type { IndexDefinition } from '../../modules/indexes';

const keyListStyles = css({
  display: 'flex',
  gap: spacing[1],
});

const badgeStyles = css({
  gap: spacing[1],
});

type KeyListProps = {
  keys: ReturnType<IndexDefinition['fields']['serialize']>;
};

const KeyList: React.FunctionComponent<KeyListProps> = ({ keys }) => {
  return (
    <div className={keyListStyles} role="list">
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

export default KeyList;
