import React, { ForwardedRef, forwardRef } from 'react';

import { AssistantAvatar } from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { BaseFontSize } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import {
  baseStyles,
  buttonTextStyles,
  contentContainerStyles,
  themeStyles,
} from './ChatTrigger.styles';
import { ChatTriggerProps } from './ChatTrigger.types';

export const ChatTrigger = forwardRef(
  (
    { className, children, darkMode: darkModeProp, ...rest }: ChatTriggerProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const { darkMode, theme } = shim_useDarkMode(darkModeProp);
    return (
      <button
        className={cx(baseStyles, themeStyles[theme], className)}
        {...rest}
        ref={ref}
      >
        <div className={contentContainerStyles}>
          <AssistantAvatar darkMode={darkMode} disabled={rest.disabled} />
          {children && (
            <Body
              baseFontSize={BaseFontSize.Body1}
              className={buttonTextStyles}
            >
              <b>{children}</b>
            </Body>
          )}
        </div>
      </button>
    );
  }
);

ChatTrigger.displayName = 'ChatTrigger';
