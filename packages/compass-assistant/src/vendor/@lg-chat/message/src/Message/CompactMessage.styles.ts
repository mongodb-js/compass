import { css, cx } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { color, InteractionState, Variant, spacing } = shim_tokens;

const getBaseContainerStyles = (theme: shim_Theme) => css`
  display: flex;
  flex-direction: column;
  gap: ${spacing[150]}px;
  align-items: flex-start;
  color: ${color[theme].text[Variant.Primary][InteractionState.Default]};
`;

const senderStyles = css`
  align-items: flex-end;
`;

export const getContainerStyles = ({
  className,
  isSender,
  theme,
}: {
  className?: string;
  isSender: boolean;
  theme: shim_Theme;
}) =>
  cx(
    getBaseContainerStyles(theme),
    {
      [senderStyles]: isSender,
    },
    className
  );

export const avatarContainerStyles = css`
  display: flex;
  gap: ${spacing[150]}px;
`;
