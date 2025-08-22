import { css } from '@mongodb-js/compass-components';
import { shim_transitionDuration } from '@mongodb-js/compass-components';

export const baseStyles = css`
  position: relative;
`;

export const chatWindowContainerStyles = css`
  transition: all ${shim_transitionDuration.default}ms ease-in-out;
  transform-origin: bottom right;
  min-width: 360px;
  width: 360px;
`;

export const chatWindowStyles = css`
  border-radius: 24px;
`;
