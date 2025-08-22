import { css } from '@mongodb-js/compass-components';
import { borderRadius, spacing } from '@mongodb-js/compass-components';

export const scrollButtonContainerStyles = css`
  position: absolute;
  bottom: ${spacing[400]}px;
`;

export const scrollButtonStyles = css`
  box-shadow: 0 ${spacing[50]}px ${spacing[100]}px rgba(0, 0, 0, 0.2);
  border-radius: ${borderRadius[400]}px;
`;
