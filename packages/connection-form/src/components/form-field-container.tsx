import { spacing, css, cx } from '@mongodb-js/compass-components';
import React from 'react';

const formFieldContainerStyles = css({
  marginTop: spacing[3],
  width: spacing[7] * 6,
});

function FormFieldContainer({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cx(formFieldContainerStyles, className)}>{children}</div>
  );
}

export default FormFieldContainer;
