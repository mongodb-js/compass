import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import React from 'react';

const formFieldContainerStyles = css({
  margin: `${spacing[4]}px 0`,
});

function FormFieldContainer({
  className = '',
  children,
}: {
  key?: string;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cx(formFieldContainerStyles, className)}>{children}</div>
  );
}

export default FormFieldContainer;
