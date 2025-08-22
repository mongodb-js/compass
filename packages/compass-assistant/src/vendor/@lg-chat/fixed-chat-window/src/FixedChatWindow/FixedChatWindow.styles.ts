import { css } from '@mongodb-js/compass-components';
import { transitionDuration } from '@mongodb-js/compass-components';

export const baseStyles = css`
  position: relative;
`;

export const chatWindowContainerStyles = css`
  transition: all ${transitionDuration.default}ms ease-in-out;
  transform-origin: bottom right;
  min-width: 360px;
  width: 360px;
`;

export const chatWindowStyles = css`
  border-radius: 24px;
`;
