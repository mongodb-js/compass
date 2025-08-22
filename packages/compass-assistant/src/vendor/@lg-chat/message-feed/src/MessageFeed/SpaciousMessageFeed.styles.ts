import { avatarSizes, Size } from '@lg-chat/avatar';

import { css, cx } from '@mongodb-js/compass-components';
import { breakpoints, spacing } from '@mongodb-js/compass-components';

const baseContainerStyles = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scroll-behavior: smooth;
  position: relative;
  max-width: ${breakpoints.Tablet +
  (avatarSizes[Size.Default] + spacing[800] + spacing[400]) * 2}px;
  padding: ${spacing[400]}px ${spacing[800]}px ${spacing[200]}px;
`;

export const getContainerStyles = (className?: string) =>
  cx(baseContainerStyles, className);

export const disclaimerTextStyles = css`
  text-align: center;
  margin-top: ${spacing[600]}px;
  margin-bottom: ${spacing[1600]}px;
`;

// Avatar size + horizontal gap in Message
const baseAvatarPaddingStyles = css`
  padding: 0px ${avatarSizes[Size.Small] + spacing[200]}px;
`;

const desktopAvatarPaddingStyles = css`
  padding: 0px ${avatarSizes[Size.Default] + spacing[400]}px;
`;

export const getAvatarPaddingStyles = (isDesktop: boolean) =>
  cx(baseAvatarPaddingStyles, {
    [desktopAvatarPaddingStyles]: isDesktop,
  });
