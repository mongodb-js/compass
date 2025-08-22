import React, { ForwardedRef, forwardRef } from 'react';
import { useLeafyGreenChatContext } from '@lg-chat/leafygreen-chat-provider';

import { Avatar, Format, getInitials } from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import { useDarkMode } from '@mongodb-js/compass-components';
import { breakpoints } from '@mongodb-js/compass-components';

import {
  iconAvatarStyleOverrides,
  logoAvatarStyleOverrides,
  textAvatarStyleOverrides,
} from './ChatAvatar.styles';
import {
  type ChatAvatarProps,
  ChatAvatarSize,
  ChatAvatarVariant,
} from './ChatAvatar.types';

export const chatAvatarSizeMap: Record<ChatAvatarSize, number> = {
  [ChatAvatarSize.Default]: 52,
  [ChatAvatarSize.Small]: 40,
};

export const variantToAvatarFormatMap: Record<ChatAvatarVariant, Format> = {
  [ChatAvatarVariant.Default]: Format.Icon,
  [ChatAvatarVariant.Mongo]: Format.MongoDB,
  [ChatAvatarVariant.User]: Format.Text,
};

/**
 * Returns the Avatar Format mapped from ChatAvatarVariant,
 * unless the `initials` property is `null`, then returns `Format.Icon`
 */
export const getFormat = (
  variant: ChatAvatarVariant,
  initials?: string | null
) => {
  const _format = variantToAvatarFormatMap[variant];

  if (_format === Format.Text && !initials) {
    return Format.Icon;
  }

  return _format;
};

/**
 * @deprecated Use `Avatar` from `@mongodb-js/compass-components instead.
 */
export const ChatAvatar = forwardRef(
  (
    {
      variant = ChatAvatarVariant.Default,
      size: sizeProp,
      sizeOverride: sizeOverrideProp,
      darkMode: darkModeProp,
      name,
      ...rest
    }: ChatAvatarProps,
    fwdRef: ForwardedRef<HTMLDivElement>
  ) => {
    const darkMode = useDarkMode(darkModeProp);
    const theme = darkMode ? Theme.Dark : Theme.Light;
    const { containerWidth } = useLeafyGreenChatContext();
    const size =
      sizeProp || (containerWidth && containerWidth < breakpoints.Tablet)
        ? ChatAvatarSize.Small
        : ChatAvatarSize.Default;

    const sizeOverride = sizeOverrideProp ?? chatAvatarSizeMap[size];
    const { initials } = getInitials(name);
    const format = getFormat(variant, initials);
    const testid = (() => {
      switch (variant) {
        case 'mongo':
          return 'mongo-avatar';
        case 'user':
          return 'user-avatar';
        case 'default':
        default:
          return 'fallback-avatar';
      }
    })();

    return (
      <Avatar
        ref={fwdRef}
        format={format}
        text={initials ?? ''}
        glyph="Person"
        sizeOverride={sizeOverride}
        data-testid={testid}
        className={cx({
          [textAvatarStyleOverrides]: variant === ChatAvatarVariant.User,
          [iconAvatarStyleOverrides(theme)]:
            variant === ChatAvatarVariant.Default,
          [logoAvatarStyleOverrides(theme)]:
            variant === ChatAvatarVariant.Mongo,
        })}
        {...rest}
      />
    );
  }
);

ChatAvatar.displayName = 'Avatar';
