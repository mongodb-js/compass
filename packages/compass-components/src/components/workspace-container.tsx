import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { withTheme } from '../hooks/use-theme';

type ToolbarProps = {
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
};

function Toolbar({
  children,
  'data-testid': dataTestId,
  className,
}: ToolbarProps) {
  return (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
}

import { spacing } from '@leafygreen-ui/tokens';
import { transparentize } from 'polished';

const scrollboxStyles = css({
  height: '100%',
  width: '100%',
  display: 'block',
  '::before': {
    content: '""',
    position: 'sticky',
    top: 0,
    display: 'block',
    width: '100%',
    height: spacing[1],
    borderTop: `1px solid ${uiColors.gray.light2}`,
    background: `linear-gradient(${transparentize(
      0.89,
      uiColors.black
    )} 0%, ${transparentize(1, uiColors.black)} 100%)`,
    zIndex: 2,
  },
});

const toolbarStyles = css({
  flex: 'none',
});

const scrollArea = css({
  overflow: 'auto',
  height: '100%',
  width: '100%',
  display: 'block',
});

function ScrollBox({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx(className, scrollboxStyles)}>
      <div className={scrollArea}>{children}</div>
    </div>
  );
}

const workspaceContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const scrollAreaStyles = css({
  display: 'flex',
  flex: 1,
  width: '100%',
  minHeight: 0,
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
      {toolbar && <Toolbar className={toolbarStyles}>{toolbar}</Toolbar>}
      <div className={scrollAreaStyles}>
        <ScrollBox>{children}</ScrollBox>
      </div>
    </div>
  );
}

const WorkspaceContainer = withTheme(UnthemedWorkspaceContainer);

export { WorkspaceContainer };
