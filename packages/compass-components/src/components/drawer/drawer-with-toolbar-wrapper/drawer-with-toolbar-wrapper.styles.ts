import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import type { Theme } from '@leafygreen-ui/lib';
import { addOverflowShadow, breakpoints, Side } from '@leafygreen-ui/tokens';
import { toolbarClassName } from '../../toolbar';

import { GRID_AREA } from '../constants';
import { PANEL_WIDTH, TOOLBAR_WIDTH } from '../constants';
import {
  drawerClassName,
  drawerTransitionDuration,
} from '../drawer/drawer.styles';
import { DisplayMode } from '../drawer/drawer.types';

const MOBILE_BREAKPOINT = breakpoints.Tablet;
const SHADOW_WIDTH = 36; // Width of the shadow padding on the left side

const drawerIn = keyframes`
  from {
    // Because of .show() and .close() in the drawer component, transitioning from 0px to (x)px does not transition correctly. Using 1px along with css animations is a workaround to get the animation to work.
    grid-template-columns: ${TOOLBAR_WIDTH}px 1px;
  }
  to {
    grid-template-columns: ${TOOLBAR_WIDTH}px ${PANEL_WIDTH}px;
  }
`;

const drawerOut = keyframes`
  from {
    grid-template-columns: ${TOOLBAR_WIDTH}px ${PANEL_WIDTH}px;
  }
  to {
    grid-template-columns: ${TOOLBAR_WIDTH}px 0px;
  }
`;

const drawerOutMobile = keyframes`
  from {
    grid-template-columns: ${TOOLBAR_WIDTH}px calc(100vw - ${
  TOOLBAR_WIDTH * 2
}px);
  }
  to {
    grid-template-columns: ${TOOLBAR_WIDTH}px 0px;
  }
`;

const drawerInMobile = keyframes`
  from {
    grid-template-columns: ${TOOLBAR_WIDTH}px 1px;
  }
  to {
    grid-template-columns: ${TOOLBAR_WIDTH}px calc(100vw - ${
  TOOLBAR_WIDTH * 2
}px);
  }
`;

// This animation is used to animate the padding of the drawer when it closes, so that the padding does not block the content underneath it.
const drawerPaddingOut = keyframes`
  0% {
    padding-left: ${SHADOW_WIDTH}px;
  }
  99% {
    padding-left: ${SHADOW_WIDTH}px;
  }
  100% {
    padding-left: 0px;
  }
`;

const openStyles = css`
  animation-name: ${drawerIn};
  animation-fill-mode: forwards;

  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    animation-name: ${drawerInMobile};
  }
`;

const closedStyles = css`
  animation-name: ${drawerOut};

  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    animation-name: ${drawerOutMobile};
  }
`;

const getDrawerShadowStyles = ({ theme }: { theme: Theme }) => css`
  ${addOverflowShadow({ isInside: false, side: Side.Left, theme })};

  // Need this to show the box shadow since we are using overflow: hidden
  padding-left: ${SHADOW_WIDTH}px;

  &::before {
    transition-property: opacity;
    transition-duration: ${drawerTransitionDuration}ms;
    transition-timing-function: ease-in-out;
    opacity: 1;
    left: ${SHADOW_WIDTH}px;
  }
`;

const baseStyles = css`
  display: grid;
  grid-template-columns: ${TOOLBAR_WIDTH}px 0px;
  grid-template-areas: '${GRID_AREA.toolbar} ${GRID_AREA.innerDrawer}';
  grid-area: ${GRID_AREA.drawer};
  justify-self: end;
  animation-timing-function: ease-in-out;
  animation-duration: ${drawerTransitionDuration}ms;
  z-index: 0;
  height: 100%;
  overflow: hidden;

  .${toolbarClassName} {
    grid-area: ${GRID_AREA.toolbar};
  }

  .${drawerClassName} {
    grid-area: ${GRID_AREA.innerDrawer};
    position: unset;
    transition: none;
    transform: unset;
    overflow: hidden;
    opacity: 1;
    border-left: 0;
    border-right: 0;
    height: 100%;
    animation: none;

    > div::before {
      box-shadow: unset;
    }
  }
`;

const closedDrawerShadowStyles = css`
  padding-left: 0;
  animation-name: ${drawerPaddingOut};
  animation-timing-function: ease-in-out;
  animation-duration: ${drawerTransitionDuration}ms;

  ::before {
    opacity: 0;
  }
`;

export const getDrawerWithToolbarWrapperStyles = ({
  className,
  isDrawerOpen,
  shouldAnimate,
  displayMode,
  theme,
}: {
  className?: string;
  isDrawerOpen: boolean;
  shouldAnimate?: boolean;
  displayMode: DisplayMode;
  theme: Theme;
}) =>
  cx(
    baseStyles,
    {
      [getDrawerShadowStyles({ theme })]: displayMode === DisplayMode.Overlay,
      [closedDrawerShadowStyles]:
        displayMode === DisplayMode.Overlay && !isDrawerOpen,
      [openStyles]: isDrawerOpen,
      [closedStyles]: !isDrawerOpen && shouldAnimate, // This ensures that the drawer does not animate closed on initial render
    },
    className
  );
