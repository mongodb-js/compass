import { css, cx } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { addOverflowShadow, Side } = shim_tokens;

const DEFAULT_MESSAGE_FEED_HEIGHT = 500;

const baseWrapperStyles = css`
  height: ${DEFAULT_MESSAGE_FEED_HEIGHT}px;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const wrapperThemeStyles: Record<shim_Theme, string> = {
  [shim_Theme.Dark]: css`
    background-color: ${palette.black};
  `,
  [shim_Theme.Light]: css`
    background-color: ${palette.gray.light3};
  `,
};

export const getWrapperStyles = ({
  className,
  hasBottomShadow,
  hasTopShadow,
  isCompact,
  theme,
}: {
  className?: string;
  hasBottomShadow: boolean;
  hasTopShadow: boolean;
  isCompact: boolean;
  theme: shim_Theme;
}) =>
  cx(
    baseWrapperStyles,
    {
      [wrapperThemeStyles[theme]]: !isCompact,
      [addOverflowShadow({ side: Side.Top, theme, isInside: true })]:
        hasTopShadow,
      [addOverflowShadow({ side: Side.Bottom, theme, isInside: true })]:
        hasBottomShadow,
    },
    className
  );
