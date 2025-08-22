import React, { forwardRef } from 'react';

import { Button, Icon, IconButton } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';

import { getIconButtonStyles, getIconFill } from './InputBarSendButton.styles';
import { InputBarSendButtonProps } from './InputBarSendButton.types';
import { ReturnIcon } from './ReturnIcon';
import { State } from './shared.types';

export const InputBarSendButton = forwardRef<
  HTMLButtonElement,
  InputBarSendButtonProps
>(({ disabled, isCompact, shouldRenderButtonText, state, ...rest }, fwdRef) => {
  const { theme } = shim_useDarkMode();

  const isLoading = state === State.Loading;

  if (!isCompact) {
    return (
      <Button
        size="small"
        rightGlyph={<ReturnIcon fill={getIconFill({ disabled, theme })} />}
        type="submit"
        disabled={disabled}
      >
        {shouldRenderButtonText && 'Enter'}
      </Button>
    );
  }

  return (
    <IconButton
      aria-label="Send message"
      className={getIconButtonStyles({ disabled, theme })}
      disabled={disabled}
      ref={fwdRef}
      type="submit"
      {...rest}
    >
      {isLoading ? <Icon glyph="Stop" /> : <Icon glyph="ArrowUp" />}
    </IconButton>
  );
});

InputBarSendButton.displayName = 'InputBarSendButton';
