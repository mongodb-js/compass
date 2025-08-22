import { css, cx } from '@mongodb-js/compass-components';
import { shim_lib, shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  borderRadius,
  breakpoints,
  shim_tokens,
  spacing,
} from '@mongodb-js/compass-components';

const { color, InteractionState, Variant } = shim_tokens;

export const messageClassName = shim_lib.createUniqueClassName('lg-message');
export const senderClassName =
  shim_lib.createUniqueClassName('lg-message-sender');
/** @deprecated */
export const avatarClassName =
  shim_lib.createUniqueClassName('lg-message-avatar');

// Unless otherwise indicated, styles are defined as left-aligned and mobile-first by default

const getBaseContainerStyles = (theme: shim_Theme) => css`
  display: flex;
  gap: ${spacing[200]}px;
  align-items: flex-end;
  width: 100%;
  color: ${color[theme].text[Variant.Primary][InteractionState.Default]};

  &:not(:first-child):not(:nth-last-child(2)):not(:last-child) {
    margin-bottom: ${spacing[400]}px;
  }
`;

const rightAlignedStyles = css`
  justify-content: flex-end;
`;

const tabletContainerStyles = css`
  gap: ${spacing[400]}px;
`;

/**
 * @deprecated move this to MessageFeed
 */
const desktopContainerStyles = css`
  &:not(:first-child):not(:nth-last-child(2)):not(:last-child) {
    margin-bottom: ${spacing[600]}px;
  }
`;

export const getContainerStyles = ({
  className,
  isDesktop,
  isMobile,
  isRightAligned,
  isSender,
  theme,
}: {
  className?: string;
  isDesktop: boolean;
  isMobile: boolean;
  isRightAligned: boolean;
  isSender: boolean;
  theme: shim_Theme;
}) =>
  cx(
    messageClassName,
    getBaseContainerStyles(theme),
    {
      [senderClassName]: isSender,
      [rightAlignedStyles]: isRightAligned,
      [tabletContainerStyles]: !isMobile,
      [desktopContainerStyles]: isDesktop,
    },
    className
  );

const hiddenStyles = css`
  display: none;
`;

const invisibleStyles = css`
  display: block;
  visibility: hidden;
`;

export const getAvatarWrapperStyles = ({
  shouldHide,
  shouldBeInvisible,
}: {
  shouldHide: boolean;
  shouldBeInvisible: boolean;
}) =>
  cx(avatarClassName, {
    [hiddenStyles]: shouldHide,
    [invisibleStyles]: shouldBeInvisible,
  });

export const messageContainerWrapperStyles = css`
  max-width: ${breakpoints.Tablet}px;
`;

const sharedMessageContainerWedgeStyles = css`
  // Left wedge
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: ${spacing[200]}px;
    height: 100%;
    border-radius: ${borderRadius[600]}px 0px 0px ${borderRadius[600]}px;
  }
`;

const messageContainerWedgeStyles = {
  [shim_Theme.Dark]: css`
    ${sharedMessageContainerWedgeStyles}
    &::before {
      background-color: ${palette.green.base};
    }
  `,
  [shim_Theme.Light]: css`
    ${sharedMessageContainerWedgeStyles}
    &::before {
      background-color: ${palette.green.dark2};
    }
  `,
};

export const getMessageContainerWedgeStyles = ({
  showVerified,
  theme,
}: {
  showVerified: boolean;
  theme: shim_Theme;
}) =>
  cx({
    [messageContainerWedgeStyles[theme]]: showVerified,
  });
