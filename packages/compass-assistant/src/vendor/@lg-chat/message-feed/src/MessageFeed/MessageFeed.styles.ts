import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { addOverflowShadow, Side } from '@mongodb-js/compass-components';

const DEFAULT_MESSAGE_FEED_HEIGHT = 500;

const baseWrapperStyles = css`
  height: ${DEFAULT_MESSAGE_FEED_HEIGHT}px;
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const wrapperThemeStyles: Record<Theme, string> = {
  [Theme.Dark]: css`
    background-color: ${palette.black};
  `,
  [Theme.Light]: css`
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
  theme: Theme;
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
