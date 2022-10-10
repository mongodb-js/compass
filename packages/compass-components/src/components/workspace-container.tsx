import React, { useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { withTheme } from '../hooks/use-theme';
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

const shadowHeight = spacing[4];

const shadowContainerStyles = css({
  overflow: 'hidden',
  position: 'absolute',
  top: 0,
  display: 'block',
  width: '100%',
  height: shadowHeight * 2,
  flex: 'none',
  zIndex: 1,
  pointerEvents: 'none',
});

const boxShadow = (color: string) => `0px 2px ${shadowHeight}px -1px ${color}`;

const shadowStyles = css({
  height: shadowHeight,
  borderRadius: spacing[2],

  width: `calc(100% - ${shadowHeight})`,
  margin: '0 auto',
  marginTop: -shadowHeight,
});

const shadowStylesLight = css({
  boxShadow: boxShadow(transparentize(0.85, uiColors.black)),
});

const shadowStylesDark = css({
  boxShadow: boxShadow(transparentize(0.6, '#001e2b')),
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
  backgroundColor: uiColors.white,
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
          <div className={shadowContainerStyles}>
            <div
              className={cx(
                shadowStyles,
                darkMode ? shadowStylesDark : shadowStylesLight
              )}
            ></div>
          </div>
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
