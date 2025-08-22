import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import {
  color,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

export const containerStyles = css`
  display: flex;
  gap: ${spacing[100]}px;
  align-items: center;
`;

export const getIconFill = (theme: shim_Theme) =>
  color[theme].icon[Variant.Success][InteractionState.Default];

export const getTextStyles = (theme: shim_Theme) => css`
  color: ${color[theme].text[Variant.Secondary][InteractionState.Default]};
`;
