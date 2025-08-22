import React from 'react';

import CheckmarkWithCircle from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import { InlineMessageFeedbackProps } from '..';

import {
  containerStyles,
  getIconFill,
  getTextStyles,
} from './SubmittedState.styles';

export const SubmittedState = ({
  submittedMessage,
}: Pick<InlineMessageFeedbackProps, 'submittedMessage'>) => {
  const { theme } = shim_useDarkMode();

  return (
    <div className={containerStyles}>
      <CheckmarkWithCircle fill={getIconFill(theme)} />
      <Body className={getTextStyles(theme)}>{submittedMessage}</Body>
    </div>
  );
};
