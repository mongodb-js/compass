import { css, cx } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

const baseContainerStyles = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scroll-behavior: smooth;
  position: relative;
  padding: 0 ${spacing[400]}px;
  display: flex;
  flex-direction: column;
  gap: ${spacing[400]}px;
`;

export const getContainerStyles = (className?: string) =>
  cx(baseContainerStyles, className);
