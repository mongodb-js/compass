import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import type { ButtonProps } from '@leafygreen-ui/button';
import { Button } from '../leafygreen';
import { Theme, useTheme, withTheme } from '../../hooks/use-theme';

const buttonStyle = {
  [Theme.Light]: css({
    margin: '0 2px',
    '&:first-of-type': {
      margin: '0 0 0 5px',
    },
    '&:last-of-type': {
      margin: '0 5px 0 0',
    },
  }),
  [Theme.Dark]: css({
    margin: '0 2px',
    '&:first-of-type': {
      margin: '0 0 0 4px',
    },
    '&:last-of-type': {
      margin: '0 4px 0 0',
    },
  }),
};

function UnthemedModalFooterButton({ className, ...props }: ButtonProps) {
  const { theme } = useTheme();
  return <Button {...props} className={css(className, buttonStyle[theme])} />;
}

const ModalFooterButton = withTheme(UnthemedModalFooterButton);

export { ModalFooterButton };
