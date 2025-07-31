import { css, cx } from '@leafygreen-ui/emotion';
import { breakpoints } from '@leafygreen-ui/tokens';

import { GRID_AREA } from '../constants';
import { PANEL_WIDTH, TOOLBAR_WIDTH } from '../constants';
import { MOBILE_BREAKPOINT } from '../drawer';
import { drawerTransitionDuration } from '../drawer/drawer.styles';

const baseStyles = css`
  width: 100%;
  display: grid;
  grid-template-columns: auto 0;
  transition-property: grid-template-columns, grid-template-rows;
  transition-timing-function: ease-in-out;
  transition-duration: ${drawerTransitionDuration}ms;
  overflow: hidden;
  position: relative;
  height: 100%;
`;

const drawerBaseStyles = css`
  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    grid-template-columns: unset;
    grid-template-rows: 100% 0;
  }
`;

// If there is no toolbar and the drawer is open, we need to shift the layout by the panel width;
const drawerOpenStyles = css`
  grid-template-columns: auto ${PANEL_WIDTH}px;

  @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    grid-template-rows: 50% 50%;
  }
`;

const withToolbarBaseStyles = css`
  grid-template-columns: auto ${TOOLBAR_WIDTH}px;
  grid-template-areas: '${GRID_AREA.content} ${GRID_AREA.drawer}';
`;

// If there is a toolbar and the drawer is open, we need to shift the layout by toolbar width + panel width;
const withToolbarOpenStyles = css`
  grid-template-columns: auto ${PANEL_WIDTH + TOOLBAR_WIDTH}px;

  @media only screen and (max-width: ${breakpoints.Tablet}px) {
    grid-template-columns: auto ${TOOLBAR_WIDTH}px;
  }
`;

export const getEmbeddedDrawerLayoutStyles = ({
  className,
  isDrawerOpen,
  hasToolbar = false,
}: {
  className?: string;
  isDrawerOpen: boolean;
  hasToolbar?: boolean;
}) =>
  cx(
    baseStyles,
    {
      [withToolbarBaseStyles]: hasToolbar,
      [withToolbarOpenStyles]: isDrawerOpen && hasToolbar,
      [drawerBaseStyles]: !hasToolbar,
      [drawerOpenStyles]: isDrawerOpen && !hasToolbar,
    },
    className
  );
