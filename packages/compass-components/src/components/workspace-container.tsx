import React, { useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { Theme, useTheme, withTheme } from '../hooks/use-theme';
import { spacing } from '@leafygreen-ui/tokens';
import { transparentize } from 'polished';
import { useInView } from 'react-intersection-observer';

const workspaceContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const toolbarStyles = css({
  flex: 'none',
});

const scrollBoxStyles = css({
  flex: 1,
  width: '100%',
  minHeight: 0,
  position: 'relative',
  zIndex: 0,
});

const shadowHeight = spacing[1];

const shadowStyles = css({
  position: 'absolute',
  top: 0,
  display: 'block',
  width: '100%',
  height: shadowHeight,
  borderTop: `1px solid`,
  flex: 'none',
  zIndex: 1,
});

const shadowStylesLight = css({
  borderColor: uiColors.gray.light2,
  background: `linear-gradient(${transparentize(
    0.9,
    uiColors.black
  )} 0%, ${transparentize(1, uiColors.black)} 100%)`,
});

const shadowStylesDark = css({
  borderColor: uiColors.gray.dark2,
  background: `linear-gradient(${transparentize(
    0.3,
    uiColors.black
  )} 0%, ${transparentize(1, uiColors.black)} 100%)`,
});

const workspaceContentStyles = css({
  overflow: 'auto',
  height: '100%',
  width: '100%',
  display: 'block',
  // make sure that the content never renders over
  // the shadow
  position: 'relative',
  zIndex: 0,
});

const lightThemeStyles = css({
  color: uiColors.gray.dark2,
  backgroundColor: uiColors.white,
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
  const theme = useTheme();
  const scrollContainer = useRef(null);

  const [scrollDetectionTrigger, triggerStillInView] = useInView({
    root: scrollContainer.current,
  });

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
      {toolbar && <div className={toolbarStyles}>{toolbar}</div>}
      <div className={scrollBoxStyles} ref={scrollContainer}>
        {triggerStillInView || (
          <div
            className={cx(
              shadowStyles,
              theme.theme === Theme.Dark ? shadowStylesDark : shadowStylesLight
            )}
          ></div>
        )}
        <div className={workspaceContentStyles}>
          <div ref={scrollDetectionTrigger}></div>
          {children}
        </div>
      </div>
    </div>
  );
}

const WorkspaceContainer = withTheme(UnthemedWorkspaceContainer);

export { WorkspaceContainer };
