import { css, cx } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  borderRadius,
  breakpoints,
  spacing,
  shim_tokens,
} from '@mongodb-js/compass-components';
const { color, InteractionState, Variant } = shim_tokens;
const baseContainerStyles = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
`;

const getSpaciousContainerStyles = (theme: shim_Theme) => css`
  border-radius: ${borderRadius[200]}px;
  overflow: hidden;
  border: 1px solid
    ${color[theme].border[Variant.Secondary][InteractionState.Default]};
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.05);
  background-color: ${theme === shim_Theme.Dark
    ? palette.black
    : palette.gray.light3};
`;

export const getContainerStyles = ({
  className,
  isCompact,
  theme,
}: {
  className?: string;
  isCompact: boolean;
  theme: shim_Theme;
}) =>
  cx(
    baseContainerStyles,
    {
      [getSpaciousContainerStyles(theme)]: !isCompact,
    },
    className
  );

export const contentContainerStyles = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const baseInputBarWrapperStyles = css`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const compactInputBarWrapperStyles = css`
  padding: 0 ${spacing[400]}px ${spacing[400]}px;
`;

const spaciousInputBarWrapperStyles = css`
  padding: ${spacing[400]}px ${spacing[800]}px ${spacing[800]}px;
`;

const spaciousInputBarWrapperMobileStyles = css`
  padding-top: ${spacing[200]}px;
`;

export const getInputBarWrapperStyles = ({
  isCompact,
  isMobile,
}: {
  isCompact: boolean;
  isMobile: boolean;
}) =>
  cx(baseInputBarWrapperStyles, {
    [compactInputBarWrapperStyles]: isCompact,
    [spaciousInputBarWrapperStyles]: !isCompact,
    [spaciousInputBarWrapperMobileStyles]: !isCompact && isMobile,
  });

const baseInputBarStyles = css`
  width: 100%;
`;

const spaciousInputBarStyles = css`
  max-width: ${breakpoints.Tablet}px;
`;

export const getInputBarStyles = (isCompact: boolean) =>
  cx(baseInputBarStyles, {
    [spaciousInputBarStyles]: !isCompact,
  });
