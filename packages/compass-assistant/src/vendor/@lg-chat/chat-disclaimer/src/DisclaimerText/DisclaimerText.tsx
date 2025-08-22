import React from 'react';

import { Body, Disclaimer } from '@mongodb-js/compass-components';

import { titleStyles } from './DisclaimerText.styles';
import { DisclaimerTextProps } from './DisclaimerText.types';

export const DisclaimerText = ({
  title,
  children,
  ...rest
}: DisclaimerTextProps) => {
  return (
    <div {...rest}>
      {title && (
        <Body weight="medium" className={titleStyles}>
          {title}
        </Body>
      )}
      <Disclaimer>{children}</Disclaimer>
    </div>
  );
};

DisclaimerText.displayName = 'DisclaimerText';
