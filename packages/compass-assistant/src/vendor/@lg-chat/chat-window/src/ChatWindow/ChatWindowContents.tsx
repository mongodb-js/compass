import React, { ForwardedRef, forwardRef, ReactChild } from 'react';
import flattenChildren from 'react-keyed-flatten-children';
import {
  useLeafyGreenChatContext,
  Variant,
} from '../../../leafygreen-chat-provider/src/index';
import { TitleBar } from '../../../title-bar/src/index';

import { Theme, useDarkMode } from '@mongodb-js/compass-components';
import { isComponentType } from '@mongodb-js/compass-components';
import { breakpoints } from '@mongodb-js/compass-components';

import {
  contentContainerStyles,
  getContainerStyles,
  getInputBarStyles,
  getInputBarWrapperStyles,
} from './ChatWindow.styles';
import { ChatWindowProps } from '.';

export const ChatWindowContents = forwardRef(
  (
    {
      children,
      className,
      darkMode: darkModeProp,
      title,
      badgeText,
      onClose,
      iconSlot,
      ...rest
    }: ChatWindowProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const darkMode = useDarkMode(darkModeProp);
    const theme = darkMode ? Theme.Dark : Theme.Light;
    const { containerWidth, variant } = useLeafyGreenChatContext();

    const isCompact = variant === Variant.Compact;
    const isMobile = !!containerWidth && containerWidth < breakpoints.Tablet;
    const flattenedChildren = flattenChildren(children) as Array<ReactChild>;
    const renderedChildren = flattenedChildren.map((child) => {
      if (isComponentType(child, 'InputBar')) {
        return (
          <div
            className={getInputBarWrapperStyles({
              isCompact,
              isMobile,
            })}
            key="input-bar-container"
          >
            <div className={getInputBarStyles(isCompact)}>{child}</div>
          </div>
        );
      } else {
        return child;
      }
    });

    return (
      <div
        className={getContainerStyles({
          className,
          isCompact,
          theme,
        })}
        ref={ref}
        {...rest}
      >
        {!isCompact && (
          <TitleBar
            title={title}
            badgeText={badgeText}
            onClose={onClose}
            iconSlot={iconSlot}
          />
        )}
        <div className={contentContainerStyles}>{renderedChildren}</div>
      </div>
    );
  }
);

ChatWindowContents.displayName = 'ChatWindowContents';
