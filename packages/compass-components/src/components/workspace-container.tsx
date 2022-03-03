import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { useTheme, Theme } from '../hooks/use-theme';
// import { spacing } from '@leafygreen-ui/tokens';
import { gray8 } from '../compass-ui-colors';

const workspaceContainerStyles = css({
  height: '100%',
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  display: 'flex',
  overflowY: 'scroll',
});

const lightThemeStyles = css({
  backgroundColor: gray8,
});

const darkThemeStyles = css({
  backgroundColor: uiColors.gray.dark1,
});

function WorkspaceContainer({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const theme = useTheme();

  return (
    <div
      className={cx(
        workspaceContainerStyles,
        theme?.theme === Theme.Dark ? darkThemeStyles : lightThemeStyles
      )}
    >
      {/* <div
        className={cx(workspaceStyles)}
      > */}
      {children}
      {/* </div> */}
    </div>
  );
}

export { WorkspaceContainer };
