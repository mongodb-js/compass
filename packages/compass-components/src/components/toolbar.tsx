import React from 'react';
import { cx, css } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { withTheme } from '../hooks/use-theme';
import { gray8 } from '../compass-ui-colors';

const toolbarStyles = css({
  boxShadow: `rgb(0 30 43 / 10%) 0px ${spacing[1]}px ${spacing[1]}px 0px`,
});

const toolbarLightThemeStyles = css({
  backgroundColor: gray8,
  color: uiColors.gray.dark2,
});

const toolbarDarkThemeStyles = css({
  backgroundColor: uiColors.gray.dark3,
  color: uiColors.white,
});

type ToolbarProps = {
  className?: string;
  darkMode?: boolean;
  children: React.ReactNode;
  'data-testid'?: string;
};
function UnthemedToolbar({
  darkMode,
  children,
  className,
  'data-testid': dataTestId,
}: ToolbarProps) {
  return (
    <div
      className={cx(
        toolbarStyles,
        darkMode ? toolbarDarkThemeStyles : toolbarLightThemeStyles,
        className
      )}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

const Toolbar = withTheme(UnthemedToolbar);

export { Toolbar };
