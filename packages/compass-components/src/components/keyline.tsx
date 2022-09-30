import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { withTheme } from '../hooks/use-theme';

const keylineStyles = css({
  border: `1px solid ${uiColors.gray.light2}`,
  borderRadius: spacing[2],
  overflow: 'hidden',
});

const keylineLightThemeStyles = css({
  background: uiColors.white,
});
const keylineDarkThemeStyles = css({
  background: uiColors.gray.dark3,
  borderColor: uiColors.gray.dark2,
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

const Keyline = withTheme(UnthemedKeyline);

export { Keyline };
