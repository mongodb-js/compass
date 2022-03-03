import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { withTheme } from '../hooks/use-theme';
import { gray8 } from '../compass-ui-colors';

const workspaceContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  overflow: 'auto',
});

const lightThemeStyles = css({
  backgroundColor: gray8,
  color: uiColors.gray.dark2,
});

const darkThemeStyles = css({
  backgroundColor: uiColors.gray.dark3,
  color: uiColors.white,
});

type WorkspaceContainerProps = {
  className?: string;
  darkMode?: boolean;
  children: JSX.Element;
  'data-test-id'?: string;
};

function UnthemedWorkspaceContainer({
  className,
  darkMode,
  children,
  'data-test-id': dataTestId,
}: WorkspaceContainerProps) {
  return (
    <div
      className={cx(
        workspaceContainerStyles,
        darkMode ? darkThemeStyles : lightThemeStyles,
        className
      )}
      data-test-id={dataTestId}
    >
      {children}
    </div>
  );
}

const WorkspaceContainer = withTheme(UnthemedWorkspaceContainer);

export { WorkspaceContainer };
