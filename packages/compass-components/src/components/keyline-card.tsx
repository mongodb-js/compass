import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { withTheme } from '../hooks/use-theme';

const keylineStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[2],
});

const keylineLightThemeStyles = css({
  background: palette.white,
});
const keylineDarkThemeStyles = css({
  background: palette.gray.dark3,
  borderColor: palette.gray.dark2,
});

interface KeylineProps extends React.HTMLProps<HTMLDivElement> {
  darkMode?: boolean;
}

function UnthemedKeyline({
  darkMode,
  className,
  ...props
}: React.PropsWithChildren<KeylineProps>): React.ReactElement {
  return (
    <div
      className={cx(
        darkMode ? keylineDarkThemeStyles : keylineLightThemeStyles,
        keylineStyles,
        className
      )}
      {...props}
    ></div>
  );
}

const KeylineCard = withTheme(UnthemedKeyline);

export { KeylineCard };
