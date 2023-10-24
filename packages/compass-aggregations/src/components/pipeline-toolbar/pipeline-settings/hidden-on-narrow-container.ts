import { css } from '@mongodb-js/compass-components';
import { workspaceContainerQueryName } from '@mongodb-js/compass-components';

export const hiddenOnNarrowContainerStyles = css({
  [`@container ${workspaceContainerQueryName} (width < 900px)`]: {
    display: 'none',
  },
});
