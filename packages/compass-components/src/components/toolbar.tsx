import React from 'react';
import { cx, css } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { withTheme } from '../hooks/use-theme';
import { gray8 } from '../compass-ui-colors';

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
  children: JSX.Element;
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
