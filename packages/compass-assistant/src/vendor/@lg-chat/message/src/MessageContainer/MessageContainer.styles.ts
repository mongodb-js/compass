import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { borderRadius, spacing } from '@mongodb-js/compass-components';

import { Variant } from './MessageContainer.types';

const baseStyles = css`
  position: relative;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  display: flex;
  flex-direction: column;
  gap: ${spacing[200]}px;
`;

const getCompactPrimaryVariantStyles = (theme: Theme) => css`
  border-radius: ${borderRadius[300]}px ${borderRadius[300]}px 0;
  background-color: ${palette.gray[theme === Theme.Dark ? 'dark2' : 'light2']};
  padding: ${spacing[300]}px;
`;

const getCompactStyles = ({
  theme,
  variant,
}: {
  theme: Theme;
  variant: Variant;
}) =>
  cx({
    [getCompactPrimaryVariantStyles(theme)]: variant === Variant.Primary,
  });

const baseSpaciousContainerStyles = css`
  border-radius: ${borderRadius[300]}px;
  /* Card Shadow */
  box-shadow: 0px 4px 10px -4px ${palette.black}4D; // 4D is 30% opacity
  padding: ${spacing[600]}px;
`;

const spaciousVariantThemeStyles: Record<Variant, Record<Theme, string>> = {
  [Variant.Primary]: {
    [Theme.Dark]: css`
      background-color: ${palette.green.dark3};
    `,
    [Theme.Light]: css`
      background-color: ${palette.green.light3};
    `,
  },
  [Variant.Secondary]: {
    [Theme.Dark]: css`
      background-color: ${palette.gray.dark3};
    `,
    [Theme.Light]: css`
      background-color: ${palette.white};
    `,
  },
};

const getSpaciousContainerStyles = ({
  theme,
  variant,
}: {
  theme: Theme;
  variant: Variant;
}) =>
  cx(baseSpaciousContainerStyles, spaciousVariantThemeStyles[variant][theme]);

export const getMessageContainerStyles = ({
  className,
  isCompact,
  theme,
  variant,
}: {
  className?: string;
  isCompact: boolean;
  theme: Theme;
  variant: Variant;
}) =>
  cx(
    baseStyles,
    {
      [getCompactStyles({ theme, variant })]: isCompact,
      [getSpaciousContainerStyles({ theme, variant })]: !isCompact,
    },
    className
  );
