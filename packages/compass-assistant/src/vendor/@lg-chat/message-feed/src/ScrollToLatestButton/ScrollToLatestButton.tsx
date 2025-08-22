import React from 'react';

import { Button, shim_button, Icon } from '@mongodb-js/compass-components';

const { Size: ButtonSize } = shim_button;

import { shim_useDarkMode } from '@mongodb-js/compass-components';

import {
  scrollButtonContainerStyles,
  scrollButtonStyles,
} from './ScrollToLatestButton.styles';
import { ScrollToLatestButtonProps } from './ScrollToLatestButton.types';

export const ScrollToLatestButton = ({
  darkMode: darkModeProp,
  onClick,
  visible,
}: ScrollToLatestButtonProps) => {
  const { darkMode } = shim_useDarkMode(darkModeProp);

  if (!visible) {
    return null;
  }

  return (
    <div className={scrollButtonContainerStyles}>
      <Button
        aria-label="Scroll to latest message"
        className={scrollButtonStyles}
        darkMode={darkMode}
        onClick={onClick}
        rightGlyph={<Icon glyph="ArrowDown" />}
        size={ButtonSize.Small}
      >
        Scroll to latest
      </Button>
    </div>
  );
};

ScrollToLatestButton.displayName = 'ScrollToLatestButton';
