import { css } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

export const baseStyles = css`
  h1 + *,
  h2 + *,
  h3 + * {
    margin-top: ${spacing[3]}px;
  }

  p + p {
    margin-top: ${spacing[2]}px;
  }
`;
