import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import type { ButtonProps } from '@leafygreen-ui/button';
import { Button } from '../leafygreen';
import { Theme, useDarkMode } from '../../hooks/use-theme';

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

function ModalFooterButton({ className, ...props }: ButtonProps) {
  const darkMode = useDarkMode();

  return (
    <Button
      {...props}
      className={cx(
        className,
        buttonStyle[darkMode ? Theme.Dark : Theme.Light]
      )}
    />
  );
}

export { ModalFooterButton };
