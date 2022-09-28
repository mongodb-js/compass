import React from 'react';
import {
  spacing,
  css,
  Accordion,
  Badge,
  BadgeVariant,
  IndexIcon,
} from '@mongodb-js/compass-components';

import type { IndexDefinition } from '../../modules/indexes';

const keyListStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[1],
});

const keyItemStyles = css({
  paddingTop: spacing[1],
  paddingLeft: spacing[4],
});

const badgeStyles = css({
  gap: spacing[1],
});

type NameFieldProps = {
  name: string;
  keys: ReturnType<IndexDefinition['fields']['serialize']>;
};

const NameField: React.FunctionComponent<NameFieldProps> = ({ name, keys }) => {
  return (
    <Accordion text={name} aria-label={`Show/Hide index ${name} keys`}>
      <ul className={keyListStyles}>
        {keys.map(({ field, value }) => (
          <li key={field} className={keyItemStyles}>
            <Badge
              data-testid={`${field}-key`}
              variant={BadgeVariant.LightGray}
              className={badgeStyles}
            >
              {field}
              <IndexIcon direction={value} />
            </Badge>
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

export default NameField;
