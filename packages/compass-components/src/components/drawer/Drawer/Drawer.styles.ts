import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { createUniqueClassName, type Theme } from '@leafygreen-ui/lib';
import {
  addOverflowShadow,
  color,
  Side,
  spacing,
  transitionDuration,
} from '@leafygreen-ui/tokens';

import { PANEL_WIDTH } from '../constants';

import { HEADER_HEIGHT, MOBILE_BREAKPOINT } from './drawer.constants';
import { DisplayMode } from './drawer.types';

export const drawerTransitionDuration = transitionDuration.slower;

export const drawerClassName = createUniqueClassName('lg-drawer');

// Because of .show() and .close() in the drawer component, transitioning from 0px to (x)px does not transition correctly. Having the drawer start at the open position while hidden, moving to the closed position, and then animating to the open position is a workaround to get the animation to work.
// These styles are used for a standalone drawer in overlay mode since it is not part of a grid layout.
const drawerIn = keyframes`
  0% {
    transform: translate3d(0%, 0, 0);
    opacity: 0;
    visibility: hidden; 
  }
  1% {
   transform: translate3d(100%, 0, 0);
    opacity: 1;
    visibility: visible;
  }
  100% {
    transform: translate3d(0%, 0, 0);
  }
`;

// Keep the drawer opacity at 1 until the end of the animation. The inner container opacity is transitioned separately.
const drawerOut = keyframes`
  0% {
    transform: translate3d(0%, 0, 0);
  }
  99% {
    transform: translate3d(100%, 0, 0);
    opacity: 1;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
`;

const getBaseStyles = ({ theme }: { theme: Theme }) => css`
  all: unset;
  background-color: ${color[theme].background.primary.default};
  border: 1px solid ${color[theme].border.secondary.default};
  width: 100%;
  max-width: ${PANEL_WIDTH}px;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;

  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    max-width: 100%;
    height: 50vh;
  }
`;

const overlayOpenStyles = css`
  opacity: 1;
  animation-name: ${drawerIn};

  // On mobile, the drawer should be positioned at the bottom of the screen when closed, and slide up to the top when opened.
  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    transform: none;
  }
`;

const overlayClosedStyles = css`
  pointer-events: none;
  animation-name: ${drawerOut};

  // On mobile, the drawer should be positioned at the bottom of the screen when closed, and slide up to the top when opened.
  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    transform: translate3d(0, 100%, 0);
    opacity: 0;
  }
`;

const getOverlayStyles = ({
  open,
  shouldAnimate,
  zIndex,
}: {
  open: boolean;
  shouldAnimate: boolean;
  zIndex: number;
}) =>
  cx(
    css`
      position: absolute;
      z-index: ${zIndex};
      top: 0;
      bottom: 0;
      right: 0;
      overflow: visible;

      // By default, the drawer is positioned off-screen to the right.
      transform: translate3d(100%, 0, 0);
      animation-timing-function: ease-in-out;
      animation-duration: ${drawerTransitionDuration}ms;
      animation-fill-mode: forwards;

      @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
        top: unset;
        left: 0;
        // Since the drawer has position: fixed, we can use normal transitions
        animation: none;
        position: fixed;
        transform: translate3d(0, 100%, 0);
        transition: transform ${drawerTransitionDuration}ms ease-in-out,
          opacity ${drawerTransitionDuration}ms ease-in-out
            ${open ? '0ms' : `${drawerTransitionDuration}ms`};
      }
    `,
    {
      [overlayOpenStyles]: open,
      [overlayClosedStyles]: !open && shouldAnimate, // This ensures that the drawer does not animate closed on initial render
    }
  );

const getDisplayModeStyles = ({
  displayMode,
  open,
  shouldAnimate,
  zIndex,
}: {
  displayMode: DisplayMode;
  open: boolean;
  shouldAnimate: boolean;
  zIndex: number;
}) =>
  cx({
    [getOverlayStyles({ open, shouldAnimate, zIndex })]:
      displayMode === DisplayMode.Overlay,
  });

export const getDrawerStyles = ({
  className,
  displayMode,
  open,
  shouldAnimate,
  theme,
  zIndex,
}: {
  className?: string;
  displayMode: DisplayMode;
  open: boolean;
  shouldAnimate: boolean;
  theme: Theme;
  zIndex: number;
}) =>
  cx(
    getBaseStyles({ theme }),
    getDisplayModeStyles({ displayMode, open, shouldAnimate, zIndex }),
    className,
    drawerClassName
  );

export const getDrawerShadowStyles = ({
  theme,
  displayMode,
}: {
  theme: Theme;
  displayMode: DisplayMode;
}) =>
  cx(
    css`
      height: 100%;
      background-color: ${color[theme].background.primary.default};
    `,
    {
      [css`
        ${addOverflowShadow({ isInside: false, side: Side.Left, theme })};

        @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
          ${addOverflowShadow({ isInside: false, side: Side.Top, theme })};
        }
      `]: displayMode === DisplayMode.Overlay,
    }
  );

const getBaseInnerContainerStyles = ({ theme }: { theme: Theme }) => css`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${color[theme].background.primary.default};
  opacity: 0;
  transition-property: opacity;
  transition-duration: ${transitionDuration.faster}ms;
  transition-timing-function: linear;
`;

const getInnerOpenContainerStyles = css`
  transition-property: opacity;
  transition-duration: ${transitionDuration.slowest}ms;
  transition-timing-function: linear;
  opacity: 1;
`;

export const getInnerContainerStyles = ({
  theme,
  open,
}: {
  theme: Theme;
  open: boolean;
}) =>
  cx(getBaseInnerContainerStyles({ theme }), {
    [getInnerOpenContainerStyles]: open,
  });

export const getHeaderStyles = ({ theme }: { theme: Theme }) => css`
  height: ${HEADER_HEIGHT}px;
  padding: ${spacing[400]}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${color[theme].border.secondary.default};
  transition-property: box-shadow;
  transition-duration: ${transitionDuration.faster}ms;
  transition-timing-function: ease-in-out;
`;

const baseChildrenContainerStyles = css`
  height: 100%;
  overflow: hidden;
`;

export const getChildrenContainerStyles = ({
  hasShadowTop,
  theme,
}: {
  hasShadowTop: boolean;
  theme: Theme;
}) =>
  cx(baseChildrenContainerStyles, {
    [addOverflowShadow({ isInside: true, side: Side.Top, theme })]:
      hasShadowTop,
  });

const baseInnerChildrenContainerStyles = css`
  height: 100%;
`;

const scrollContainerStyles = css`
  padding: ${spacing[400]}px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const innerChildrenContainerStyles = cx(
  baseInnerChildrenContainerStyles,
  scrollContainerStyles
);
