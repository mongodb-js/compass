import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import {
  color,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

export const containerStyles = css`
  container-type: inline-size;
  margin-bottom: ${spacing[200]}px;
`;

export const getDividerStyles = (theme: shim_Theme) => css`
  border: 1px solid
    ${color[theme].border[Variant.Secondary][InteractionState.Default]};
`;

export const linksHeadingStyles = css`
  margin-bottom: ${spacing[200]}px;
`;
