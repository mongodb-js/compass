import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { withTheme } from '../hooks/use-theme';
import { Toolbar } from './toolbar';
import { ScrollBox } from './scrollbox';

const workspaceContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const scrollAreaStyles = css({
  flex: 1,
  display: 'flex',
  height: '100%',
  width: '100%',
});

const lightThemeStyles = css({
  color: uiColors.gray.dark2,
});

const darkThemeStyles = css({
  backgroundColor: uiColors.gray.dark3,
  color: uiColors.white,
});

type WorkspaceContainerProps = {
  darkMode?: boolean;
  toolbar?: React.ReactNode;
  'data-testid'?: string;
};

function UnthemedWorkspaceContainer({
  className,
  darkMode,
  children,
  toolbar,
  'data-testid': dataTestId,
  ...props
}: React.PropsWithChildren<
  WorkspaceContainerProps & React.HTMLProps<HTMLDivElement>
>) {
  return (
    <div
      className={cx(
        workspaceContainerStyles,
        darkMode ? darkThemeStyles : lightThemeStyles,
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      {toolbar && <Toolbar>{toolbar}</Toolbar>}
      <div className={scrollAreaStyles}>
        <ScrollBox>{children}</ScrollBox>
      </div>
    </div>
  );
}

const WorkspaceContainer = withTheme(UnthemedWorkspaceContainer);

export { WorkspaceContainer };
