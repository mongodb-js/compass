import React, { forwardRef } from 'react';

import Button from '@mongodb-js/compass-components';
import ArrowUpIcon from '@mongodb-js/compass-components';
import StopIcon from '@mongodb-js/compass-components';
import IconButton from '@mongodb-js/compass-components';
import { useDarkMode } from '@mongodb-js/compass-components';

import { getIconButtonStyles, getIconFill } from './InputBarSendButton.styles';
import { InputBarSendButtonProps } from './InputBarSendButton.types';
import { ReturnIcon } from './ReturnIcon';
import { State } from './shared.types';

export const InputBarSendButton = forwardRef<
  HTMLButtonElement,
  InputBarSendButtonProps
>(({ disabled, isCompact, shouldRenderButtonText, state, ...rest }, fwdRef) => {
  const { theme } = useDarkMode();

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
      {isLoading ? <StopIcon /> : <ArrowUpIcon />}
    </IconButton>
  );
});

InputBarSendButton.displayName = 'InputBarSendButton';
