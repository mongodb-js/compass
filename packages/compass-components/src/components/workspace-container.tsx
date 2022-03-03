import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { useTheme, Theme } from '../hooks/use-theme';
import { spacing } from '@leafygreen-ui/tokens';
import { gray8 } from '../compass-ui-colors';

const workspaceContainerStyles = css({
  // width: '100%',
  // // height: '100%',
  // position: 'relative',
  // overflow: 'auto',
  // flexGrow: 1,
  // height: '100vh'

  // flex: 1,
  // overflow: 'hidden',
  // // display: 'grid',
  // gridTemplateRows: 'auto 1fr',
  // gridTemplateColumns: '100%',
  // display: 'flex'

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

const workspaceStyles = css({
  height: '100%',
  flex: 1,
  marginBottom: spacing[5],
  padding: 0,
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
