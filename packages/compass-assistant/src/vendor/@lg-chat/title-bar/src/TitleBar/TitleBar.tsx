import React, { ForwardedRef, forwardRef } from 'react';
import { Avatar, Variant as ChatAvatarVariant } from '@lg-chat/avatar';

import Badge from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import XIcon from '@mongodb-js/compass-components';
import IconButton from '@mongodb-js/compass-components';
import LeafyGreenProvider, {
  useDarkMode,
} from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import {
  baseStyles,
  contentAlignmentStyles,
  contentContainerStyles,
  themeStyles,
} from './TitleBar.styles';
import { Align, TitleBarProps } from '.';

export const TitleBar = forwardRef(
  (
    {
      title,
      className,
      align = Align.Center,
      onClose,
      badgeText,
      darkMode: darkModeProp,
      iconSlot,
      ...rest
    }: TitleBarProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { darkMode, theme } = useDarkMode(darkModeProp);
    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <div
          className={cx(baseStyles, themeStyles[theme], className)}
          {...rest}
          ref={ref}
        >
          <div
            className={cx(contentContainerStyles, {
              [contentAlignmentStyles]: align === Align.Center,
            })}
          >
            <Avatar variant={ChatAvatarVariant.Mongo} sizeOverride={24} />
            <Body>
              <strong>{title}</strong>
            </Body>
            {badgeText && <Badge variant="blue">{badgeText}</Badge>}
          </div>
          {!!onClose && (
            <IconButton aria-label="Close chat" onClick={onClose}>
              {iconSlot ? iconSlot : <XIcon />}
            </IconButton>
          )}
        </div>
      </LeafyGreenProvider>
    );
  }
);

TitleBar.displayName = 'TitleBar';
