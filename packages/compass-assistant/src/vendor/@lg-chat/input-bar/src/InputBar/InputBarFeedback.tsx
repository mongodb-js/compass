import React, { forwardRef } from 'react';

import { Banner } from '@mongodb-js/compass-components';
import { Button } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { Body, shim_typography } from '@mongodb-js/compass-components';
const { Error } = shim_typography;

import {
  bannerContentContainerStyles,
  bannerStyles,
  getLoadingTextStyles,
  loadingContainerStyles,
  statusContainerStyles,
} from './InputBarFeedback.styles';
import { InputBarFeedbackProps } from './InputBarFeedback.types';
import { State } from './shared.types';
import { AssistantAvatar } from '@vendor-leafygreen-ui/avatar';

const messages = {
  defaultError: 'Oops... Something went wrong.',
  loading: 'MongoDB Assistant is thinking',
  retryButton: 'Retry',
} as const;

export const InputBarFeedback = forwardRef<
  HTMLDivElement,
  InputBarFeedbackProps
>(({ darkMode: darkModeProp, errorMessage, state, ...rest }, fwdRef) => {
  const { darkMode, theme } = shim_useDarkMode(darkModeProp);

  return (
    <div
      aria-live="polite"
      aria-relevant="all"
      className={statusContainerStyles}
      ref={fwdRef}
      {...rest}
    >
      {state === State.Loading && (
        <div className={loadingContainerStyles}>
          <AssistantAvatar darkMode={darkMode} size={20} />
          <Body className={getLoadingTextStyles(theme)}>
            {messages.loading}
          </Body>
        </div>
      )}

      {state === State.Error && (
        <Banner variant="danger" className={bannerStyles}>
          <div className={bannerContentContainerStyles}>
            <Error>{errorMessage || messages.defaultError}</Error>
            <Button size="xsmall" type="submit">
              {messages.retryButton}
            </Button>
          </div>
        </Banner>
      )}
    </div>
  );
});

InputBarFeedback.displayName = 'InputBarFeedback';
