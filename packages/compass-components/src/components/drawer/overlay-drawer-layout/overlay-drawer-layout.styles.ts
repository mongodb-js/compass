import { css, cx } from '@leafygreen-ui/emotion';

import { GRID_AREA, TOOLBAR_WIDTH } from '../constants';

const baseStyles = css`
  width: 100%;
  position: relative;
  height: inherit;
`;

const drawerBaseStyles = css`
  display: grid;
  grid-template-columns: auto 0px;
  overflow: hidden;
`;

const toolbarBaseStyles = css`
  display: grid;
  grid-template-columns: auto ${TOOLBAR_WIDTH}px;
  grid-template-areas: '${GRID_AREA.content} ${GRID_AREA.drawer}';
  height: 100%;
`;

export const getOverlayDrawerLayoutStyles = ({
  className,
  hasToolbar = false,
}: {
  className?: string;
  hasToolbar?: boolean;
}) =>
  cx(
    baseStyles,
    {
      [toolbarBaseStyles]: hasToolbar,
      [drawerBaseStyles]: !hasToolbar,
    },
    className
  );
