import React from 'react';

import { cx } from '@mongodb-js/compass-components';
import { Icon } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import { badgeVariants, baseStyles } from './RichLinkBadge.styles';
import { type RichLinkBadgeProps } from './RichLinkBadge.types';

export const RichLinkBadge = ({
  darkMode: darkModeProp,
  glyph: glyphName,
  color = 'gray',
  label,
}: RichLinkBadgeProps) => {
  const { theme } = shim_useDarkMode(darkModeProp);
  return (
    <div className={cx(baseStyles, badgeVariants[theme][color])}>
      {glyphName ? <Icon glyph={glyphName} /> : null}
      <Body>{label}</Body>
    </div>
  );
};
