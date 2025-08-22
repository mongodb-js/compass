import { css, cx, keyframes } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import {
  color,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

const ELLIPSIS_WIDTH = 10;

export const statusContainerStyles = css`
  width: 100%;
  position: relative;
`;

export const loadingContainerStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[150]}px;
  margin-bottom: ${spacing[150]}px;
`;

const getBaseLoadingTextStyles = (theme: shim_Theme) => css`
  color: ${color[theme].text[Variant.Secondary][InteractionState.Default]};
`;

const ellipsisAnimation = keyframes`
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: '...'; }
`;

export const loadingEllipsisStyles = css`
  &::after {
    content: '';
    animation: ${ellipsisAnimation} 1.5s infinite;
    display: inline-block;
    width: ${ELLIPSIS_WIDTH}px;
  }
`;

export const getLoadingTextStyles = (theme: shim_Theme) =>
  cx(getBaseLoadingTextStyles(theme), loadingEllipsisStyles);

export const bannerStyles = css`
  margin-bottom: ${spacing[300]}px;
`;

export const bannerContentContainerStyles = css`
  display: flex;
  gap: ${spacing[200]}px;
`;
