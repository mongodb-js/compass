import React, { ForwardedRef, forwardRef } from 'react';

import { cx } from '@mongodb-js/compass-components';
import { useDarkMode } from '@mongodb-js/compass-components';
import { isComponentType } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import { MessagePromptsProvider } from '../MessagePromptsContext';

import {
  baseStyles,
  labelStyles,
  labelThemeStyles,
} from './MessagePrompts.styles';
import { MessagePromptsProps } from '.';

export const MessagePrompts = forwardRef(
  (
    { children, label, darkMode: darkModeProp, ...rest }: MessagePromptsProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const darkMode = useDarkMode(darkModeProp);
    const theme = darkMode ? Theme.Dark : Theme.Light;
    const hasSelectedPrompt: boolean = React.Children.toArray(children).some(
      (child) => isComponentType(child, 'MessagePrompt') && child.props.selected
    );

    return (
      <MessagePromptsProvider hasSelectedPrompt={hasSelectedPrompt}>
        <div>
          {label && (
            <Body className={cx(labelStyles, labelThemeStyles[theme])}>
              {label}
            </Body>
          )}
          <div className={baseStyles} ref={ref} {...rest}>
            {children}
          </div>
        </div>
      </MessagePromptsProvider>
    );
  }
);

MessagePrompts.displayName = 'MessagePrompts';
