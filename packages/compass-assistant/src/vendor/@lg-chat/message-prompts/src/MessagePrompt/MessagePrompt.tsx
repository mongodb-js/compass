import React, { ForwardedRef, forwardRef } from 'react';

import { cx } from '@mongodb-js/compass-components';
import { useDarkMode } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import { useMessagePromptsContext } from '../MessagePromptsContext';

import {
  baseStyles,
  disabledStyles,
  selectedStyles,
  themeStyles,
} from './MessagePrompt.styles';
import { MessagePromptProps } from './MessagePrompt.types';

export const MessagePrompt = forwardRef(
  (
    {
      children,
      onClick,
      disabled: disabledProp,
      selected,
      className,
      darkMode: darkModeProp,
    }: MessagePromptProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const { hasSelectedPrompt } = useMessagePromptsContext();
    const { theme } = useDarkMode(darkModeProp);
    const disabled = disabledProp ?? (!selected && hasSelectedPrompt);

    return (
      <button
        className={cx(
          baseStyles,
          themeStyles[theme],
          {
            [disabledStyles[theme]]: disabled,
            [selectedStyles]: selected,
          },
          className
        )}
        onClick={!disabled ? onClick : undefined}
        aria-disabled={!!disabled}
        aria-pressed={!!selected}
        tabIndex={selected || disabled ? 0 : 1}
        ref={ref}
      >
        <Body style={{ color: 'inherit' }}>{children}</Body>
      </button>
    );
  }
);

MessagePrompt.displayName = 'MessagePrompt';
