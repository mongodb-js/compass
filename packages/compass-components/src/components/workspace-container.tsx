import React, { useRef } from 'react';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { rgba } from 'polished';
import { useInView } from 'react-intersection-observer';
import { useDarkMode } from '../hooks/use-theme';

const workspacetoolbarContainerQueryName = 'compass-workspace-container';

const workspaceContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const toolbarStyles = css({
  flex: 'none',
  containerName: workspacetoolbarContainerQueryName,
  containerType: 'inline-size',
});

const scrollBoxStyles = css({
  flex: 1,
  width: '100%',
  minHeight: 0,
  position: 'relative',
  zIndex: 0,
});

const shadowHeight = spacing[4];

const fadeIn = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

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
  // Animation prevents possible flicker when in-view trigger that is
  // responsible for showing the shadow very quickly switches between being
  // hidden to being visible again (that is the case where we don't unmount
  // collection tabs and just use display: none to hide them)
  animation: `${fadeIn} .1s linear`,
});

const boxShadow = (color: string) => `0px 2px ${shadowHeight}px -1px ${color}`;

const shadowStyles = css({
  height: shadowHeight,
  borderRadius: spacing[2],

  width: `calc(100% - ${shadowHeight}px)`,
  margin: '0 auto',
  marginTop: -shadowHeight,
});

const shadowStylesLight = css({
  boxShadow: boxShadow(rgba(palette.black, 0.15)),
});

const shadowStylesDark = css({
  boxShadow: boxShadow(rgba(palette.black, 0.4)),
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
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const darkThemeStyles = css({
  backgroundColor: palette.black,
  color: palette.white,
});

type WorkspaceContainerProps = {
  toolbar?: React.ReactNode;
  toolbarRef?: React.Ref<HTMLDivElement>;
  scrollableContainerRef?: React.Ref<HTMLDivElement>;
  initialTopInView?: boolean;
  'data-testid'?: string;
};

function WorkspaceContainer({
  className,
  children,
  toolbar,
  toolbarRef,
  scrollableContainerRef,
  initialTopInView = true,
  'data-testid': dataTestId,
  ...props
}: WorkspaceContainerProps &
  React.HTMLProps<HTMLDivElement> & {
    children:
      | React.ReactNode
      | ((
          scrollTriggerRef: (node?: Element | null | undefined) => void
        ) => React.ReactNode);
  }) {
  const darkMode = useDarkMode();

  const scrollContainer = useRef(null);

  const [scrollDetectionTrigger, triggerStillInView] = useInView({
    root: scrollContainer.current,
    // Setting this value prevents flicker on initial mount. Default value is
    // `true`, if the value is not provided we assume that the trigger is at the
    // very top of the container, which is the most common case for the initial
    // mount
    initialInView: initialTopInView,
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
      {toolbar && (
        <div ref={toolbarRef} className={toolbarStyles}>
          {toolbar}
        </div>
      )}
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
        <div ref={scrollableContainerRef} className={workspaceContentStyles}>
          {typeof children === 'function' ? (
            children(scrollDetectionTrigger)
          ) : (
            <>
              <div ref={scrollDetectionTrigger}></div>
              {children}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

WorkspaceContainer.toolbarContainerQueryName =
  workspacetoolbarContainerQueryName;

export { WorkspaceContainer };
