import React from 'react';

import { cx } from '@mongodb-js/compass-components';
import LeafygreenProvider, {
  shim_useDarkMode,
} from '@mongodb-js/compass-components';

import { RichLink } from '..';

import { baseStyles } from './RichLinksArea.styles';
import { type RichLinksAreaProps } from './RichLinksArea.types';

export function RichLinksArea({
  links,
  darkMode: darkModeProp,
  onLinkClick,
  ...props
}: RichLinksAreaProps) {
  const { darkMode } = shim_useDarkMode(darkModeProp);
  return (
    <LeafygreenProvider darkMode={darkMode}>
      <div className={cx(baseStyles)} {...props}>
        {links.map((richLinkProps) => {
          return (
            <RichLink
              key={richLinkProps.href}
              onClick={() => onLinkClick?.(richLinkProps)}
              {...richLinkProps}
            />
          );
        })}
      </div>
    </LeafygreenProvider>
  );
}

RichLinksArea.displayName = 'RichLinksArea';
