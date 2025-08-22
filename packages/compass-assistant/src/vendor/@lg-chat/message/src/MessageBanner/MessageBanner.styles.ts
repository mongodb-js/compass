import { css, cx } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

/**
 * These base styles override the default styles of the LG Banner component.
 */
export const baseStyles = css`
  // Remove the Banner's left border wedge
  &::before {
    content: '';
    background: transparent;
  }
  // Customize the border
  border-width: ${spacing[25]}px;
  border-radius: ${spacing[600]}px;

  max-width: fit-content;
  padding: ${spacing[200]}px ${spacing[300]}px;
`;

export const multilineStyles = css`
  border-radius: ${spacing[300]}px;
`;

export const getMessageBannerStyles = ({
  className,
  isMultiline,
}: {
  className?: string;
  isMultiline: boolean;
}) =>
  cx(
    baseStyles,
    {
      [multilineStyles]: isMultiline,
    },
    className
  );
