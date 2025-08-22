import React, { forwardRef } from 'react';

import { getContainerStyles } from './CompactMessageFeed.styles';
import { type MessageFeedProps } from './MessageFeed.types';

export const CompactMessageFeed = forwardRef<HTMLDivElement, MessageFeedProps>(
  ({ children, className, ...rest }, fwdRef) => {
    return (
      <div className={getContainerStyles(className)} ref={fwdRef} {...rest}>
        {children}
      </div>
    );
  }
);

CompactMessageFeed.displayName = 'CompactMessageFeed';
