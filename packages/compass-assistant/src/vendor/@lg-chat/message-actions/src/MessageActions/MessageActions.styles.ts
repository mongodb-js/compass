import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import {
  color,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

/** divider sizes from design specs */
const dividerSizes = {
  height: 24,
  width: 1,
} as const;

const baseContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing[200]}px;
`;

const submittedContainerStyles = css`
  flex-direction: row;
  align-items: center;
`;

export const getContainerStyles = ({
  className,
  isSubmitted,
}: {
  className?: string;
  isSubmitted: boolean;
}) =>
  cx(
    baseContainerStyles,
    {
      [submittedContainerStyles]: isSubmitted,
    },
    className
  );

export const actionBarStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
`;

export const primaryActionsContainerStyles = css`
  display: flex;
  gap: ${spacing[100]}px;
`;

export const getDividerStyles = (theme: Theme) => css`
  height: ${dividerSizes.height}px;
  width: ${dividerSizes.width}px;
  background-color: ${color[theme].border[Variant.Secondary][
    InteractionState.Default
  ]};
`;
