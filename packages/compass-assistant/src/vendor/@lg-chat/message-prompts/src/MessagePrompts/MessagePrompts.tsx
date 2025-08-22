import React, { ForwardedRef, forwardRef } from 'react';

import { cx } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';
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
    const { theme } = shim_useDarkMode(darkModeProp);
    const hasSelectedPrompt: boolean = React.Children.toArray(children).some(
      (child) =>
        shim_lib.isComponentType(child, 'MessagePrompt') && child.props.selected
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
