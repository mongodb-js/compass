import { css } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

export const baseStyles = css`
  display: grid;
  gap: ${spacing[200]}px;
  grid-template-columns: repeat(2, 1fr);

  @container (min-width: 360px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
