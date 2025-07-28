import { css } from '@leafygreen-ui/emotion';

import { GRID_AREA } from '../constants';

export const contentStyles = css`
  grid-area: ${GRID_AREA.content};
  overflow: scroll;
  height: inherit;
`;
