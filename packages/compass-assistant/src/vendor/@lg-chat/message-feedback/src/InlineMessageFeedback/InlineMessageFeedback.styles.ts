import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import {
  borderRadius,
  color,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

/** match height of the close IconButton which may not render */
const HEADER_CONTAINER_HEIGHT = 28;

const baseFormContainerStyles = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${spacing[200]}px;
`;

const getCompactFormContainerStyles = (theme: Theme) => css`
  border: 1px solid
    ${color[theme].border[Variant.Primary][InteractionState.Default]};
  border-radius: ${borderRadius[200]}px;
  gap: ${spacing[200]}px ${spacing[300]}px;
`;

export const getFormContainerStyles = ({
  isCompact,
  theme,
}: {
  isCompact: boolean;
  theme: Theme;
}) =>
  cx(baseFormContainerStyles, {
    [getCompactFormContainerStyles(theme)]: isCompact,
  });

// Alternate padding used to align close IconButton with submit Button
export const getHeaderContainerStyles = ({
  isCompact,
}: {
  isCompact: boolean;
}) => css`
  height: ${HEADER_CONTAINER_HEIGHT}px;
  padding: ${isCompact
    ? `${spacing[200]}px ${spacing[200]}px 0 ${spacing[400]}px`
    : 0};
  display: flex;
  align-items: center;
`;

export const labelStyles = css`
  flex: 1;
`;

const baseBodyContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing[200]}px;
`;

const compactBodyContainerStyles = css`
  padding: 0 ${spacing[400]}px ${spacing[400]}px;
  flex-direction: row;
  gap: ${spacing[300]}px;
`;

export const getBodyContainerStyles = ({ isCompact }: { isCompact: boolean }) =>
  cx(baseBodyContainerStyles, {
    [compactBodyContainerStyles]: isCompact,
  });

const baseTextAreaStyles = css`
  width: 100%;
`;

export const getTextAreaStyles = (className?: string) =>
  cx(baseTextAreaStyles, className);

export const actionContainerStyles = css`
  display: flex;
  gap: ${spacing[200]}px;
  justify-content: flex-end;
  align-items: flex-end;
`;
