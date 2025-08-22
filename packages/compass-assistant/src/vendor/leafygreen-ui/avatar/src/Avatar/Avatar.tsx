import React, { forwardRef } from 'react';

import { cx } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { Size } from '@mongodb-js/compass-components';

import { getAvatarStyles } from './Avatar.styles';
import { AvatarProps } from './Avatar.types';
import { AvatarContents } from './AvatarContents';

/**
 * The Avatar component is a user interface element that represents an individual user or entity within a digital platform or application. Avatars serve as visual identifiers, often depicting a user's profile picture or a symbolic representation, such as initials or an Icon. The primary purpose of Avatars is to provide a visual cue about the identity of the associated user or entity.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (props, fwdRef) => {
    const {
      darkMode,
      format,
      size = Size.Default,
      sizeOverride,
      className,
      ...rest
    } = props;
    const { theme } = shim_useDarkMode(darkMode);

    return (
      <div
        ref={fwdRef}
        className={cx(
          getAvatarStyles({ size, theme, format, sizeOverride }),
          className
        )}
        data-testid="lg-avatar"
        {...rest}
      >
        <AvatarContents {...props} />
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Water. Earth. Fire. Air.
 * Long ago, the four nations lived together in harmony.
 * Then, everything changed when the Fire Nation attacked
 */
